"use client";

import { useState } from "react";
import LoadingSpinner from "@/components/loadingSpinner";

interface PlanItem {
  exerciseId: string;
  name: string;
  sets: number;
  repsMin: number;
  repsMax: number;
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
  onDeletePlan?: (planId: string) => void;
  showDelete?: boolean;
  onEmptyClick?: () => void; 
}

export default function TrainingPlanList({
  plans,
  loading,
  onEmptyClick,
  onSelectPlan,
  onDeletePlan,
  showDelete = false,
}: Props) {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  if (loading) return <LoadingSpinner message="Lade Trainingspläne..." />;

 if (plans.length === 0 && showDelete === true)
  return (
    <div className="flex flex-col items-center justify-center mt-10 p-6 bg-gray-50 border border-gray-200 rounded-xl shadow-md text-center">
      <p className="text-gray-600 font-medium text-lg">
        Es wurden noch keine Trainingspläne erstellt.
      </p>
      <p className="text-gray-400 mt-1 text-sm">
        Du kannst einen neuen Trainingsplan oben hinzufügen.
      </p>
    </div>
  );

  if (plans.length === 0 && showDelete === false)
  return (
     <div
        className="flex flex-col items-center justify-center mt-10 p-6 bg-gray-50 border border-gray-200 rounded-xl shadow-md text-center cursor-pointer hover:bg-gray-100 transition"
        onClick={onEmptyClick}
      >
        <div className="text-4xl font-bold text-gray-400 mb-2">+</div>
        <p className="text-gray-600 font-medium text-lg">
          Hier drücken, um einen neuen Plan zu erstellen
        </p>
      </div>
  );


  const confirmDelete = () => {
  if (!selectedPlanId || !onDeletePlan) return;
  onDeletePlan(selectedPlanId); 
  setShowDialog(false); 
  setSelectedPlanId(null);
};


  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-3">Meine Trainingspläne</h2>

      <div className="space-y-2">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="w-full p-3 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300 shadow-sm flex justify-between items-center"
            onClick={() => onSelectPlan(plan)}
          >
            <div>
              <div className="font-bold">{plan.name}</div>
              <div className="text-sm text-gray-600">
                {plan.items.length} Übung{plan.items.length !== 1 ? "en" : ""}
              </div>
            </div>

            {showDelete && (
              <button
              className="text-red-500 font-bold ml-4 hover:text-red-700"
                onClick={(e) => {
                  e.stopPropagation(); 
                  setSelectedPlanId(plan.id);
                  setShowDialog(true);
                }}
              >
                ✖
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg max-w-sm w-full text-center">
            <h3 className="text-lg font-semibold mb-4">
              Willst du diesen Trainingsplan wirklich löschen?
            </h3>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowDialog(false)}
                className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
              >
                Abbrechen
              </button>

              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
