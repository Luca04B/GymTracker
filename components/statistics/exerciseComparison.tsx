"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Legend } from "recharts";

interface WorkoutSession {
  id: string;
  exercises: Array<{
    exerciseId: string;
    name: string;
    totalScore: number;
    sets: number;
    factor: number;
    multiplier: number;
  }>;
  endTime: any;
}

interface ExerciseComparisonProps {
  workoutSessions: WorkoutSession[];
}

export default function ExerciseComparison({ workoutSessions }: ExerciseComparisonProps) {
  // Aggregate exercise data
  const exerciseData: { [key: string]: { 
    name: string; 
    totalScore: number; 
    count: number; 
    avgScore: number;
    bestScore: number;
    totalWorkouts: number;
    workoutIds: Set<string>; // Track unique workout IDs
  } } = {};

  workoutSessions.forEach(session => {
    const workoutId = session.id;
    
    session.exercises.forEach(exercise => {
      if (!exerciseData[exercise.exerciseId]) {
        exerciseData[exercise.exerciseId] = {
          name: exercise.name,
          totalScore: 0,
          count: 0,
          avgScore: 0,
          bestScore: 0,
          totalWorkouts: 0,
          workoutIds: new Set()
        };
      }
      
      exerciseData[exercise.exerciseId].totalScore += exercise.totalScore;
      exerciseData[exercise.exerciseId].count += 1;
      exerciseData[exercise.exerciseId].workoutIds.add(workoutId);
      
      // Track best score
      if (exercise.totalScore > exerciseData[exercise.exerciseId].bestScore) {
        exerciseData[exercise.exerciseId].bestScore = exercise.totalScore;
      }
    });
  });

  // Calculate average scores and total workouts
  Object.keys(exerciseData).forEach(exerciseId => {
    exerciseData[exerciseId].avgScore = exerciseData[exerciseId].totalScore / exerciseData[exerciseId].count;
    exerciseData[exerciseId].totalWorkouts = exerciseData[exerciseId].workoutIds.size;
  });

  const chartData = Object.values(exerciseData)
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 8); // Top 8 exercises

  // Prepare data for trend chart (last 10 workouts for top exercises)
  const topExerciseIds = chartData.slice(0, 4).map(ex => 
    Object.keys(exerciseData).find(id => exerciseData[id].name === ex.name)
  );

  const trendData: { [key: string]: any } = {};
  
  // Sort workouts by date and take last 10
  const sortedSessions = [...workoutSessions]
    .sort((a, b) => a.endTime?.toDate() - b.endTime?.toDate())
    .slice(-10);

  sortedSessions.forEach(session => {
    const date = session.endTime?.toDate().toLocaleDateString('de-DE', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    trendData[date] = trendData[date] || { date };
    
    session.exercises.forEach(exercise => {
      if (topExerciseIds.includes(exercise.exerciseId)) {
        trendData[date][exerciseData[exercise.exerciseId].name] = exercise.totalScore;
      }
    });
  });

  const trendChartData = Object.values(trendData);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-xl">
          <p className="font-bold text-gray-800">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-semibold">{entry.value?.toFixed(1) || '0'}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const BarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-xl">
          <p className="font-bold text-gray-800">{label}</p>
          <p className="text-blue-600">
            Ø Score: <span className="text-gray-800 font-semibold">{data.avgScore.toFixed(1)}</span>
          </p>
          <p className="text-green-600">
            Bester Score: <span className="text-gray-800 font-semibold">{data.bestScore.toFixed(1)}</span>
          </p>
          <p className="text-sm text-gray-600">
            Workouts: <span className="font-semibold">{data.totalWorkouts}</span>
          </p>
          <p className="text-sm text-gray-600">
            Gesamtausführungen: <span className="font-semibold">{data.count}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">⚖️</div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Keine Übungen zum Vergleichen</h3>
        <p className="text-gray-600">Führe Workouts durch, um Übungen zu vergleichen</p>
      </div>
    );
  }

  const colors = ['#8b5cf6', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#d946ef'];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Übungsvergleich</h3>
        <p className="text-gray-600">
          Vergleich der durchschnittlichen Scores deiner Übungen
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Average Scores Bar Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-800 mb-4 text-center">Durchschnittliche Scores</h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis 
                  dataKey="name" 
                  stroke="#6b7280"
                  fontSize={11}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={(value) => value.toFixed(0)}
                />
                <Tooltip content={<BarTooltip />} />
                <Bar 
                  dataKey="avgScore" 
                  fill="#8b5cf6" 
                  radius={[4, 4, 0, 0]}
                  name="Ø Score"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trend Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-800 mb-4 text-center">Score Trends (Top 4 Übungen)</h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendChartData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  fontSize={11}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={(value) => value.toFixed(0)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {chartData.slice(0, 4).map((exercise, index) => (
                  <Line 
                    key={exercise.name}
                    type="monotone" 
                    dataKey={exercise.name} 
                    stroke={colors[index]}
                    strokeWidth={2}
                    dot={{ fill: colors[index], strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                    name={exercise.name}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Exercise List */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h4 className="font-semibold text-gray-800 mb-4 text-center">Detaillierter Übungsvergleich</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {chartData.map((exercise, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: colors[index] }}
                ></div>
                <h5 className="font-semibold text-gray-800 text-sm">{exercise.name}</h5>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Ø Score:</span>
                  <span className="font-semibold text-purple-600">{exercise.avgScore.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bester:</span>
                  <span className="font-semibold text-green-600">{exercise.bestScore.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Workouts:</span>
                  <span className="font-semibold text-blue-600">{exercise.totalWorkouts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ausführungen:</span>
                  <span className="font-semibold text-orange-600">{exercise.count}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <span className="text-gray-600">Gesamt Score:</span>
                  <span className="font-semibold text-gray-800">{exercise.totalScore.toFixed(0)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}