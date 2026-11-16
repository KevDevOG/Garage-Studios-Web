import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { isAuthorizedAdmin } from "@/lib/admin-allowlist";
import { buildReservationIcs, isIcsLinkActive, escapeIcs } from "@/lib/ics";
import { validateBlockInput } from "@/lib/reservation-rules";

// ── Doble de prueba mínimo del cliente Supabase ──────────────
interface FakeResult {
  data: unknown;
  error: { code: string } | null;
}

function fakeClient(result: FakeResult) {
  const calls: { table?: string; column?: string; value?: unknown } = {};
  const client = {
    from(table: string) {
      calls.table = table;
      return {
        select() {
          return {
            eq(column: string, value: unknown) {
              calls.column = column;
              calls.value = value;
              return { maybeSingle: async () => result };
            },
          };
        },
      };
    },
  };
  return { client: client as unknown as SupabaseClient, calls };
}

const USER = { id: "0dc87e42-370c-49ae-b1fa-3e61fbea1e3a", is_anonymous: false } as User;

describe("isAuthorizedAdmin (lista privada de administradores)", () => {
  it("rechaza sin sesión", async () => {
    const { client } = fakeClient({ data: { id: USER.id }, error: null });
    assert.equal(await isAuthorizedAdmin(client, null), false);
  });

  it("rechaza usuarios anónimos aunque tengan sesión", async () => {
    const { client } = fakeClient({ data: { id: USER.id }, error: null });
    assert.equal(await isAuthorizedAdmin(client, { ...USER, is_anonymous: true } as User), false);
  });

  it("rechaza una cuenta válida que no está en la lista", async () => {
    const { client } = fakeClient({ data: null, error: null });
    assert.equal(await isAuthorizedAdmin(client, USER), false);
  });

  it("falla cerrado si no puede consultar la lista", async () => {
    const { client } = fakeClient({ data: { id: USER.id }, error: { code: "42501" } });
    const originalError = console.error;
    console.error = () => {};
    try {
      assert.equal(await isAuthorizedAdmin(client, USER), false);
    } finally {
      console.error = originalError;
    }
  });

  it("acepta a quien está en la lista, buscando por su id de Auth", async () => {
    const { client, calls } = fakeClient({ data: { id: USER.id }, error: null });
    assert.equal(await isAuthorizedAdmin(client, USER), true);
    assert.deepEqual(calls, { table: "administrador", column: "id", value: USER.id });
  });
});

describe("enlace .ics: privacidad y caducidad", () => {
  const reserva = {
    fecha_reserva: "2026-11-20",
    hora_inicio: "23:00:00",
    hora_fin: "24:00:00",
    servicio_nombre: "Grabación; voz, mezcla",
  };

  it("no incluye datos personales del cliente", () => {
    const ics = buildReservationIcs("00000000-0000-4000-8000-0000000000aa", reserva);
    assert.doesNotMatch(ics, /Cliente:/);
    assert.doesNotMatch(ics, /@example\.com|ATTENDEE|ORGANIZER/);
  });

  it("usa CRLF, escapa el servicio y lleva la medianoche al día siguiente", () => {
    const ics = buildReservationIcs("tok", reserva, new Date("2026-11-16T10:00:00Z"));
    assert.ok(ics.includes("\r\n"));
    assert.ok(ics.includes("SUMMARY:Reserva Garage Studios - Grabación\\; voz\\, mezcla"));
    assert.ok(ics.includes("DTSTART;TZID=Atlantic/Canary:20261120T230000"));
    assert.ok(ics.includes("DTEND;TZID=Atlantic/Canary:20261121T000000"));
    assert.ok(ics.includes("DTSTAMP:20261116T100000Z"));
  });

  it("escapeIcs neutraliza saltos de línea (no se pueden inyectar propiedades)", () => {
    assert.equal(escapeIcs("a\r\nATTENDEE:x"), "a\\nATTENDEE:x");
  });

  it("el enlace caduca 30 días después de la sesión (hora de Canarias)", () => {
    assert.equal(isIcsLinkActive("2026-10-17", new Date("2026-11-16T12:00:00Z")), true); // día 30
    assert.equal(isIcsLinkActive("2026-10-16", new Date("2026-11-16T12:00:00Z")), false); // día 31
    assert.equal(isIcsLinkActive("2026-12-01", new Date("2026-11-16T12:00:00Z")), true); // futura
  });
});

