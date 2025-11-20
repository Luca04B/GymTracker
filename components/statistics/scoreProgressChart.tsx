"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, Legend } from "recharts";
import { useState, useMemo } from "react";

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
  const [hiddenPlans, setHiddenPlans] = useState<Set<string>>(new Set());

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

  // Gruppiere Sessions nach PlanName
  const sessionsByPlan = useMemo(() => {
    const groups: { [key: string]: WorkoutSession[] } = {};
    
    filteredSessions.forEach(session => {
      if (!groups[session.planName]) {
        groups[session.planName] = [];
      }
      groups[session.planName].push(session);
    });
    
    return groups;
  }, [filteredSessions]);

  // Erstelle Chart-Daten mit täglicher Gruppierung
  const chartData = useMemo(() => {
    const dailyData: { [key: string]: { 
      date: string;
      fullDate: string;
      timestamp: number;
      plans: { [planName: string]: { score: number; workoutCount: number } };
    } } = {};

    // Gruppiere alle Workouts nach Tag
    filteredSessions.forEach(session => {
      const sessionDate = session.endTime?.toDate();
      const dateKey = sessionDate.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = {
          date: sessionDate.toLocaleDateString('de-DE', { 
            month: 'short', 
            day: 'numeric'
          }),
          fullDate: sessionDate.toLocaleDateString('de-DE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          timestamp: sessionDate.getTime(),
          plans: {}
        };
      }
      
      // Für jeden Plan den Durchschnitt pro Tag berechnen
      if (!dailyData[dateKey].plans[session.planName]) {
        dailyData[dateKey].plans[session.planName] = {
          score: 0,
          workoutCount: 0
        };
      }
      
      dailyData[dateKey].plans[session.planName].score += session.totalWorkoutScore;
      dailyData[dateKey].plans[session.planName].workoutCount += 1;
    });

    // Konvertiere zu Array und berechne Durchschnitte
    const result = Object.values(dailyData)
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(day => {
        const dayData: any = {
          date: day.date,
          fullDate: day.fullDate,
          timestamp: day.timestamp
        };
        
        // Für jeden Plan den Tagesdurchschnitt berechnen
        Object.entries(day.plans).forEach(([planName, data]) => {
          dayData[`score_${planName}`] = data.score / data.workoutCount;
          dayData[`workouts_${planName}`] = data.workoutCount;
        });
        
        return dayData;
      });

    return result;
  }, [filteredSessions]);

  // Farben für die verschiedenen Pläne
  const planColors = [
    '#10b981', // Grün
    '#3b82f6', // Blau
    '#8b5cf6', // Lila
    '#f59e0b', // Orange
    '#ef4444', // Rot
    '#06b6d4', // Cyan
    '#d946ef', // Pink
    '#84cc16', // Lime
  ];

  const planNames = Object.keys(sessionsByPlan);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-xl max-w-sm">
          <p className="font-bold text-gray-800 mb-3 border-b pb-2">{data.fullDate}</p>
          <div className="space-y-2">
            {payload.map((entry: any, index: number) => {
              const planName = entry.dataKey.replace('score_', '');
              if (hiddenPlans.has(planName)) return null;
              const workoutCount = data[`workouts_${planName}`] || 0;
              
              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: entry.color }}
                    ></div>
                    <span className="text-sm font-medium text-gray-700">{planName}</span>
                    {workoutCount > 1 && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-1 rounded">
                        {workoutCount}×
                      </span>
                    )}
                  </div>
                  <span className="font-semibold text-gray-800">
                    {entry.value?.toFixed(1) || '–'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  const handleLegendClick = (planName: string) => {
    setHiddenPlans(prev => {
      const newHidden = new Set(prev);
      if (newHidden.has(planName)) {
        newHidden.delete(planName);
      } else {
        newHidden.add(planName);
      }
      return newHidden;
    });
  };

  const CustomLegend = () => (
    <div className="flex flex-wrap gap-3 justify-center mt-4 px-4">
      {planNames.map((planName, index) => {
        const isHidden = hiddenPlans.has(planName);
        const color = planColors[index % planColors.length];
        const sessionCount = sessionsByPlan[planName].length;
        
        return (
          <div
            key={planName}
            onClick={() => handleLegendClick(planName)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${
              isHidden 
                ? 'bg-gray-100 text-gray-400 opacity-50' 
                : 'bg-white border border-gray-200 shadow-sm hover:shadow-md'
            }`}
            style={{ borderLeft: `4px solid ${color}` }}
          >
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: color }}
            ></div>
            <span className={`text-sm font-medium ${isHidden ? 'line-through' : ''}`}>
              {planName}
            </span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {sessionCount} Workout{sessionCount !== 1 ? 's' : ''}
            </span>
          </div>
        );
      })}
    </div>
  );

  // Berechne Trends pro Plan (täglich)
  const planTrends = useMemo(() => {
    const trends: { [key: string]: number } = {};
    
    Object.entries(sessionsByPlan).forEach(([planName, sessions]) => {
      if (sessions.length > 1) {
        // Gruppiere nach Tag und berechne Tagesdurchschnitte
        const dailyScores: { [date: string]: number[] } = {};
        
        sessions.forEach(session => {
          const dateKey = session.endTime.toDate().toISOString().split('T')[0];
          if (!dailyScores[dateKey]) {
            dailyScores[dateKey] = [];
          }
          dailyScores[dateKey].push(session.totalWorkoutScore);
        });
        
        // Berechne Tagesdurchschnitte
        const dailyAverages = Object.entries(dailyScores)
          .map(([date, scores]) => ({
            date,
            avgScore: scores.reduce((sum, score) => sum + score, 0) / scores.length
          }))
          .sort((a, b) => a.date.localeCompare(b.date));
        
        if (dailyAverages.length > 1) {
          const firstScore = dailyAverages[0].avgScore;
          const lastScore = dailyAverages[dailyAverages.length - 1].avgScore;
          trends[planName] = lastScore - firstScore;
        } else {
          trends[planName] = 0;
        }
      } else {
        trends[planName] = 0;
      }
    });
    
    return trends;
  }, [sessionsByPlan]);

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
            
            {/* Dynamische Linien für jeden Plan */}
            {planNames.map((planName, index) => {
              if (hiddenPlans.has(planName)) return null;
              
              const color = planColors[index % planColors.length];
              
              return (
                <Line
                  key={planName}
                  type="monotone"
                  dataKey={`score_${planName}`}
                  stroke={color}
                  strokeWidth={3}
                  dot={{ fill: color, strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, fill: color }}
                  name={planName}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Custom Legend */}
      <CustomLegend />

      {/* Enhanced Stats Summary mit Trends pro Plan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {Object.keys(chartData).length}
          </div>
          <div className="text-sm text-blue-700 font-medium">Tage</div>
          <div className="text-xs text-blue-500 mt-1">Mit Workouts</div>
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
          <div className="text-2xl font-bold text-orange-600">{planNames.length}</div>
          <div className="text-sm text-orange-700 font-medium">Trainingspläne</div>
          <div className="text-xs text-orange-500 mt-1">Aktiv</div>
        </div>
      </div>

      {/* Plan-spezifische Trends */}
      {planNames.length > 1 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h4 className="font-semibold text-gray-800 mb-4">Tägliche Trends pro Trainingsplan</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {planNames.map((planName, index) => {
              const trend = planTrends[planName] || 0;
              const sessions = sessionsByPlan[planName];
              const avgScore = sessions.reduce((sum, s) => sum + s.totalWorkoutScore, 0) / sessions.length;
              const workoutDays = new Set(sessions.map(s => 
                s.endTime.toDate().toISOString().split('T')[0]
              )).size;
              
              return (
                <div 
                  key={planName}
                  className="border border-gray-200 rounded-lg p-3"
                  style={{ borderLeft: `4px solid ${planColors[index % planColors.length]}` }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-gray-800 text-sm">{planName}</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {workoutDays} Tag{workoutDays !== 1 ? 'e' : ''}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Ø Score: {avgScore.toFixed(1)}</span>
                    <span className={`text-xs font-medium ${
                      trend >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {trend >= 0 ? '↗' : '↘'} {trend >= 0 ? '+' : ''}{trend.toFixed(1)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}