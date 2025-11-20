"use client";

import { useState, useEffect } from "react";

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

interface ActiveExerciseProps {
  exercise: ExerciseData;
  exerciseIndex: number;
  totalExercises: number;
  onComplete: (exerciseIndex: number, setsData: SetData[]) => void;
}

// Score Berechnungsfunktion (muss hier auch verfügbar sein)
const calculateScore = (weight: number, reps: number, factor: number, multiplier: number): number => {
  const score = (weight * Math.exp(factor * reps)) * 100 / multiplier;
  return Math.round(score * 100) / 100;
};

export default function ActiveExercise({ 
  exercise, 
  exerciseIndex, 
  totalExercises, 
  onComplete 
}: ActiveExerciseProps) {
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [setsData, setSetsData] = useState<SetData[]>(exercise.setsData);

  useEffect(() => {
    setSetsData(exercise.setsData);
    setCurrentSetIndex(0);
  }, [exercise]);

  const handleSetUpdate = (setIndex: number, field: 'reps' | 'weight', value: number) => {
    const updatedSets = [...setsData];
    
    updatedSets[setIndex] = {
      ...updatedSets[setIndex],
      [field]: value,
      score: calculateScore(
        field === 'weight' ? value : updatedSets[setIndex].weight,
        field === 'reps' ? value : updatedSets[setIndex].reps,
        exercise.factor,
        exercise.multiplier
      )
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

    const allSetsCompleted = updatedSets.every(set => set.completed);

    if (allSetsCompleted) {
      onComplete(exerciseIndex, updatedSets);
    } else if (setIndex < exercise.sets - 1) {
      setCurrentSetIndex(setIndex + 1);
    } else {
      const nextIncompleteSet = updatedSets.findIndex(set => !set.completed);
      if (nextIncompleteSet !== -1) {
        setCurrentSetIndex(nextIncompleteSet);
      } else {
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
    handleSetUpdate(currentSetIndex, 'reps', setsData[currentSetIndex].reps + amount);
  };

  const handleQuickWeightAdjust = (amount: number) => {
    handleSetUpdate(currentSetIndex, 'weight', setsData[currentSetIndex].weight + amount);
  };

  const useLastWorkoutData = () => {
    if (!exercise.lastWorkoutData) return;
    
    const updatedSets = setsData.map((set, index) => {
      const lastSet = exercise.lastWorkoutData?.setsData?.[index];
      if (lastSet) {
        return {
          ...set,
          reps: lastSet.reps,
          weight: lastSet.weight,
          score: calculateScore(lastSet.weight, lastSet.reps, exercise.factor, exercise.multiplier)
        };
      }
      return set;
    });
    
    setSetsData(updatedSets);
  };

  const allSetsCompleted = setsData.every(set => set.completed);
  const hasLastWorkoutData = exercise.lastWorkoutData;
  const currentSetScore = setsData[currentSetIndex]?.score || 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mx-auto w-full max-w-md">
      {/* Übungs-Header mit Score Info */}
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
        {/* Score Info */}
        <div className="mt-2 bg-purple-50 border border-purple-200 rounded-lg p-2">
          <div className="text-xs text-purple-700">
            <span className="font-semibold">Aktueller Score:</span> {currentSetScore} 
            <span className="text-purple-500 ml-2">
              (Factor: {exercise.factor}, Multiplier: {exercise.multiplier})
            </span>
          </div>
        </div>
      </div>

      {/* Letztes Workout Info */}
      {hasLastWorkoutData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-800 mb-1">
                Letztes Workout 📅
              </h4>
              <div className="text-xs text-blue-600 space-y-1">
                {exercise.lastWorkoutData.setsData.map((set: any, index: number) => (
                  <div key={index} className="flex justify-between">
                    <span>Satz {index + 1}:</span>
                    <span className="font-medium">
                      {set.reps} × {set.weight}kg 
                      <span className="text-blue-400 ml-1">(Score: {set.score})</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Aktueller Satz */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-emerald-800 mb-4 text-center">
          Satz {currentSetIndex + 1}
          {allSetsCompleted && " ✅"}
        </h3>

        {/* Score Anzeige */}
        <div className="bg-purple-100 border border-purple-300 rounded-lg p-3 mb-4 text-center">
          <div className="text-sm font-semibold text-purple-800">Aktueller Satz Score</div>
          <div className="text-2xl font-bold text-purple-600">{currentSetScore}</div>
        </div>

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
            
            <div className="flex-1 relative">
              <input
                type="number"
                value={setsData[currentSetIndex].reps === 0 ? "" : setsData[currentSetIndex].reps}
                onChange={(e) => {
                  const value = e.target.value;
                  handleSetUpdate(currentSetIndex, 'reps', value === "" ? 0 : parseInt(value) || 0);
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              {hasLastWorkoutData && exercise.lastWorkoutData.setsData[currentSetIndex] && (
                <div className="absolute -bottom-5 left-0 right-0 text-xs text-blue-500 text-center">
                  Letztes: {exercise.lastWorkoutData.setsData[currentSetIndex].reps}
                </div>
              )}
            </div>
            
            <button
              onClick={() => handleQuickRepsAdjust(1)}
              className="bg-gray-200 text-gray-700 w-12 h-12 rounded-lg flex items-center justify-center hover:bg-gray-300 transition-colors touch-target text-lg font-bold active:scale-95"
            >
              +
            </button>
          </div>
          <div className="text-xs text-gray-500 text-center mt-6">
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
            
            <div className="flex-1 relative">
              <input
                type="number"
                value={setsData[currentSetIndex].weight === 0 ? "" : setsData[currentSetIndex].weight}
                onChange={(e) => {
                  const value = e.target.value;
                  handleSetUpdate(currentSetIndex, 'weight', value === "" ? 0 : parseFloat(value) || 0);
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400"
                step="0.5"
              />
              {hasLastWorkoutData && exercise.lastWorkoutData.setsData[currentSetIndex] && (
                <div className="absolute -bottom-5 left-0 right-0 text-xs text-blue-500 text-center">
                  Letztes: {exercise.lastWorkoutData.setsData[currentSetIndex].weight}kg
                </div>
              )}
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

      {/* Sätze Übersicht mit Scores */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3 text-center">Satz Fortschritt & Scores</h4>
        <div className="grid grid-cols-2 gap-2">
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
              <div className={`text-xs font-medium mt-1 ${
                set.score && set.score > 0 ? 'text-purple-600' : 'text-gray-400'
              }`}>
                Score: {set.score || 0}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}