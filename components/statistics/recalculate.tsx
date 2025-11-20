"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";

import Toast from "../toast";

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
  factor: number;
  multiplier: number;
  scores: number[];
  totalScore: number;
}

interface WorkoutSession {
  id: string;
  planId: string;
  planName: string;
  exercises: ExerciseData[];
  startTime: any;
  endTime: any;
  completed: boolean;
  userId: string;
  totalWorkoutScore: number;
  date?: string;
}

interface Exercise {
  id: string;
  name: string;
  factor: number;
  multiplier: number;
  category?: string;
}

interface RecalculateComponentProps {
  workoutSessions: WorkoutSession[];
  onUpdateWorkoutSessions: (updatedSessions: WorkoutSession[]) => void;
  onBack: () => void;
}

export default function RecalculateComponent({ 
  workoutSessions, 
  onUpdateWorkoutSessions, 
  onBack 
}: RecalculateComponentProps) {
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [recalculationComplete, setRecalculationComplete] = useState(false);
  const [updatedSessions, setUpdatedSessions] = useState<WorkoutSession[]>([]);
  const [currentExercises, setCurrentExercises] = useState<Exercise[]>([]);
  const [changes, setChanges] = useState<{
    sessionId: string;
    oldScore: number;
    newScore: number;
    exerciseChanges: {
      exerciseName: string;
      oldFactor?: number;
      newFactor?: number;
      oldMultiplier?: number;
      newMultiplier?: number;
      oldScore?: number;
      newScore?: number;
    }[];
  }[]>([]);

  // Score Berechnungsfunktion
  const calculateScore = (weight: number, reps: number, factor: number, multiplier: number): number => {
    const score = (weight * Math.exp(factor * reps)) * 100 / multiplier;
    return Math.round(score * 100) / 100;
  };

  // Lade aktuelle Übungen aus der Datenbank
  const loadCurrentExercises = async (): Promise<Exercise[]> => {
    const user = auth.currentUser;
    if (!user) {
      console.log("Kein Benutzer angemeldet");
      return [];
    }

    try {
      const exercisesQuery = collection(db, "users", user.uid, "exercises");
      const querySnapshot = await getDocs(exercisesQuery);
      const exercisesData: Exercise[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        exercisesData.push({
          id: doc.id,
          name: data.name || "",
          factor: data.factor || 0,
          multiplier: data.multiplier || 0,
          category: data.category
        } as Exercise);
      });
      
      setCurrentExercises(exercisesData);
      console.log(`Geladene Übungen: ${exercisesData.length}`);
      return exercisesData;
    } catch (err) {
      showToast("Fehler beim Laden der Übungen", "error");
      return [];
    }
  };

  // In der RecalculateComponent - State hinzufügen:
const [toast, setToast] = useState<{
  message: string;
  type: "success" | "error" | "info";
  show: boolean;
}>({
  message: "",
  type: "info",
  show: false,
});

// Toast anzeigen Funktion
const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
  setToast({ message, type, show: true });
};

// Toast schließen Funktion
const closeToast = () => {
  setToast(prev => ({ ...prev, show: false }));
};

