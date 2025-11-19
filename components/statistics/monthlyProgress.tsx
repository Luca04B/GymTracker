"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Line, ComposedChart } from "recharts";

interface WorkoutSession {
  id: string;
  planName: string;
  endTime: any;
  totalWorkoutScore: number;
  exercises: any[];
}

interface MonthlyProgressProps {
  workoutSessions: WorkoutSession[];
}

export default function MonthlyProgress({ workoutSessions }: MonthlyProgressProps) {
  // Group by month
  const monthlyData: { [key: string]: { workouts: number; totalScore: number; avgScore: number; exercises: number } } = {};

  workoutSessions.forEach(session => {
    const sessionDate = session.endTime?.toDate();
    if (!sessionDate) return;

    const monthKey = sessionDate.toLocaleDateString('de-DE', { year: 'numeric', month: 'long' });
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        workouts: 0,
        totalScore: 0,
        avgScore: 0,
        exercises: 0
      };
    }

    monthlyData[monthKey].workouts += 1;
    monthlyData[monthKey].totalScore += session.totalWorkoutScore;
    monthlyData[monthKey].exercises += session.exercises.length;
  });

  // Calculate averages and prepare chart data
  const chartData = Object.entries(monthlyData)
    .map(([month, data]) => ({
      month,
      workouts: data.workouts,
      avgScore: data.totalScore / data.workouts,
      totalScore: data.totalScore,
      exercises: data.exercises
    }))
    .sort((a, b) => {
      // Sort by date
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA.getTime() - dateB.getTime();
    });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-xl">
          <p className="font-bold text-gray-800">{label}</p>
          <p className="text-blue-600 font-semibold">
            Ø Score: <span className="text-gray-800">{payload[0].value.toFixed(1)}</span>
          </p>
          <p className="text-green-600">
            Workouts: <span className="text-gray-800 font-semibold">{payload[0].payload.workouts}</span>
          </p>
          <p className="text-purple-600">
            Übungen: <span className="text-gray-800 font-semibold">{payload[0].payload.exercises}</span>
          </p>
          <p className="text-orange-600">
            Gesamt Score: <span className="text-gray-800 font-semibold">{payload[0].payload.totalScore.toFixed(0)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📅</div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Keine monatlichen Daten</h3>
        <p className="text-gray-600">Führe Workouts durch, um monatliche Fortschritte zu sehen</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Monatlicher Fortschritt</h3>
        <p className="text-gray-600">
          Entwicklung deiner Leistung über die Monate
        </p>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis 
              dataKey="month" 
              stroke="#6b7280"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              yAxisId="left"
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => value.toFixed(0)}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#6b7280"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              yAxisId="left"
              dataKey="avgScore" 
              fill="#8b5cf6" 
              radius={[4, 4, 0, 0]}
              name="Ø Score"
              fillOpacity={0.8}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="workouts" 
              stroke="#10b981" 
              strokeWidth={3}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              name="Workouts"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {chartData.slice(-6).reverse().map((month, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
            <h4 className="font-semibold text-gray-800 mb-3">{month.month}</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Ø Score:</span>
                <span className="font-semibold text-purple-600">{month.avgScore.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Workouts:</span>
                <span className="font-semibold text-green-600">{month.workouts}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Übungen:</span>
                <span className="font-semibold text-blue-600">{month.exercises}</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-2">
                <span className="text-gray-600">Gesamt:</span>
                <span className="font-semibold text-orange-600">{month.totalScore.toFixed(0)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}