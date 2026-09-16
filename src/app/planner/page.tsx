import { Suspense } from "react";
import { PlannerApp } from "@/components/planner/PlannerApp";

export default function PlannerPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Loading planner...</div>}>
      <PlannerApp />
    </Suspense>
  );
}