// In der JSX-Return am Ende (vor dem schließenden div) hinzufügen:
{toast.show && (
  <Toast
    message={toast.message}
    type={toast.type}
    onClose={closeToast}
    duration={1500}
  />
)}

  // Speichere Workout-Sessions in der Datenbank
  const saveSessionsToFirebase = async (sessions: WorkoutSession[]) => {
    const user = auth.currentUser;
    if (!user) {
      showToast("Kein Benutzer angemeldet", "error");
      return false;
    }

    setIsSaving(true);
    try {
      for (const session of sessions) {
        const sessionRef = doc(db, "users", user.uid, "workoutSessions", session.id);
        await updateDoc(sessionRef, {
          exercises: session.exercises,
          totalWorkoutScore: session.totalWorkoutScore
        });
        showToast("Sessions werden gespeichert...", "info");
      }
      showToast("Alle Sessions erfolgreich gespeichert!", "success");
      return true;
    } catch (err) {
      showToast("Fehler beim Speichern der Sessions", "error");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const recalculateAllScores = async () => {
    setIsRecalculating(true);
    setRecalculationComplete(false);
    
    try {
      // Lade aktuelle Übungen
      const exercises = await loadCurrentExercises();
      console.log("Aktuelle Übungen geladen:", exercises.length);
      
      const updated: WorkoutSession[] = [];
      const changeList: {
        sessionId: string;
        oldScore: number;
        newScore: number;
        exerciseChanges: {
          exerciseName: string;
          oldFactor?: number;
          newFactor?: number;
          oldMultiplier?: number;
          newMultiplier?: number;
          oldScore?: number;
          newScore?: number;
        }[];
      }[] = [];

      workoutSessions.forEach((session, sessionIndex) => {
        let totalWorkoutScore = 0;
        let totalSetsInWorkout = 0;
        const sessionExerciseChanges: {
          exerciseName: string;
          oldFactor?: number;
          newFactor?: number;
          oldMultiplier?: number;
          newMultiplier?: number;
          oldScore?: number;
          newScore?: number;
        }[] = [];

        console.log(`=== WORKOUT ${sessionIndex + 1} RECHNUNG ===`);
        
        const updatedExercises: ExerciseData[] = session.exercises.map((exercise, exerciseIndex) => {
          // Finde aktuelle Übung in der Datenbank
          const currentExercise = exercises.find(ex => ex.id === exercise.exerciseId);
          
          // Verwende aktuelle Factors/Multipliers oder behalte alte bei
          const newFactor = currentExercise?.factor ?? exercise.factor;
          const newMultiplier = currentExercise?.multiplier ?? exercise.multiplier;

          // Speichere alte Werte für Vergleich
          const oldExerciseScore = exercise.totalScore;
          const oldFactor = exercise.factor;
          const oldMultiplier = exercise.multiplier;

          // Berechne Set-Scores für alle completed Sets mit AKTUELLEN Factors/Multipliers
          const updatedSetsData: SetData[] = exercise.setsData.map(set => {
            const setScore = set.completed ? calculateScore(set.weight, set.reps, newFactor, newMultiplier) : 0;
            return {
              ...set,
              score: setScore
            };
          });

          // Berechne Übungs-Score: Summe aller Set-Scores / Anzahl Sätze der Übung
          const totalExerciseScore = updatedSetsData.reduce((sum, set) => sum + (set.score || 0), 0);
          const exerciseScorePerSet = exercise.sets > 0 ? totalExerciseScore / exercise.sets : 0;

          // Prüfe ob sich Factor oder Multiplier geändert haben
          const factorChanged = oldFactor !== newFactor;
          const multiplierChanged = oldMultiplier !== newMultiplier;
          const scoreChanged = Math.abs(oldExerciseScore - exerciseScorePerSet) > 0.01;

          // Füge Änderungen hinzu wenn relevant
          if (factorChanged || multiplierChanged || scoreChanged) {
            sessionExerciseChanges.push({
              exerciseName: exercise.name,
              oldFactor: factorChanged ? oldFactor : undefined,
              newFactor: factorChanged ? newFactor : undefined,
              oldMultiplier: multiplierChanged ? oldMultiplier : undefined,
              newMultiplier: multiplierChanged ? newMultiplier : undefined,
              oldScore: scoreChanged ? oldExerciseScore : undefined,
              newScore: scoreChanged ? exerciseScorePerSet : undefined
            });
          }

          console.log(`Übung ${exerciseIndex + 1} (${exercise.name}):`);
          console.log(`  - Factor: ${oldFactor} → ${newFactor}`);
          console.log(`  - Multiplier: ${oldMultiplier} → ${newMultiplier}`);
          console.log(`  - Sets: ${exercise.sets}`);
          console.log(`  - Total Score: ${totalExerciseScore}`);
          console.log(`  - Score pro Satz: ${exerciseScorePerSet}`);
          
          // Addiere zur Workout-Gesamtsumme (NICHT die geteilten Scores!)
          totalWorkoutScore += totalExerciseScore;
          totalSetsInWorkout += exercise.sets;

          return {
            ...exercise,
            factor: newFactor,
            multiplier: newMultiplier,
            setsData: updatedSetsData,
            totalScore: exerciseScorePerSet,
            scores: updatedSetsData.filter(set => set.completed).map(set => set.score || 0)
          };
        });


        // Berechne Workout-Score: Gesamtsumme aller Set-Scores / Gesamtzahl aller Sätze im Workout
        const workoutScorePerSet = totalSetsInWorkout > 0 ? totalWorkoutScore / totalSetsInWorkout : 0;

        // Speichere Änderungen für die Anzeige
        if (Math.abs(workoutScorePerSet - session.totalWorkoutScore) > 0.1 || sessionExerciseChanges.length > 0) {
          changeList.push({
            sessionId: session.id,
            oldScore: session.totalWorkoutScore,
            newScore: workoutScorePerSet,
            exerciseChanges: sessionExerciseChanges
          });
        }

        updated.push({
          ...session,
          exercises: updatedExercises,
          totalWorkoutScore: workoutScorePerSet
        });
      });

      setUpdatedSessions(updated);
      setChanges(changeList);
      setRecalculationComplete(true);
    } catch (error) {
      showToast("Fehler bei der Neuberechnung", "error");
    } finally {
      setIsRecalculating(false);
    }
  };

  // In der applyChanges Funktion ersetzen:
const applyChanges = async () => {
  setIsSaving(true);
  try {
    // Speichere in Firebase
    const success = await saveSessionsToFirebase(updatedSessions);
    
    if (success) {
      // Aktualisiere den State in der Elternkomponente
      onUpdateWorkoutSessions(updatedSessions);
      setRecalculationComplete(false);
      showToast("Änderungen erfolgreich gespeichert!", "success");
    } else {
      showToast("Fehler beim Speichern der Daten. Bitte versuche es erneut.", "error");
    }
  } catch (error) {
    showToast("Fehler beim Speichern der Daten. Bitte versuche es erneut.", "error");
  } finally {
    setIsSaving(false);
  }
};

  const totalScoreChange = changes.reduce((sum, change) => sum + (change.newScore - change.oldScore), 0);
  const affectedSessions = changes.length;
  const totalExerciseChanges = changes.reduce((sum, change) => sum + change.exerciseChanges.length, 0);

  // Berechne Statistiken für die Anzeige
  const totalExercisesCount = workoutSessions.reduce((total, session) => total + session.exercises.length, 0);
  const totalSetsCount = workoutSessions.reduce((total, session) => 
    total + session.exercises.reduce((exTotal, exercise) => exTotal + exercise.sets, 0), 0
  );
  const completedSetsCount = workoutSessions.reduce((total, session) => 
    total + session.exercises.reduce((exTotal, exercise) => 
      exTotal + exercise.setsData.filter(set => set.completed).length, 0
    ), 0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="pt-16 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
            >
              <span>← Zurück zu Statistiken</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Workouts Neuberechnen</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Berechne alle vergangenen Workouts mit den aktuellen Factors und Multipliers neu.
            </p>
          </div>

          {/* Statistik Karten */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
              <div className="text-xl font-bold text-blue-600 mb-1">{workoutSessions.length}</div>
              <div className="text-sm text-gray-600">Workouts</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
              <div className="text-xl font-bold text-purple-600 mb-1">{totalExercisesCount}</div>
              <div className="text-sm text-gray-600">Übungen</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
              <div className="text-xl font-bold text-green-600 mb-1">{completedSetsCount}/{totalSetsCount}</div>
              <div className="text-sm text-gray-600">Sätze completed</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
              <div className="text-xl font-bold text-orange-600 mb-1">{totalSetsCount}</div>
              <div className="text-sm text-gray-600">Sätze gesamt</div>
            </div>
          </div>

          {/* Hauptinhalt */}
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
            {!recalculationComplete ? (
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-2xl text-white">🔧</span>
                </div>
                
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  {isRecalculating ? 'Berechne Workouts neu...' : 'Bereit für Neuberechnung'}
                </h2>
                
                <p className="text-gray-600 mb-4 max-w-md mx-auto">
                  {isRecalculating 
                    ? 'Alle Workout-Scores werden mit den aktuellen Factors und Multipliers neu berechnet...'
                    : 'Diese Aktion wird alle vergangenen Workouts mit den aktuellen Factors und Multipliers neu berechnen.'
                  }
                </p>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
                  <h4 className="font-semibold text-green-800 mb-2 text-sm">✅ Erweiterte Neuberechnung:</h4>
                  <ul className="text-green-700 text-sm text-left space-y-1">
                    <li>• <strong>Set-Score:</strong> (weight × Math.exp(factor × reps)) × 100 / multiplier</li>
                    <li>• <strong>Aktuelle Factors/Multipliers</strong> werden angewendet</li>
                  </ul>
                </div>

                {!isRecalculating && (
                  <button
                    onClick={recalculateAllScores}
                    disabled={isRecalculating}
                    className="bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Neuberechnung starten
                  </button>
                )}

                {isRecalculating && (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-sm text-gray-500">Bitte warten...</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <span className="text-2xl text-white">✅</span>
                </div>
                
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Neuberechnung abgeschlossen!
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 mt-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600 mb-1">{affectedSessions}</div>
                    <div className="text-sm text-blue-700">Betroffene Workouts</div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {totalScoreChange > 0 ? '+' : ''}{totalScoreChange.toFixed(1)}
                    </div>
                    <div className="text-sm text-green-700">Gesamt-Score Änderung</div>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-600 mb-1">{totalExerciseChanges}</div>
                    <div className="text-sm text-purple-700">Übungs-Anpassungen</div>
                  </div>
                </div>

                {changes.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-800 mb-3">Detailierte Änderungen:</h3>
                    <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                      {changes.map((change, sessionIndex) => (
                        <div key={change.sessionId} className="border-b border-gray-100 last:border-b-0">
                          {/* Workout Header */}
                          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-gray-800">Workout {sessionIndex + 1}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-500 line-through">{change.oldScore.toFixed(1)}</span>
                                <span className="text-sm text-gray-400">→</span>
                                <span className={`text-sm font-medium ${
                                  change.newScore > change.oldScore ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {change.newScore.toFixed(1)}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Exercise Changes */}
                          {change.exerciseChanges.length > 0 && (
                            <div className="px-4 py-3 bg-white">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Übungs-Anpassungen:</h4>
                              <div className="space-y-2">
                                {change.exerciseChanges.map((exerciseChange, exIndex) => (
                                  <div key={exIndex} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                                    <div className="flex-1">
                                      <span className="font-medium text-gray-800 text-sm">
                                        {exerciseChange.exerciseName}
                                      </span>
                                      <div className="flex flex-wrap gap-4 mt-1">
                                        {exerciseChange.oldFactor !== undefined && (
                                          <div className="flex items-center gap-1">
                                            <span className="text-xs text-gray-500">Factor:</span>
                                            <span className="text-xs text-gray-500 line-through">{exerciseChange.oldFactor}</span>
                                            <span className="text-xs text-gray-400">→</span>
                                            <span className="text-xs font-medium text-blue-600">{exerciseChange.newFactor}</span>
                                          </div>
                                        )}
                                        {exerciseChange.oldMultiplier !== undefined && (
                                          <div className="flex items-center gap-1">
                                            <span className="text-xs text-gray-500">Multiplier:</span>
                                            <span className="text-xs text-gray-500 line-through">{exerciseChange.oldMultiplier}</span>
                                            <span className="text-xs text-gray-400">→</span>
                                            <span className="text-xs font-medium text-blue-600">{exerciseChange.newMultiplier}</span>
                                          </div>
                                        )}
                                        {exerciseChange.oldScore !== undefined && (
                                          <div className="flex items-center gap-1">
                                            <span className="text-xs text-gray-500">Score:</span>
                                            <span className="text-xs text-gray-500 line-through">{exerciseChange.oldScore.toFixed(1)}</span>
                                            <span className="text-xs text-gray-400">→</span>
                                            <span className={`text-xs font-medium ${
                                              (exerciseChange.newScore || 0) > (exerciseChange.oldScore || 0) ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                              {(exerciseChange.newScore || 0).toFixed(1)}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={onBack}
                    disabled={isSaving}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Zurück ohne Speichern
                  </button>
                  <button
                    onClick={applyChanges}
                    disabled={isSaving}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Speichern...
                      </div>
                    ) : (
                      'Änderungen übernehmen ✅'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-blue-600 text-lg">💡</span>
              <div>
                <h4 className="font-semibold text-blue-800 mb-1">Erweiterte Berechnungslogik</h4>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li><strong>Set-Score:</strong> (weight × Math.exp(factor × reps)) × 100 / multiplier</li>
                  <li><strong>Aktuelle Factors/Multipliers:</strong> Werden automatisch auf alle Workouts angewendet</li>
                  <li><strong>Detaillierte Tracking:</strong> Zeigt Änderungen an Factors, Multipliers und Scores pro Übung</li>
                  <li><strong>Vollständige Konsistenz:</strong> Alle Workouts verwenden dieselbe aktuelle Formel</li>
                  <li><strong>Datenbank-Synchronisation:</strong> Änderungen werden in Firebase gespeichert</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
            {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
          duration={1500}
        />
      )}
    </div>
  );
}