describe("validateBlockInput (bloqueos de agenda del panel)", () => {
  it("normaliza el fin a medianoche como 24:00", () => {
    const r = validateBlockInput({ fecha: "2026-11-21", hora_inicio: "22:00", hora_fin: "00:00" });
    assert.deepEqual(r, {
      ok: true,
      data: { fecha: "2026-11-21", hora_inicio: "22:00", hora_fin: "24:00", motivo: null },
    });
  });

  it("acepta un bloqueo normal y recorta el motivo", () => {
    const r = validateBlockInput({ fecha: "2026-11-21", hora_inicio: "10:00", hora_fin: "14:00", motivo: "  Mantenimiento " });
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.data.motivo, "Mantenimiento");
  });

  it("rechaza fin anterior o igual al inicio, horas y fechas inválidas", () => {
    assert.equal(validateBlockInput({ fecha: "2026-11-21", hora_inicio: "14:00", hora_fin: "10:00" }).ok, false);
    assert.equal(validateBlockInput({ fecha: "2026-11-21", hora_inicio: "10:00", hora_fin: "10:00" }).ok, false);
    assert.equal(validateBlockInput({ fecha: "2026-02-30", hora_inicio: "10:00", hora_fin: "11:00" }).ok, false);
    assert.equal(validateBlockInput({ fecha: "2026-11-21", hora_inicio: "25:00", hora_fin: "26:00" }).ok, false);
    assert.equal(validateBlockInput({ fecha: "2026-11-21", hora_inicio: "10:00", hora_fin: "11:00", motivo: "x".repeat(201) }).ok, false);
    assert.equal(validateBlockInput(null).ok, false);
  });
});

// ── Guardas estáticas: la service role nunca llega al navegador ──
const SRC = join(process.cwd(), "src");

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return listSourceFiles(full);
    return /\.(ts|tsx|js|jsx|mjs)$/.test(name) ? [full] : [];
  });
}

const files = listSourceFiles(SRC).map((full) => ({
  path: relative(SRC, full).split(sep).join("/"),
  code: readFileSync(full, "utf8"),
}));

describe("SUPABASE_SERVICE_ROLE_KEY: solo servidor", () => {
  it("solo la lee src/lib/supabase/public.ts", () => {
    const readers = files.filter((f) => f.code.includes("SUPABASE_SERVICE_ROLE_KEY")).map((f) => f.path);
    assert.deepEqual(readers, ["lib/supabase/public.ts"]);
  });

  it("ese módulo está marcado server-only", () => {
    const mod = files.find((f) => f.path === "lib/supabase/public.ts");
    assert.ok(mod && /^import "server-only";/m.test(mod.code));
  });

  it("ningún componente cliente importa el módulo con la clave de servicio", () => {
    const offenders = files
      .filter((f) => /^["']use client["']/m.test(f.code) && f.code.includes("@/lib/supabase/public"))
      .map((f) => f.path);
    assert.deepEqual(offenders, []);
  });

  it("ninguna variable pública (NEXT_PUBLIC_*) contiene la clave de servicio", () => {
    const offenders = files.filter((f) => /NEXT_PUBLIC_\w*SERVICE/i.test(f.code)).map((f) => f.path);
    assert.deepEqual(offenders, []);
  });
});

describe("Lista de administradores: nadie se da de alta desde la web", () => {
  it("ningún archivo inserta en la tabla administrador", () => {
    const offenders = files
      .filter((f) => /from\(\s*["']administrador["']\s*\)[\s\S]{0,80}\.(insert|upsert|update|delete)\(/.test(f.code))
      .map((f) => f.path);
    assert.deepEqual(offenders, []);
  });
});
