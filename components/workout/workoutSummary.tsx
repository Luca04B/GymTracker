"use client";

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

interface WorkoutSummaryProps {
  workoutData: ExerciseData[];
  planName: string;
  onEditExercise: (index: number) => void;
  onSaveWorkout: () => void;
}

export default function WorkoutSummary({ 
  workoutData, 
  planName, 
  onEditExercise, 
  onSaveWorkout 
}: WorkoutSummaryProps) {
  const totalSets = workoutData.reduce((total, exercise) => total + exercise.sets, 0);
  const completedSets = workoutData.reduce((total, exercise) => 
    total + exercise.setsData.filter(set => set.completed).length, 0
  );
  const totalWorkoutScore = workoutData.reduce((total, exercise) => total + exercise.totalScore, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Workout abgeschlossen! 🎉</h2>
        <p className="text-gray-600">Gut gemacht! Hier ist deine Zusammenfassung:</p>
      </div>

      {/* Score Statistiken */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{workoutData.length}</div>
          <div className="text-blue-700 text-sm">Übungen</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{completedSets}/{totalSets}</div>
          <div className="text-green-700 text-sm">Sätze completed</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {workoutData.reduce((total, exercise) => 
              total + exercise.setsData.reduce((sum, set) => sum + set.reps, 0), 0
            )}
          </div>
          <div className="text-purple-700 text-sm">Wiederholungen</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {totalWorkoutScore.toFixed(1)}
          </div>
          <div className="text-orange-700 text-sm">Gesamt Score</div>
        </div>
      </div>

      {/* Übungsdetails mit Scores */}
      <div className="space-y-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Übungsdetails & Scores</h3>
        {workoutData.map((exercise, exerciseIndex) => (
          <div key={exerciseIndex} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-semibold text-gray-800 text-lg">{exercise.name}</h4>
                <div className="text-sm text-gray-600">
                  Factor: {exercise.factor} | Multiplier: {exercise.multiplier}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                  Score: {exercise.totalScore.toFixed(1)}
                </div>
                <button
                  onClick={() => onEditExercise(exerciseIndex)}
                  className="bg-sky-600 hover:bg-sky-800 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  Bearbeiten
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {exercise.setsData.map((set, setIndex) => (
                <div
                  key={setIndex}
                  className={`p-3 rounded text-center ${
                    set.completed ? 'bg-green-100 border border-green-300' : 'bg-gray-100'
                  }`}
                >
                  <div className="font-medium">Satz {setIndex + 1}</div>
                  {set.completed ? (
                    <div className="text-sm text-gray-700">
                      {set.reps} × {set.weight}kg
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">Nicht completed</div>
                  )}
                  <div className={`text-sm font-medium mt-1 ${
                    set.score && set.score > 0 ? 'text-purple-600' : 'text-gray-400'
                  }`}>
                    Score: {set.score?.toFixed(1) || 0}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={() => onEditExercise(0)}
          className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Workout bearbeiten
        </button>
        <button
          onClick={onSaveWorkout}
          className="bg-emerald-400 hover:bg-emerald-600 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
        >
          Workout speichern ✅
        </button>
      </div>
    </div>
  );
}