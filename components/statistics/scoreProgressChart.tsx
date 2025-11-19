"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area } from "recharts";

interface WorkoutSession {
  id: string;
  planName: string;
  endTime: any;
  totalWorkoutScore: number;
  exercises: any[];
}

interface ScoreProgressChartProps {
  workoutSessions: WorkoutSession[];
  timeRange: 'week' | 'month' | 'all';
}

export default function ScoreProgressChart({ workoutSessions, timeRange }: ScoreProgressChartProps) {
  const filterSessionsByTimeRange = (sessions: WorkoutSession[]) => {
    const now = new Date();
    const filtered = sessions.filter(session => {
      const sessionDate = session.endTime?.toDate();
      if (!sessionDate) return false;

      switch (timeRange) {
        case 'week':
          const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return sessionDate >= oneWeekAgo;
        case 'month':
          const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return sessionDate >= oneMonthAgo;
        case 'all':
        default:
          return true;
      }
    });
    
    return filtered.sort((a, b) => a.endTime.toDate() - b.endTime.toDate());
  };

  const filteredSessions = filterSessionsByTimeRange(workoutSessions);

  const chartData = filteredSessions.map((session, index) => {
    const sessionDate = session.endTime?.toDate();
    
    // Erstelle einen eindeutigen Key für jeden Datenpunkt
    return {
      // Füge Index hinzu, um gleiche Datenpunkte unterscheidbar zu machen
      uniqueKey: `${sessionDate?.getTime()}-${index}`,
      // Kurzes Datum für die X-Achse
      date: sessionDate.toLocaleDateString('de-DE', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      // Vollständiges Datum für Tooltip
      fullDate: sessionDate.toLocaleDateString('de-DE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      score: session.totalWorkoutScore,
      planName: session.planName,
      exercises: session.exercises.length,
      // Zeitstempel für korrekte Sortierung
      timestamp: sessionDate.getTime()
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-xl">
          <p className="font-bold text-gray-800">{payload[0].payload.fullDate}</p>
          <p className="text-blue-600 font-semibold text-lg">
            Score: <span className="text-gray-800">{payload[0].value.toFixed(1)}</span>
          </p>
          <p className="text-sm text-gray-600">
            Plan: {payload[0].payload.planName}
          </p>
          <p className="text-sm text-gray-600">
            Übungen: {payload[0].payload.exercises}
          </p>
        </div>
      );
    }
    return null;
  };

  if (filteredSessions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Keine Daten verfügbar</h3>
        <p className="text-gray-600">
          {timeRange === 'week' 
            ? 'Starte dein erstes Workout dieser Woche, um Daten zu sehen!'
            : timeRange === 'month'
            ? 'Starte dein erstes Workout diesen Monat, um Daten zu sehen!'
            : 'Starte dein erstes Workout, um Daten zu sehen!'
          }
        </p>
      </div>
    );
  }

  // Calculate trend
  const scores = filteredSessions.map(s => s.totalWorkoutScore);
  const trend = scores.length > 1 ? scores[scores.length - 1] - scores[0] : 0;

  return (
    <div className="space-y-6">
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={chartData} 
            margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis 
              dataKey="date" 
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
            <Area 
              type="monotone" 
              dataKey="score" 
              stroke="#10b981" 
              fill="url(#colorScore)" 
              strokeWidth={3}
              fillOpacity={0.3}
            />
            <Line 
              type="monotone" 
              dataKey="score" 
              stroke="#10b981" 
              strokeWidth={3}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, fill: '#059669' }}
            />
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Enhanced Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{filteredSessions.length}</div>
          <div className="text-sm text-blue-700 font-medium">Workouts</div>
          <div className="text-xs text-blue-500 mt-1">In diesem Zeitraum</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {Math.max(...filteredSessions.map(s => s.totalWorkoutScore), 0).toFixed(0)}
          </div>
          <div className="text-sm text-green-700 font-medium">Bester Score</div>
          <div className="text-xs text-green-500 mt-1">Höchster Wert</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {(filteredSessions.reduce((sum, session) => sum + session.totalWorkoutScore, 0) / filteredSessions.length).toFixed(0)}
          </div>
          <div className="text-sm text-purple-700 font-medium">Ø Score</div>
          <div className="text-xs text-purple-500 mt-1">Durchschnitt</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4 text-center">
          <div className={`text-2xl font-bold ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? '+' : ''}{trend.toFixed(0)}
          </div>
          <div className="text-sm text-orange-700 font-medium">Trend</div>
          <div className="text-xs text-orange-500 mt-1">Seit Beginn</div>
        </div>
      </div>
    </div>
  );
}   