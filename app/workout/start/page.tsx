"use client";

import { auth, db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/components/header";
import LoadingSpinner from "@/components/loadingSpinner";

interface TrainingPlan {
  id: string;
  name: string;
  items: any[];
}

export default function WorkoutStartPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // URL Parameter auslesen
    const urlParams = new URLSearchParams(window.location.search);
    const planId = urlParams.get('planId');
    
    if (planId) {
      router.push(`/workout/active?planId=${planId}`);
    } else {
      fetchTrainingPlans();
    }
  }, []);

  const fetchTrainingPlans = async () => {
    const user = auth.currentUser;
    if (!user) {
      router.push("/login");
      return;
    }

    try {
      const plansQuery = collection(db, "users", user.uid, "trainingPlans");
      const querySnapshot = await getDocs(plansQuery);
      const plansData: TrainingPlan[] = [];
      
      querySnapshot.forEach((doc) => {
        plansData.push({
          id: doc.id,
          ...doc.data()
        } as TrainingPlan);
      });
      
      setPlans(plansData);
    } catch (err) {
      console.error("Fehler beim Laden der Trainingspläne:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (plan: TrainingPlan) => {
    router.push(`/workout/active?planId=${plan.id}`);
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
      <main className="mt-30 px-4 max-w-4xl mx-auto pb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Workout starten
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => handleSelectPlan(plan)}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-emerald-300 cursor-pointer transform hover:-translate-y-1 transition-all duration-300"
            >
              <h3 className="font-bold text-lg text-gray-800 mb-2">{plan.name}</h3>
              <p className="text-gray-600 text-sm">
                {plan.items.length} Übungen
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}