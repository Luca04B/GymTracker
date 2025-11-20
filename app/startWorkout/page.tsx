"use client";

import { auth, db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/components/header";
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

export default function StartWorkoutPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<TrainingPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrainingPlans();
  }, []);

  const fetchTrainingPlans = async () => {
    const user = auth.currentUser;
    if (!user) {
      router.push("/login");
      return;
    }
  
    try {
      const plansQuery = query(
        collection(db, "users", user.uid, "trainingPlans")
      );
      
      const querySnapshot = await getDocs(plansQuery);
      const plansData: TrainingPlan[] = [];
      
      querySnapshot.forEach((doc) => {
        plansData.push({
          id: doc.id,
          ...doc.data()
        } as TrainingPlan);
      });
  
      plansData.sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate());
      setPlans(plansData);
    } catch (err) {
      console.error("Fehler beim Laden der Trainingspläne:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartWorkout = () => {
    if (!selectedPlan) return;
    router.push(`/workout/start?planId=${selectedPlan.id}`);
  };

  const handleBack = () => {
    router.push("/welcome");
  };

  // Berechne geschätzte Zeit für einen Plan
  const calculateEstimatedTime = (plan: TrainingPlan) => {
    const totalSets = plan.items.reduce((total, item) => total + item.sets, 0);
    // Annahme: 3 Minuten pro Satz (inkl. Pausen)
    return totalSets * 5;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="mt-18 flex justify-center items-center">
          <LoadingSpinner message="Lade Trainingspläne..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-hidden">
      <Header />

      <main className="mt-18 px-4 max-w-6xl mx-auto pb-8 mt-30">
        {/* Header mit Back Button */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleBack}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm"
          >
            ← Zurück
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Workout starten
          </h1>
        </div>

        {!selectedPlan ? (
          /* Plan Auswahl - Card Grid */
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Wähle deinen Trainingsplan
              </h2>
              <p className="text-gray-500">
                Klicke auf einen Plan, um die Details zu sehen
              </p>
            </div>

            {plans.length === 0 ? (
              /* Keine Pläne vorhanden */
              <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="text-6xl mb-4">💪</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Keine Trainingspläne gefunden
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Erstelle deinen ersten Trainingsplan, um mit dem Training zu beginnen.
                </p>
                <button
                  onClick={() => router.push("/trainingPlan")}
                  className="bg-sky-600 hover:bg-sky-800 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Trainingsplan erstellen
                </button>
              </div>
            ) : (
              /* Plans Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan)}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-emerald-300 cursor-pointer transform hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-lg text-gray-800 pr-2">
                        {plan.name}
                      </h3>
                      <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap">
                        {plan.items.length} Übung{plan.items.length !== 1 ? 'en' : ''}
                      </span>
                    </div>

                    {/* Übungsvorschau */}
                    <div className="space-y-2 mb-4">
                      {plan.items.slice(0, 3).map((item, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                          <span className="truncate">{item.name}</span>
                        </div>
                      ))}
                      {plan.items.length > 3 && (
                        <div className="text-xs text-gray-500 pl-4">
                          +{plan.items.length - 3} weitere Übungen
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex justify-between items-center text-sm border-t pt-3">
                      <div className="text-gray-600">
                        <span className="font-medium">{plan.items.reduce((total, item) => total + item.sets, 0)}</span> Sätze
                      </div>
                      <div className="text-emerald-600 font-medium">
                        ≈{calculateEstimatedTime(plan)} Min
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Ausgewählter Plan Details */
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* Header mit Back zu Auswahl */}
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setSelectedPlan(null)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm"
              >
                ← Anderen Plan wählen
              </button>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {selectedPlan.name}
                </h2>
                <p className="text-gray-600 text-sm">
                  {selectedPlan.items.length} Übungen • {calculateEstimatedTime(selectedPlan)} Minuten
                </p>
              </div>
            </div>

            {/* Start Button */}
            <div className="flex justify-center">
              <button
                onClick={handleStartWorkout}
                className="bg-emerald-400 hover:bg-emerald-600 text-white px-12 py-4 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 w-full md:w-auto min-w-[250px] flex items-center justify-center gap-3"
              >
                <span className="text-xl">🏋️</span>
                Workout starten
                <span className="text-xl">→</span>
              </button>
            </div>

            {/* Zusammenfassung */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 mb-8 mt-8">
              <h3 className="font-semibold text-emerald-800 mb-4 text-lg">Workout Zusammenfassung</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-emerald-600">{selectedPlan.items.length}</div>
                  <div className="text-emerald-700 text-sm">Übungen</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-600">
                    {selectedPlan.items.reduce((total, item) => total + item.sets, 0)}
                  </div>
                  <div className="text-emerald-700 text-sm">Gesamte Sätze</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-600">
                    {selectedPlan.items.reduce((total, item) => total + (item.repsMin + item.repsMax) / 2 * item.sets, 0).toFixed(0)}
                  </div>
                  <div className="text-emerald-700 text-sm">Ø Wiederholungen</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-600">
                    {calculateEstimatedTime(selectedPlan)}
                  </div>
                  <div className="text-emerald-700 text-sm">Geschätzte Minuten</div>
                </div>
              </div>
            </div>
            
            {/* Übungsliste */}
            <div className="space-y-4 mb-8">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Übungsplan</h3>
              {selectedPlan.items.map((item, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-white transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-emerald-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <h4 className="font-semibold text-gray-800 text-lg">
                          {item.name}
                        </h4>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 pl-9">
                        <span>
                          <strong>{item.sets}</strong> Sätze
                        </span>
                        <span>
                          <strong>{item.repsMin}-{item.repsMax}</strong> Wdh. pro Satz
                        </span>
                        <span>
                          ≈<strong>{item.sets * 3}</strong> Min
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}