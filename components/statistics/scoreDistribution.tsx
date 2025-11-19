"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface WorkoutSession {
  id: string;
  totalWorkoutScore: number;
  exercises: any[];
}

interface ScoreDistributionProps {
  workoutSessions: WorkoutSession[];
}

export default function ScoreDistribution({ workoutSessions }: ScoreDistributionProps) {
  // Score ranges
  const scoreRanges = [
    { range: '1000-1250', min: 1000, max: 1250, color: '#ef4444' },
    { range: '1250-1500', min: 1250, max: 1500, color: '#f59e0b' },
    { range: '1500-1750', min: 1500, max: 1750, color: '#10b981' },
    { range: '1750-2000', min: 1750, max: 2000, color: '#3b82f6' },
    { range: '2000+', min: 2000, max: Infinity, color: '#8b5cf6' },
  ];

  // Count workouts in each range
  const rangeData = scoreRanges.map(range => ({
    name: range.range,
    value: workoutSessions.filter(session => 
      session.totalWorkoutScore >= range.min && session.totalWorkoutScore < range.max
    ).length,
    color: range.color
  }));

  // Top exercises by average score
  const exerciseScores: { [key: string]: { name: string; scores: number[]; avgScore: number } } = {};

  workoutSessions.forEach(session => {
    session.exercises.forEach(exercise => {
      if (!exerciseScores[exercise.exerciseId]) {
        exerciseScores[exercise.exerciseId] = {
          name: exercise.name,
          scores: [],
          avgScore: 0
        };
      }
      exerciseScores[exercise.exerciseId].scores.push(exercise.totalScore);
    });
  });

  // Calculate averages
  Object.keys(exerciseScores).forEach(exerciseId => {
    const exercise = exerciseScores[exerciseId];
    exercise.avgScore = exercise.scores.reduce((a, b) => a + b, 0) / exercise.scores.length;
  });

  const topExercises = Object.values(exerciseScores)
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 8);

  const CustomTooltip = ({ active, payload, name }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{name || payload[0].name}</p>
          <p className="text-gray-600">
            Workouts: <span className="font-semibold">{payload[0].value}</span>
          </p>
          <p className="text-gray-600">
            {((payload[0].value / workoutSessions.length) * 100).toFixed(1)}% aller Workouts
          </p>
        </div>
      );
    }
    return null;
  };

  if (workoutSessions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🎯</div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Keine Daten für Verteilung</h3>
        <p className="text-gray-600">Starte Workouts, um Score-Verteilungen zu sehen</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Score Verteilung</h3>
        <p className="text-gray-600">
          Verteilung deiner Workout-Scores und Top-Übungen
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Score Distribution Pie Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-800 mb-4 text-center">Workout Score Verteilung</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={rangeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent ?? 0 * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {rangeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {rangeData.map((range, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: range.color }}
                ></div>
                <span className="text-sm text-gray-600">
                  {range.name} ({range.value})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Exercises Bar Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-800 mb-4 text-center">Top Übungen nach Score</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topExercises} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis 
                  dataKey="name" 
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
                <Tooltip 
                  formatter={(value: number) => [value.toFixed(1), 'Ø Score']}
                  labelFormatter={(label) => `Übung: ${label}`}
                />
                <Bar 
                  dataKey="avgScore" 
                  fill="#8b5cf6" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{workoutSessions.length}</div>
          <div className="text-sm text-blue-700 font-medium">Gesamt Workouts</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {Object.keys(exerciseScores).length}
          </div>
          <div className="text-sm text-green-700 font-medium">Einzigartige Übungen</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {(workoutSessions.reduce((sum, session) => sum + session.totalWorkoutScore, 0) / workoutSessions.length).toFixed(0)}
          </div>
          <div className="text-sm text-purple-700 font-medium">Globaler Ø Score</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {Math.max(...workoutSessions.map(s => s.totalWorkoutScore), 0).toFixed(0)}
          </div>
          <div className="text-sm text-orange-700 font-medium">Bester Score</div>
        </div>
      </div>
    </div>
  );
}