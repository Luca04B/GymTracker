"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";


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

interface PersonalRecordsProps {
  workoutSessions: WorkoutSession[];
}

export default function PersonalRecords({ workoutSessions }: PersonalRecordsProps) {
  // Find personal records for each exercise
  const personalRecords: { [key: string]: { 
    name: string; 
    bestScore: number; 
    date: Date; 
    bestWeight: number;
    bestReps: number;
    workoutName: string;
  } } = {};

  workoutSessions.forEach(session => {
    session.exercises.forEach(exercise => {
      if (!personalRecords[exercise.exerciseId]) {
        personalRecords[exercise.exerciseId] = {
          name: exercise.name,
          bestScore: 0,
          date: new Date(0),
          bestWeight: 0,
          bestReps: 0,
          workoutName: ''
        };
      }

      // Check if this exercise has a new best score
      if (exercise.totalScore > personalRecords[exercise.exerciseId].bestScore) {
        personalRecords[exercise.exerciseId] = {
          name: exercise.name,
          bestScore: exercise.totalScore,
          date: session.endTime?.toDate() || new Date(),
          bestWeight: Math.max(...exercise.setsData.map(set => set.weight)),
          bestReps: Math.max(...exercise.setsData.map(set => set.reps)),
          workoutName: session.planName || 'Unbekannt' // Jetzt korrekt: planName statt planName
        };
      }
    });
  });

  const recordsData = Object.values(personalRecords)
    .filter(record => record.bestScore > 0)
    .sort((a, b) => b.bestScore - a.bestScore)
    .slice(0, 10);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const record = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-xl">
          <p className="font-bold text-gray-800">{label}</p>
          <p className="text-blue-600 font-semibold text-lg">
            Score: <span className="text-gray-800">{record.bestScore.toFixed(1)}</span>
          </p>
          <p className="text-sm text-gray-600">
            Bestes Gewicht: <span className="font-semibold">{record.bestWeight}kg</span>
          </p>
          <p className="text-sm text-gray-600">
            Beste Wiederholungen: <span className="font-semibold">{record.bestReps}</span>
          </p>
          <p className="text-sm text-gray-600">
            Workout: <span className="font-semibold">{record.workoutName}</span>
          </p>
          <p className="text-sm text-gray-600">
            Datum: <span className="font-semibold">{record.date.toLocaleDateString('de-DE')}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (recordsData.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🏆</div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Noch keine Personal Records</h3>
        <p className="text-gray-600">Führe Workouts durch, um deine Bestleistungen zu tracken</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Personal Records</h3>
        <p className="text-gray-600">
          Deine Bestleistungen für jede Übung
        </p>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={recordsData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis 
              dataKey="name" 
              stroke="#6b7280"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => value.toFixed(0)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="bestScore" 
              fill="#f59e0b" 
              radius={[4, 4, 0, 0]}
              name="Bester Score"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Records List */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-800 text-center">Deine Bestleistungen</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recordsData.map((record, index) => (
            <div key={index} className="bg-gradient-to-br from-yellow-50 to-orange-100 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="bg-yellow-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>
                  <h5 className="font-semibold text-gray-800">{record.name}</h5>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-yellow-600">{record.bestScore.toFixed(1)}</div>
                  <div className="text-xs text-yellow-500">Score</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Gewicht:</span>
                  <span className="font-semibold text-gray-800 ml-1">{record.bestWeight}kg</span>
                </div>
                <div>
                  <span className="text-gray-600">Wiederholungen:</span>
                  <span className="font-semibold text-gray-800 ml-1">{record.bestReps}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">Workout:</span>
                  <span className="font-semibold text-gray-800 ml-1">{record.workoutName}</span>
                </div>
                <div className="col-span-2 text-xs text-gray-500">
                  Erreicht am {record.date.toLocaleDateString('de-DE')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}