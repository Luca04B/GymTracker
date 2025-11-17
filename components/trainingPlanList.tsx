"use client";

import LoadingSpinner from "@/components/loadingSpinner";

interface PlanItem {
  exerciseId: string;
  name: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  weight: number;
}

interface TrainingPlan {
  id: string;
  name: string;
  items: PlanItem[];
  createdAt: any;
}

interface Props {
  plans: TrainingPlan[];
  loading: boolean;
  onSelectPlan: (plan: TrainingPlan) => void;
}

export default function TrainingPlanList({ plans, loading, onSelectPlan }: Props) {
  if (loading) return <LoadingSpinner message="Lade Trainingspläne..." />;

  if (plans.length === 0)
    return <div className="text-gray-600 mt-4">Keine Trainingspläne gefunden</div>;

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-3">Meine Trainingspläne</h2>
      <div className="space-y-2">
        {plans.map((plan) => (
          <button
            key={plan.id}
            onClick={() => onSelectPlan(plan)}
            className="w-full text-left p-3 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300 shadow-sm"
          >
            <div className="font-bold">{plan.name}</div>
            <div className="text-sm text-gray-600">
              {plan.items.length} Übung{plan.items.length !== 1 ? "en" : ""}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
