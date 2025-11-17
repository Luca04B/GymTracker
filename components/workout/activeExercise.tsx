"use client";

import { useState, useEffect } from "react";

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

interface ActiveExerciseProps {
  exercise: ExerciseData;
  exerciseIndex: number;
  totalExercises: number;
  onComplete: (exerciseIndex: number, setsData: SetData[]) => void;
}

export default function ActiveExercise({ 
  exercise, 
  exerciseIndex, 
  totalExercises, 
  onComplete 
}: ActiveExerciseProps) {
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [setsData, setSetsData] = useState<SetData[]>(exercise.setsData);

  // WICHTIG: Aktualisiere local state wenn exercise sich ändert
  useEffect(() => {
    setSetsData(exercise.setsData);
    setCurrentSetIndex(0); // Setze zurück auf ersten Satz bei Übungswechsel
  }, [exercise]);

  const handleSetUpdate = (setIndex: number, field: 'reps' | 'weight', value: number) => {
    const updatedSets = [...setsData];
    updatedSets[setIndex] = {
      ...updatedSets[setIndex],
      [field]: value
    };
    setSetsData(updatedSets);
  };

  const handleSetComplete = (setIndex: number) => {
    const updatedSets = [...setsData];
    updatedSets[setIndex] = {
      ...updatedSets[setIndex],
      completed: true
    };
    setSetsData(updatedSets);

    // Prüfe ob alle Sätze dieser Übung completed sind
    const allSetsCompleted = updatedSets.every(set => set.completed);

    if (allSetsCompleted) {
      console.log(`Alle Sätze von Übung ${exerciseIndex} completed`);
      onComplete(exerciseIndex, updatedSets);
    } else if (setIndex < exercise.sets - 1) {
      // Nächster Satz
      setCurrentSetIndex(setIndex + 1);
    } else {
      // Letzter Satz completed, aber nicht alle Sätze sind completed
      // Finde den ersten nicht-completed Satz
      const nextIncompleteSet = updatedSets.findIndex(set => !set.completed);
      if (nextIncompleteSet !== -1) {
        setCurrentSetIndex(nextIncompleteSet);
      } else {
        // Sollte nicht passieren, aber falls doch
        onComplete(exerciseIndex, updatedSets);
      }
    }
  };

  const handlePreviousSet = () => {
    if (currentSetIndex > 0) {
      setCurrentSetIndex(currentSetIndex - 1);
    }
  };

  const handleQuickRepsAdjust = (amount: number) => {
    handleSetUpdate(currentSetIndex, 'reps', Math.max(1, setsData[currentSetIndex].reps + amount));
  };

  const handleQuickWeightAdjust = (amount: number) => {
    handleSetUpdate(currentSetIndex, 'weight', Math.max(0, setsData[currentSetIndex].weight + amount));
  };

  // Prüfe ob alle Sätze completed sind
  const allSetsCompleted = setsData.every(set => set.completed);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mx-auto w-full max-w-md">
      {/* Übungs-Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full font-medium">
            {exerciseIndex + 1}/{totalExercises}
          </span>
          <h2 className="text-xl font-bold text-gray-800 line-clamp-2 leading-tight">
            {exercise.name}
          </h2>
        </div>
        <div className="flex justify-center gap-4 text-sm text-gray-600 flex-wrap">
          <span>{exercise.sets} Sätze</span>
          <span>{exercise.repsMin}-{exercise.repsMax} Wdh.</span>
          <span className="font-medium text-emerald-600">
            Satz {currentSetIndex + 1}/{exercise.sets}
          </span>
        </div>
      </div>

      {/* Aktueller Satz */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-emerald-800 mb-4 text-center">
          Satz {currentSetIndex + 1}
          {allSetsCompleted && " ✅"}
        </h3>

        {/* Wiederholungen */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
            Wiederholungen
          </label>
          <div className="flex items-center justify-between gap-3 mb-2">
            <button
              onClick={() => handleQuickRepsAdjust(-1)}
              className="bg-gray-200 text-gray-700 w-12 h-12 rounded-lg flex items-center justify-center hover:bg-gray-300 transition-colors touch-target text-lg font-bold active:scale-95"
            >
              −
            </button>
            
            <div className="flex-1">
              <input
                type="number"
                value={setsData[currentSetIndex].reps}
                onChange={(e) => handleSetUpdate(currentSetIndex, 'reps', parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400"
                min="1"
              />
            </div>
            
            <button
              onClick={() => handleQuickRepsAdjust(1)}
              className="bg-gray-200 text-gray-700 w-12 h-12 rounded-lg flex items-center justify-center hover:bg-gray-300 transition-colors touch-target text-lg font-bold active:scale-95"
            >
              +
            </button>
          </div>
          <div className="text-xs text-gray-500 text-center">
            Ziel: {exercise.repsMin}-{exercise.repsMax} Wiederholungen
          </div>
        </div>

        {/* Gewicht */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
            Gewicht (kg)
          </label>
          <div className="flex items-center justify-between gap-3 mb-2">
            <button
              onClick={() => handleQuickWeightAdjust(-2.5)}
              className="bg-gray-200 text-gray-700 w-12 h-12 rounded-lg flex items-center justify-center hover:bg-gray-300 transition-colors touch-target text-sm font-bold active:scale-95"
            >
              -2.5
            </button>
            
            <div className="flex-1">
              <input
                type="number"
                value={setsData[currentSetIndex].weight}
                onChange={(e) => handleSetUpdate(currentSetIndex, 'weight', parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400"
                step="0.5"
                min="0"
              />
            </div>
            
            <button
              onClick={() => handleQuickWeightAdjust(2.5)}
              className="bg-gray-200 text-gray-700 w-12 h-12 rounded-lg flex items-center justify-center hover:bg-gray-300 transition-colors touch-target text-sm font-bold active:scale-95"
            >
              +2.5
            </button>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col gap-3">
          {currentSetIndex > 0 && (
            <button
              onClick={handlePreviousSet}
              className="bg-gray-500 text-white px-6 py-3 rounded-lg font-medium transition-colors touch-target active:scale-95 w-full"
            >
              ← Vorheriger Satz
            </button>
          )}
          
          <button
            onClick={() => handleSetComplete(currentSetIndex)}
            disabled={allSetsCompleted}
            className={`px-6 py-4 rounded-lg font-semibold text-lg transition-colors touch-target active:scale-95 w-full shadow-lg ${
              allSetsCompleted
                ? 'bg-green-500 text-white cursor-not-allowed'
                : 'bg-emerald-400 hover:bg-emerald-600 text-white'
            }`}
          >
            {allSetsCompleted ? (
              <span className="flex items-center justify-center gap-2">
                <span>Alle Sätze completed</span>
                <span>✅</span>
              </span>
            ) : currentSetIndex < exercise.sets - 1 ? (
              <span className="flex items-center justify-center gap-2">
                <span>Nächster Satz</span>
                <span>→</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>Übung beenden</span>
                <span>🏁</span>
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Sätze Übersicht */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3 text-center">Satz Fortschritt</h4>
        <div className="grid grid-cols-3 gap-2">
          {setsData.map((set, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg text-center border transition-all cursor-pointer ${
                index === currentSetIndex
                  ? 'bg-emerald-100 border-emerald-400 scale-105 shadow-sm'
                  : set.completed
                  ? 'bg-green-100 border-green-400'
                  : 'bg-gray-100 border-gray-300'
              } touch-target active:scale-95`}
              onClick={() => setCurrentSetIndex(index)}
            >
              <div className="font-semibold text-sm">Satz {index + 1}</div>
              {set.completed ? (
                <div className="text-xs text-gray-600 mt-1">
                  {set.reps}×{set.weight}kg
                </div>
              ) : (
                <div className="text-xs text-gray-400 mt-1">–</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}