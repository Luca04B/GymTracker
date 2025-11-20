"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import Toast from "@/components/toast";

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
  planName: string;
  endTime: any;
  totalWorkoutScore: number;
  exercises: ExerciseData[];
}

interface WorkoutHistoryProps {
  workoutSessions: WorkoutSession[];
  onWorkoutsUpdate: () => void;
}

export default function WorkoutHistory({ workoutSessions, onWorkoutsUpdate }: WorkoutHistoryProps) {
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);
  const [editingWorkout, setEditingWorkout] = useState<string | null>(null);
  const [editedSessions, setEditedSessions] = useState<WorkoutSession[]>(workoutSessions);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "info" as "success" | "error" | "info" });

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unbekannt';
    const date = timestamp.toDate();
    return date.toLocaleDateString('de-DE', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 2000) return 'text-green-600 bg-green-100';
    if (score >= 1500) return 'text-blue-600 bg-blue-100';
    if (score >= 1000) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const showToast = (message: string, type: "success" | "error" | "info") => {
    setToast({ show: true, message, type });
  };

  const closeToast = () => {
    setToast(prev => ({ ...prev, show: false }));
  };

  const toggleExpand = (workoutId: string) => {
    setExpandedWorkout(expandedWorkout === workoutId ? null : workoutId);
  };

  const startEditing = (workoutId: string) => {
    setEditingWorkout(workoutId);
    setExpandedWorkout(workoutId);
  };

  const cancelEditing = () => {
    setEditingWorkout(null);
    setEditedSessions(workoutSessions);
  };

  const saveEditing = async (workoutId: string) => {
    const user = auth.currentUser;
    if (!user) {
      showToast("Nicht eingeloggt", "error");
      return;
    }

    setLoading(workoutId);
    try {
      const session = editedSessions.find(s => s.id === workoutId);
      if (!session) return;

      const sessionRef = doc(db, "users", user.uid, "workoutSessions", workoutId);
      await updateDoc(sessionRef, {
        exercises: session.exercises,
        totalWorkoutScore: session.totalWorkoutScore
      });

      setEditingWorkout(null);
      showToast("Workout erfolgreich aktualisiert!", "success");
      onWorkoutsUpdate();
    } catch (error) {
      console.error("Fehler beim Speichern:", error);
      showToast("Fehler beim Speichern des Workouts", "error");
    } finally {
      setLoading(null);
    }
  };

  const updateSetData = (workoutId: string, exerciseIndex: number, setIndex: number, field: keyof SetData, value: any) => {
    setEditedSessions(prev => prev.map(session => {
      if (session.id !== workoutId) return session;

      const updatedExercises = [...session.exercises];
      updatedExercises[exerciseIndex].setsData[setIndex] = {
        ...updatedExercises[exerciseIndex].setsData[setIndex],
        [field]: value
      };

      if (field === 'reps' || field === 'weight') {
        const set = updatedExercises[exerciseIndex].setsData[setIndex];
        if (set.completed) {
          const score = calculateScore(set.weight, set.reps, updatedExercises[exerciseIndex].factor, updatedExercises[exerciseIndex].multiplier);
          updatedExercises[exerciseIndex].setsData[setIndex].score = score;
        }
      }

      const totalExerciseScore = updatedExercises[exerciseIndex].setsData
        .filter(set => set.completed)
        .reduce((sum, set) => sum + (set.score || 0), 0);
      updatedExercises[exerciseIndex].totalScore = updatedExercises[exerciseIndex].sets > 0 ? totalExerciseScore / updatedExercises[exerciseIndex].sets : 0;

      const totalWorkoutScore = updatedExercises.reduce((total, exercise) => {
        const exerciseScore = exercise.setsData
          .filter(set => set.completed)
          .reduce((sum, set) => sum + (set.score || 0), 0);
        return total + exerciseScore;
      }, 0);

      const totalSetsInWorkout = updatedExercises.reduce((total, exercise) => total + exercise.sets, 0);
      const workoutScorePerSet = totalSetsInWorkout > 0 ? totalWorkoutScore / totalSetsInWorkout : 0;

      return {
        ...session,
        exercises: updatedExercises,
        totalWorkoutScore: workoutScorePerSet
      };
    }));
  };

  const calculateScore = (weight: number, reps: number, factor: number, multiplier: number): number => {
    return (weight * Math.exp(factor * reps)) * 100 / multiplier;
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    const user = auth.currentUser;
    if (!user) {
      showToast("Nicht eingeloggt", "error");
      return;
    }

    setLoading(workoutId);
    try {
      const sessionRef = doc(db, "users", user.uid, "workoutSessions", workoutId);
      await deleteDoc(sessionRef);
      
      showToast("Workout erfolgreich gelöscht!", "success");
      onWorkoutsUpdate();
    } catch (error) {
      console.error("Fehler beim Löschen:", error);
      showToast("Fehler beim Löschen des Workouts", "error");
    } finally {
      setLoading(null);
      setShowDeleteConfirm(null);
    }
  };

  if (workoutSessions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📅</div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Keine Workout-Historie</h3>
        <p className="text-gray-600">Starte dein erstes Workout, um es hier zu sehen</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
          duration={3000}
        />
      )}

      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Workout Verlauf</h3>
        <p className="text-gray-600">
          Chronologische Übersicht aller deiner Workouts
        </p>
      </div>

      <div className="space-y-4 max-h-[600px] overflow-y-auto">
        {(editingWorkout ? editedSessions : workoutSessions).map((session, index) => (
          <div key={session.id} className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
            {/* Workout Header */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 text-lg mb-1">{session.planName}</h4>
                  <p className="text-sm text-gray-500">{formatDate(session.endTime)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`px-4 py-2 rounded-full text-sm font-semibold ${getScoreColor(session.totalWorkoutScore)}`}>
                    {session.totalWorkoutScore.toFixed(0)} Punkte
                  </div>
                  
                  {editingWorkout === session.id ? (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => saveEditing(session.id)}
                        disabled={loading === session.id}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {loading === session.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          "✓ Speichern"
                        )}
                      </button>
                      <button 
                        onClick={cancelEditing}
                        disabled={loading === session.id}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                      >
                        ✗ Abbrechen
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => startEditing(session.id)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
                      >
                        ✏️ Bearbeiten
                      </button>
                      <button 
                        onClick={() => setShowDeleteConfirm(session.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
                      >
                        🗑️ Löschen
                      </button>
                    </div>
                  )}
                  
                  <button 
                    onClick={() => toggleExpand(session.id)}
                    className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {expandedWorkout === session.id ? '▲' : '▼'}
                  </button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center bg-gray-50 rounded-lg p-3">
                  <div className="font-bold text-gray-800 text-lg">{session.exercises.length}</div>
                  <div className="text-gray-500">Übungen</div>
                </div>
                <div className="text-center bg-gray-50 rounded-lg p-3">
                  <div className="font-bold text-gray-800 text-lg">
                    {session.exercises.reduce((total, exercise) => total + exercise.sets, 0)}
                  </div>
                  <div className="text-gray-500">Sätze</div>
                </div>
                <div className="text-center bg-gray-50 rounded-lg p-3">
                  <div className="font-bold text-gray-800 text-lg">
                    {session.exercises.reduce((total, exercise) => 
                      total + exercise.setsData.reduce((sum: number, set: any) => sum + set.reps, 0), 0
                    )}
                  </div>
                  <div className="text-gray-500">Wiederholungen</div>
                </div>
                <div className="text-center bg-gray-50 rounded-lg p-3">
                  <div className="font-bold text-gray-800 text-lg">
                    {session.exercises.reduce((total, exercise) => 
                      total + exercise.setsData.reduce((sum: number, set: any) => sum + (set.weight * set.reps), 0), 0
                    ).toFixed(0)}kg
                  </div>
                  <div className="text-gray-500">Gesamtgewicht</div>
                </div>
              </div>
            </div>

            {/* Delete Confirmation */}
            {showDeleteConfirm === session.id && (
              <div className="border-t border-gray-200 p-6 bg-red-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-700 font-semibold text-lg">Workout wirklich löschen?</p>
                    <p className="text-red-600 text-sm mt-1">Diese Aktion kann nicht rückgängig gemacht werden.</p>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleDeleteWorkout(session.id)}
                      disabled={loading === session.id}
                      className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading === session.id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        "🗑️ Ja, löschen"
                      )}
                    </button>
                    <button 
                      onClick={() => setShowDeleteConfirm(null)}
                      disabled={loading === session.id}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Expanded Details */}
            {expandedWorkout === session.id && (
              <div className="border-t border-gray-200 p-6 bg-gray-50">
                <h5 className="font-semibold text-gray-800 text-lg mb-4">Übungsdetails</h5>
                <div className="space-y-4">
                  {session.exercises.map((exercise, exIndex) => (
                    <div key={exIndex} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h6 className="font-semibold text-gray-800 text-md">{exercise.name}</h6>
                          <p className="text-sm text-gray-500">
                            Factor: {exercise.factor} | Multiplier: {exercise.multiplier}
                          </p>
                        </div>
                        <span className="text-purple-600 font-semibold bg-purple-50 px-3 py-1 rounded-full">
                          Score: {exercise.totalScore.toFixed(1)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {exercise.setsData.map((set: any, setIndex: number) => (
                          <div key={setIndex} className={`p-4 rounded-lg border-2 ${
                            editingWorkout === session.id 
                              ? 'bg-blue-50 border-blue-300' 
                              : set.completed 
                                ? 'bg-green-50 border-green-300' 
                                : 'bg-gray-100 border-gray-300'
                          }`}>
                            <div className="text-center mb-3">
                              <div className="font-bold text-gray-800 text-lg">Satz {setIndex + 1}</div>
                            </div>
                            
                            {editingWorkout === session.id ? (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <label className="text-sm font-medium text-gray-700">Reps:</label>
                                  <input
                                    type="number"
                                    value={set.reps}
                                    onChange={(e) => updateSetData(session.id, exIndex, setIndex, 'reps', parseInt(e.target.value) || 0)}
                                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center font-medium"
                                    min="0"
                                  />
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <label className="text-sm font-medium text-gray-700">Gewicht:</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      value={set.weight}
                                      onChange={(e) => updateSetData(session.id, exIndex, setIndex, 'weight', parseFloat(e.target.value) || 0)}
                                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center font-medium"
                                      step="0.5"
                                      min="0"
                                    />
                                    <span className="text-sm text-gray-600 font-medium">kg</span>
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <label className="text-sm font-medium text-gray-700">Completed:</label>
                                  <input
                                    type="checkbox"
                                    checked={set.completed}
                                    onChange={(e) => updateSetData(session.id, exIndex, setIndex, 'completed', e.target.checked)}
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="text-center space-y-2">
                                <div className="text-gray-800 font-semibold text-lg">
                                  {set.reps} × {set.weight}kg
                                </div>
                                <div className={`text-sm font-medium px-3 py-1 rounded-full ${
                                  set.completed 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-200 text-gray-600'
                                }`}>
                                  {set.completed ? '✅ Completed' : '❌ Nicht completed'}
                                </div>
                              </div>
                            )}
                            
                            <div className="text-center mt-3">
                              <div className="text-purple-700 font-semibold text-sm bg-purple-100 px-2 py-1 rounded-full">
                                Score: {set.score?.toFixed(1) || 0}
                              </div>
                            </div>
                          </div>
                        ))}
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
  );
}