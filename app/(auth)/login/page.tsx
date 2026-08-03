"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Alert, Button, InputField } from "@/components/ui/form";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError("Email o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-zinc-900">Iniciar sesión</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Accedé a los impuestos compartidos de tu hogar.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <InputField
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <InputField
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error ? <Alert>{error}</Alert> : null}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Ingresando..." : "Ingresar"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-600">
        ¿No tenés cuenta?{" "}
        <Link href="/registro" className="font-medium text-emerald-700">
          Registrate
        </Link>
      </p>
    </div>
  );
}
