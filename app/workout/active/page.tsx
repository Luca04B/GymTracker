"use client";

import { auth, db } from "@/lib/firebase";
import { 
  doc, 
  getDoc, 
  collection, 
  addDoc, 
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  getDocs 
} from "firebase/firestore";
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
  score?: number;
}

interface ExerciseData {
  exerciseId: string;
  name: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  setsData: SetData[];
  lastWorkoutData?: any;
  factor: number;
  multiplier: number;
  scores: number[];
  totalScore: number;
}

// Score Berechnungsfunktion
const calculateScore = (weight: number, reps: number, factor: number, multiplier: number): number => {
  const score = (weight * Math.exp(factor * reps)) * 100 / multiplier;
  return Math.round(score * 100) / 100;
};

export default function ActiveWorkoutPage() {
  const router = useRouter();
  const [planId, setPlanId] = useState<string | null>(null);
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [workoutData, setWorkoutData] = useState<ExerciseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [lastWorkout, setLastWorkout] = useState<any>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const planIdFromUrl = urlParams.get('planId');
    
    if (planIdFromUrl) {
      setPlanId(planIdFromUrl);
      fetchTrainingPlan(planIdFromUrl);
    } else {
      router.push("/workout/start");
    }
  }, []);

  const fetchLastWorkoutData = async (planId: string) => {
    const user = auth.currentUser;
    if (!user) return null;

    try {
      const workoutsQuery = query(
        collection(db, "users", user.uid, "workoutSessions"),
        where("planId", "==", planId),
        orderBy("endTime", "desc"),
        limit(1)
      );
      
      const querySnapshot = await getDocs(workoutsQuery);
      if (!querySnapshot.empty) {
        const lastWorkout = querySnapshot.docs[0].data();
        return lastWorkout;
      }
      return null;
    } catch (err) {
      console.error("Fehler beim Laden des letzten Workouts:", err);
      return null;
    }
  };

  const fetchTrainingPlan = async (planId: string) => {
    const user = auth.currentUser;

    if (!user) {
      // Try again after a short delay
      setTimeout(() => fetchTrainingPlan(planId), 500);
      return;
    }

    try {
      const [planDoc, lastWorkout] = await Promise.all([
        getDoc(doc(db, "users", user.uid, "trainingPlans", planId)),
        fetchLastWorkoutData(planId)
      ]);

      if (planDoc.exists()) {
        const planData = {
          id: planDoc.id,
          ...planDoc.data()
        } as TrainingPlan;
        
        setPlan(planData);
        setLastWorkout(lastWorkout);
        
        const exercisesWithDetails = await Promise.all(
          planData.items.map(async (item) => {
            try {
              const exerciseDoc = await getDoc(doc(db, "users", user.uid, "exercises", item.exerciseId));
              const exerciseData = exerciseDoc.exists() ? exerciseDoc.data() : {};
              
              const lastExercise = lastWorkout?.exercises?.find((e: any) => e.exerciseId === item.exerciseId);
              
              return {
                exerciseId: item.exerciseId,
                name: item.name || 'Unbekannte Übung',
                sets: item.sets || 0,
                repsMin: item.repsMin || 0,
                repsMax: item.repsMax || 0,
                factor: Number(exerciseData.factor) || 0.1,
                multiplier: Number(exerciseData.multiplier) || 100,
                setsData: Array.from({ length: item.sets }, (_, setIndex) => {
                  const lastSet = lastExercise?.setsData?.[setIndex];
                  const initialReps = lastSet?.reps || Math.floor(((item.repsMin || 0) + (item.repsMax || 0)) / 2);
                  const initialWeight = lastSet?.weight || 0;
                  
                  return {
                    reps: initialReps,
                    weight: initialWeight,
                    completed: false,
                    score: calculateScore(initialWeight, initialReps, Number(exerciseData.factor) || 0.1, Number(exerciseData.multiplier) || 100)
                  };
                }),
                lastWorkoutData: lastExercise,
                scores: [],
                totalScore: 0
              };
            } catch (err) {
              console.error(`Fehler beim Laden von Exercise ${item.exerciseId}:`, err);
              return {
                exerciseId: item.exerciseId,
                name: item.name || 'Unbekannte Übung',
                sets: item.sets || 0,
                repsMin: item.repsMin || 0,
                repsMax: item.repsMax || 0,
                factor: 0.1,
                multiplier: 100,
                setsData: Array.from({ length: item.sets }, (_, setIndex) => {
                  const initialReps = Math.floor(((item.repsMin || 0) + (item.repsMax || 0)) / 2);
                  return {
                    reps: initialReps,
                    weight: 0,
                    completed: false,
                    score: calculateScore(0, initialReps, 0.1, 100)
                  };
                }),
                lastWorkoutData: null,
                scores: [],
                totalScore: 0
              };
            }
          })
        );
        
        setWorkoutData(exercisesWithDetails);
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

  const handleExerciseComplete = (exerciseIndex: number, updatedSets: SetData[]) => {
    const updatedWorkoutData = workoutData.map((exercise, index) => {
      if (index === exerciseIndex) {
        // Berechne Scores für die aktualisierten Sets
        const updatedSetsWithScores = updatedSets.map(set => ({
          reps: set.reps || 0,
          weight: set.weight || 0,
          completed: set.completed || false,
          score: set.score || calculateScore(set.weight || 0, set.reps || 0, exercise.factor, exercise.multiplier)
        }));
        
        // Berechne Gesamt-Score für die Übung
        const totalScore = updatedSetsWithScores.reduce((sum, set) => sum + (set.score || 0), 0);
        
        return {
          ...exercise,
          setsData: updatedSetsWithScores,
          totalScore: totalScore
        };
      }
      return exercise;
    });
    
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
    if (!user || !plan) {
      console.error("User oder Plan nicht verfügbar");
      return;
    }

    try {
      // Tiefe Bereinigung aller Daten
      const cleanedWorkoutData = workoutData.map(exercise => {
        // Stelle sicher, dass alle erforderlichen Felder vorhanden sind
        const cleanedExercise = {
          exerciseId: exercise.exerciseId || '',
          name: exercise.name || 'Unbekannte Übung',
          sets: exercise.sets || 0,
          repsMin: exercise.repsMin || 0,
          repsMax: exercise.repsMax || 0,
          setsData: exercise.setsData?.map(set => ({
            reps: Number(set.reps) || 0,
            weight: Number(set.weight) || 0,
            completed: Boolean(set.completed),
            score: Number(set.score) || 0
          })) || [],
          factor: Number(exercise.factor) || 0.1,
          multiplier: Number(exercise.multiplier) || 100,
          scores: Array.isArray(exercise.scores) ? exercise.scores.map(s => Number(s) || 0) : [],
          totalScore: Number(exercise.totalScore) || 0
        };

        return cleanedExercise;
      });

      // Validiere die Daten
      const hasInvalidData = cleanedWorkoutData.some(exercise => 
        !exercise.exerciseId || 
        !exercise.name ||
        exercise.setsData.some(set => 
          set.reps === undefined || 
          set.weight === undefined ||
          set.score === undefined
        )
      );

      if (hasInvalidData) {
        console.error("Ungültige Daten gefunden:", cleanedWorkoutData);
        alert("Fehler: Einige Workout-Daten sind ungültig. Bitte überprüfe deine Eingaben.");
        return;
      }

      const totalWorkoutScore = cleanedWorkoutData.reduce((sum, exercise) => 
        sum + (exercise.totalScore || 0), 0
      );

      // Finale Daten für Firestore
      const workoutDataToSave = {
        planId: plan.id,
        planName: plan.name,
        exercises: cleanedWorkoutData,
        startTime: serverTimestamp(),
        endTime: serverTimestamp(),
        completed: true,
        userId: user.uid,
        totalWorkoutScore: totalWorkoutScore
      };

      console.log("Speichere Workout mit Daten:", workoutDataToSave);

      const docRef = await addDoc(
        collection(db, "users", user.uid, "workoutSessions"), 
        workoutDataToSave
      );

      console.log("Workout erfolgreich gespeichert mit ID:", docRef.id);
      alert("Workout erfolgreich gespeichert! 🎉");
      router.push("/welcome");
      
    } catch (err: any) {
      console.error("Fehler beim Speichern des Workouts:", err);
      
      if (err.code === 'invalid-argument') {
        alert("Fehler: Ungültige Daten im Workout. Bitte starte das Workout neu.");
      } else if (err.code === 'permission-denied') {
        alert("Berechtigungsfehler: Keine Berechtigung zum Speichern.");
      } else {
        alert("Speicherfehler: " + err.message);
      }
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

      <main className="mt-30 px-3 max-w-4xl mx-auto pb-6 safe-area-padding">
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