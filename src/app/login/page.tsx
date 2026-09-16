"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function LoginPage() {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        return;
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="app-shell">
      <div className="container">
        <section className="panel header" style={{ maxWidth: 520, margin: "40px auto" }}>
          <div className="header-grid">
            <div>
              <h1>Sign in</h1>
              <p>Open your saved plans and keep working where you left off.</p>
            </div>
            <form className="fields" style={{ gridTemplateColumns: "1fr" }} onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="password">Password</label>
                <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              {error && <p style={{ color: "#dc2626", fontSize: 13 }}>{error}</p>}
              <div className="actions">
                <button type="submit" className="primary" disabled={busy}>{busy ? "Signing in…" : "Sign In"}</button>
              </div>
            </form>
            <p>Need an account? <Link href="/signup">Create one</Link></p>
          </div>
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
