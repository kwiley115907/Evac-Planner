"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { getSupabaseClient } from "@/lib/supabaseClient";

interface PlanSummary {
  id: string;
  title: string;
  updated_at: string;
}

export default function DashboardPage() {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const router = useRouter();
  const [plans, setPlans] = useState<PlanSummary[] | null>(null);
  const [creating, setCreating] = useState(false);

  const loadPlans = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    const { data } = await supabase
      .from("plans")
      .select("id, title, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    setPlans(data ?? []);
  }, [supabase, router]);

  useEffect(() => {
    // Fetch-on-mount: setPlans only runs after the awaited Supabase calls
    // resolve, not synchronously within this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPlans();
  }, [loadPlans]);

  async function handleNewPlan() {
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const { data, error } = await supabase
        .from("plans")
        .insert({ user_id: user.id, title: "Untitled plan", data: {} })
        .select("id")
        .single();
      if (error || !data) {
        window.alert(error?.message ?? "Could not create a new plan.");
        return;
      }
      router.push(`/planner?id=${data.id}`);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this plan? This cannot be undone.")) return;
    await supabase.from("plans").delete().eq("id", id);
    loadPlans();
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <main className="app-shell">
      <div className="container">
        <section className="panel header">
          <div className="header-grid">
            <div className="main-top">
              <div>
                <h1>Your Dashboard</h1>
                <p>Every map autosaves here.</p>
              </div>
              <div className="actions">
                <button type="button" className="primary" onClick={handleNewPlan} disabled={creating}>
                  {creating ? "Creating…" : "New Plan"}
                </button>
                <button type="button" onClick={handleSignOut}>Sign Out</button>
              </div>
            </div>

            {plans === null ? (
              <p>Loading...</p>
            ) : plans.length === 0 ? (
              <p>No plans yet. Click &quot;New Plan&quot; to build your first evacuation map.</p>
            ) : (
              <div className="tool-list">
                {plans.map((plan) => (
                  <div key={plan.id} className="toggle">
                    <span className="meta">
                      <strong>{plan.title || "Untitled plan"}</strong>
                      <span>Last updated {new Date(plan.updated_at).toLocaleString()}</span>
                    </span>
                    <div className="actions" style={{ marginTop: 0 }}>
                      <button type="button" className="primary" onClick={() => router.push(`/planner?id=${plan.id}`)}>Open</button>
                      <button type="button" className="danger" onClick={() => handleDelete(plan.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
