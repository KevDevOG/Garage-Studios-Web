import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { escapeHtml, escapeHtmlMultiline } from "@/lib/html";
import { sanitizeSearchTerm, buildIlikePattern, buildOrIlike } from "@/lib/search";
import { actionOk, actionError, getErrorMessage } from "@/lib/action-result";

describe("escapeHtml", () => {
  it("neutraliza etiquetas y atributos en los correos", () => {
    assert.equal(
      escapeHtml('<img src=x onerror="alert(1)">'),
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"
    );
    assert.equal(escapeHtml("Tom & Jerry's"), "Tom &amp; Jerry&#39;s");
    assert.equal(escapeHtml(null), "");
    assert.equal(escapeHtml(120), "120");
  });

  it("convierte saltos de línea en <br/> tras escapar", () => {
    assert.equal(escapeHtmlMultiline("a\n<b>"), "a<br/>&lt;b&gt;");
  });
});

describe("sanitizeSearchTerm", () => {
  it("elimina la sintaxis de filtros PostgREST", () => {
    assert.equal(sanitizeSearchTerm("ana,email.ilike.%(x)"), "ana email ilike \\% x");
  });

  it("escapa comodines LIKE y recorta espacios", () => {
    assert.equal(sanitizeSearchTerm("  50%_off  "), "50\\%\\_off");
  });

  it("limita la longitud y rechaza valores no string", () => {
    assert.equal(sanitizeSearchTerm("a".repeat(200)).length, 80);
    assert.equal(sanitizeSearchTerm(42), "");
  });

  it("buildIlikePattern exige un mínimo de caracteres útiles", () => {
    assert.equal(buildIlikePattern("a"), null);
    assert.equal(buildIlikePattern("%%"), null);
    assert.equal(buildIlikePattern("Ana"), "%Ana%");
  });

  it("buildOrIlike compone el filtro por columnas", () => {
    assert.equal(buildOrIlike(["nombre", "email"], "%ana%"), "nombre.ilike.%ana%,email.ilike.%ana%");
  });
});

describe("action-result", () => {
  it("construye resultados tipados", () => {
    assert.deepEqual(actionOk(), { ok: true, data: undefined });
    assert.deepEqual(actionOk({ count: 2 }), { ok: true, data: { count: 2 } });
    assert.deepEqual(actionError("fallo"), { ok: false, error: "fallo" });
  });

  it("getErrorMessage oculta los errores genéricos de Server Components", () => {
    assert.equal(getErrorMessage(new Error("An error occurred in the Server Components render"), "x"), "x");
    assert.equal(getErrorMessage(new Error("Horario ocupado"), "x"), "Horario ocupado");
    assert.equal(getErrorMessage("string", "x"), "x");
  });
});
