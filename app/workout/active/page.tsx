"use client";

import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/components/header";
import LoadingSpinner from "@/components/loadingSpinner";
import ActiveExercise from "@/components/workout/activeExercise";
import WorkoutSummary from "@/components/workout/workoutSummary";

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
}

interface SetData {
  reps: number;
  weight: number;
  completed: boolean;
}

interface ExerciseData {
  exerciseId: string;
  name: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  setsData: SetData[];
}

export default function ActiveWorkoutPage() {
  const router = useRouter();
  const [planId, setPlanId] = useState<string | null>(null);
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [workoutData, setWorkoutData] = useState<ExerciseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    // URL Parameter ohne useSearchParams() auslesen
    const urlParams = new URLSearchParams(window.location.search);
    const planIdFromUrl = urlParams.get('planId');
    
    if (planIdFromUrl) {
      setPlanId(planIdFromUrl);
      fetchTrainingPlan(planIdFromUrl);
    } else {
      router.push("/workout/start");
    }
  }, []);

  const fetchTrainingPlan = async (planId: string) => {
    const user = auth.currentUser;
    if (!user) {
      router.push("/login");
      return;
    }

    try {
      const planDoc = await getDoc(doc(db, "users", user.uid, "trainingPlans", planId));
      if (planDoc.exists()) {
        const planData = {
          id: planDoc.id,
          ...planDoc.data()
        } as TrainingPlan;
        
        setPlan(planData);
        
        const initialWorkoutData: ExerciseData[] = planData.items.map(item => ({
          exerciseId: item.exerciseId,
          name: item.name,
          sets: item.sets,
          repsMin: item.repsMin,
          repsMax: item.repsMax,
          setsData: Array.from({ length: item.sets }, (_, i) => ({
            reps: Math.floor((item.repsMin + item.repsMax) / 2),
            weight: 0,
            completed: false
          }))
        }));
        
        setWorkoutData(initialWorkoutData);
      } else {
        console.error("Trainingsplan nicht gefunden");
        router.push("/workout/start");
      }
    } catch (err) {
      console.error("Fehler beim Laden des Trainingsplans:", err);
    } finally {
      setLoading(false);
    }
  };

  // ... restliche Funktionen bleiben gleich
  const handleExerciseComplete = (exerciseIndex: number, updatedSets: SetData[]) => {
    const updatedWorkoutData = workoutData.map((exercise, index) => 
      index === exerciseIndex 
        ? { ...exercise, setsData: updatedSets }
        : exercise
    );
    
    setWorkoutData(updatedWorkoutData);

    const allExercisesCompleted = updatedWorkoutData.every(exercise =>
      exercise.setsData.every(set => set.completed)
    );

    if (allExercisesCompleted) {
      setShowSummary(true);
    } else if (exerciseIndex < workoutData.length - 1) {
      setCurrentExerciseIndex(exerciseIndex + 1);
    } else {
      setShowSummary(true);
    }
  };

  const handleSaveWorkout = async () => {
    const user = auth.currentUser;
    if (!user || !plan) return;

    try {
      await addDoc(collection(db, "users", user.uid, "workoutSessions"), {
        planId: plan.id,
        planName: plan.name,
        exercises: workoutData,
        startTime: serverTimestamp(),
        endTime: serverTimestamp(),
        completed: true,
        userId: user.uid
      });

      router.push("/welcome");
    } catch (err) {
      console.error("Fehler beim Speichern des Workouts:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 safe-area-bottom">
        <Header />
        <div className="mt-16 flex justify-center items-center px-4">
          <LoadingSpinner message="Lade Trainingsplan..." />
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-50 safe-area-bottom">
        <Header />
        <div className="mt-16 flex justify-center items-center px-4">
          <p className="text-gray-600">Trainingsplan nicht gefunden.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 safe-area-bottom">
      <Header />

      <main className="mt-16 px-3 max-w-4xl mx-auto pb-6 safe-area-padding">
        {/* Mobile-optimierter Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.push("/workout/start")}
            className="bg-gray-500 text-white px-3 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm touch-target"
          >
            ← Zurück
          </button>
          
          <div className="text-center flex-1 mx-2">
            <h1 className="text-lg font-bold text-gray-800 truncate" title={plan.name}>
              {plan.name}
            </h1>
            <div className="text-xs text-gray-600">
              {showSummary ? 'Zusammenfassung' : `Übung ${currentExerciseIndex + 1} von ${workoutData.length}`}
            </div>
          </div>

          <div className="w-14"></div>
        </div>

        {/* Fortschrittsbalken */}
        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-6">
          <div 
            className="bg-emerald-400 h-1.5 rounded-full transition-all duration-500"
            style={{ 
              width: showSummary 
                ? '100%' 
                : `${((currentExerciseIndex + 1) / workoutData.length) * 100}%` 
            }}
          ></div>
        </div>

        {/* Hauptinhalt */}
        <div className="min-h-[60vh] flex items-center justify-center">
          {showSummary ? (
            <div className="w-full">
              <WorkoutSummary 
                workoutData={workoutData}
                planName={plan.name}
                onEditExercise={(index) => {
                  setCurrentExerciseIndex(index);
                  setShowSummary(false);
                }}
                onSaveWorkout={handleSaveWorkout}
              />
            </div>
          ) : workoutData[currentExerciseIndex] ? (
            <div className="w-full">
              <ActiveExercise
                exercise={workoutData[currentExerciseIndex]}
                exerciseIndex={currentExerciseIndex}
                totalExercises={workoutData.length}
                onComplete={handleExerciseComplete}
              />
            </div>
          ) : (
            <div className="text-center text-gray-500">
              Übung nicht gefunden
            </div>
          )}
        </div>

        <div className="h-6"></div>
      </main>
    </div>
  );
}