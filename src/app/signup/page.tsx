"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function SignupPage() {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
        return;
      }
      if (data.session) {
        router.push("/dashboard");
        return;
      }
      setInfo("Check your email to confirm your account, then sign in.");
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
              <h1>Create account</h1>
              <p>Save evacuation maps to your dashboard automatically.</p>
            </div>
            <form className="fields" style={{ gridTemplateColumns: "1fr" }} onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="password">Password</label>
                <input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              {error && <p style={{ color: "#dc2626", fontSize: 13 }}>{error}</p>}
              {info && <p style={{ color: "#16a34a", fontSize: 13 }}>{info}</p>}
              <div className="actions">
                <button type="submit" className="primary" disabled={busy}>{busy ? "Creating…" : "Sign Up"}</button>
              </div>
            </form>
            <p>Already have an account? <Link href="/login">Sign in</Link></p>
          </div>
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
