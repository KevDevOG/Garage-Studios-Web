import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { verifyTurnstileToken, TURNSTILE_UNAVAILABLE_ERROR } from "@/lib/turnstile";

// ── Turnstile: falla en CERRADO ─────────────────────────────
const env = process.env as Record<string, string | undefined>;
const original = { fetch: globalThis.fetch, secret: env.TURNSTILE_SECRET_KEY, nodeEnv: env.NODE_ENV };
const quiet = { error: console.error, warn: console.warn };

function mockFetch(impl: (url: string, init?: RequestInit) => Promise<Response>) {
  const calls: { url: string; body: string }[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), body: String(init?.body ?? "") });
    return impl(String(input), init);
  }) as typeof fetch;
  return calls;
}

describe("verifyTurnstileToken (antispam)", () => {
  beforeEach(() => {
    env.TURNSTILE_SECRET_KEY = "secreto-de-prueba";
    env.NODE_ENV = "production";
    console.error = () => {};
    console.warn = () => {};
  });
  afterEach(() => {
    globalThis.fetch = original.fetch;
    env.TURNSTILE_SECRET_KEY = original.secret;
    env.NODE_ENV = original.nodeEnv;
    console.error = quiet.error;
    console.warn = quiet.warn;
  });

  it("acepta un token que Cloudflare valida y le envía la IP del cliente", async () => {
    const calls = mockFetch(async () => Response.json({ success: true }));
    assert.deepEqual(await verifyTurnstileToken("tok", "203.0.113.7"), { success: true });
    assert.equal(calls.length, 1);
    assert.match(calls[0].body, /remoteip=203\.0\.113\.7/);
  });

  it("rechaza un token inválido", async () => {
    mockFetch(async () => Response.json({ success: false, "error-codes": ["invalid-input-response"] }));
    assert.equal((await verifyTurnstileToken("tok")).success, false);
  });

  it("rechaza si Cloudflare no responde (antes se aceptaba)", async () => {
    mockFetch(async () => {
      throw new TypeError("fetch failed");
    });
    assert.deepEqual(await verifyTurnstileToken("tok"), { success: false, error: TURNSTILE_UNAVAILABLE_ERROR });
  });

  it("rechaza si Cloudflare devuelve un error HTTP o una respuesta no JSON", async () => {
    mockFetch(async () => new Response("bad gateway", { status: 502 }));
    assert.equal((await verifyTurnstileToken("tok")).success, false);
  });

  it("rechaza sin token, o con uno desmesurado, sin llamar a Cloudflare", async () => {
    const calls = mockFetch(async () => Response.json({ success: true }));
    assert.equal((await verifyTurnstileToken(undefined)).success, false);
    assert.equal((await verifyTurnstileToken("x".repeat(3000))).success, false);
    assert.equal(calls.length, 0);
  });

  it("en producción sin clave secreta rechaza (no se desactiva el captcha)", async () => {
    delete env.TURNSTILE_SECRET_KEY;
    assert.deepEqual(await verifyTurnstileToken("tok"), { success: false, error: TURNSTILE_UNAVAILABLE_ERROR });
  });

  it("solo en desarrollo y sin clave secreta permite enviar", async () => {
    delete env.TURNSTILE_SECRET_KEY;
    env.NODE_ENV = "development";
    assert.equal((await verifyTurnstileToken(undefined)).success, true);
  });
});

// ── Guardas estáticas: escrituras públicas solo desde el servidor ──
const src = (p: string) => readFileSync(join(process.cwd(), "src", p), "utf8");

describe("formularios públicos", () => {
  for (const file of ["app/actions/reservation.ts", "app/actions/contact.ts"]) {
    it(`${file} escribe con createPublicWriteClient y pasa Turnstile con la IP`, () => {
      const code = src(file);
      assert.match(code, /createPublicWriteClient\(\)/);
      assert.doesNotMatch(code, /createPublicClient\(/);
      assert.match(code, /verifyTurnstileToken\([^)]*getClientIp\(\)/);
      // Orden: validación → rate limit → Turnstile → base de datos
      const iRate = code.indexOf("checkRateLimit(");
      const iTurn = code.indexOf("verifyTurnstileToken(");
      const iDb = code.indexOf("createPublicWriteClient()");
      assert.ok(iRate > 0 && iRate < iTurn && iTurn < iDb, "Turnstile y rate limit deben ir antes de tocar la BD");
    });
  }

  it("la reserva aplica la cuota por contacto antes de insertar", () => {
    const code = src("app/actions/reservation.ts");
    assert.ok(code.indexOf("countPendingByContact(") < code.indexOf('.from("reserva").insert'));
  });
});
