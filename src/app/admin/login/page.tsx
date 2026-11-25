"use client";

import { useState } from "react";
import Link from "next/link";
import { loginAction } from "@/app/actions/auth";
import { Field, Notice, buttonClass } from "@/components/admin/ui";

export default function AdminLoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await loginAction(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <section className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-[360px]">
        <div className="mb-8">
          <p className="gs-display text-[22px] font-semibold leading-none text-gs-paper">Garage Studios</p>
          <p className="mt-1.5 text-[13px] text-gs-faint">Consola del estudio</p>
        </div>

        <h1 className="sr-only">Entrar al panel</h1>

        <form action={handleSubmit} className="space-y-4">
          <Field label="Correo" htmlFor="email">
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              placeholder="correo@ejemplo.com"
            />
          </Field>

          <Field label="Contraseña" htmlFor="password">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </Field>

          {error && <Notice tone="bad">{error}</Notice>}

          <button type="submit" disabled={loading} className={buttonClass("primary", "md", "w-full")}>
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-[13px]">
          <Link href="/" className="text-gs-soft underline decoration-gs-line-strong underline-offset-4 hover:text-gs-paper">
            Volver a la web
          </Link>
        </p>
      </div>
    </section>
  );
}
