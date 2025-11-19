"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { useState } from "react";

interface WorkoutSession {
  id: string;
  planName: string;
  endTime: any;
  totalWorkoutScore: number;
  exercises: Array<{
    exerciseId: string;
    name: string;
    totalScore: number;
  }>;
}

interface ExerciseProgressChartProps {
  workoutSessions: WorkoutSession[];
}

export default function ExerciseProgressChart({ workoutSessions }: ExerciseProgressChartProps) {
  const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set());
  const [timeRange, setTimeRange] = useState<'month' | '3months' | 'all'>('month');

  // Sammle alle einzigartigen Übungen
  const allExercises: { [key: string]: string } = {};
  
  workoutSessions.forEach(session => {
    session.exercises.forEach(exercise => {
      if (!allExercises[exercise.exerciseId]) {
        allExercises[exercise.exerciseId] = exercise.name;
      }
    });
  });

  // Filtere Sessions basierend auf Zeitraum
  const filterSessionsByTimeRange = (sessions: WorkoutSession[]) => {
    const now = new Date();
    return sessions.filter(session => {
      const sessionDate = session.endTime?.toDate();
      if (!sessionDate) return false;

      switch (timeRange) {
        case 'month':
          const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return sessionDate >= oneMonthAgo;
        case '3months':
          const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          return sessionDate >= threeMonthsAgo;
        case 'all':
        default:
          return true;
      }
    }).sort((a, b) => a.endTime.toDate() - b.endTime.toDate());
  };

  const filteredSessions = filterSessionsByTimeRange(workoutSessions);

  // Gruppiere Workouts nach Tagen
  const dailyWorkouts: { [key: string]: WorkoutSession[] } = {};

  filteredSessions.forEach(session => {
    const sessionDate = session.endTime?.toDate();
    if (!sessionDate) return;

    // Erstelle einen täglichen Schlüssel (YYYY-MM-DD)
    const dayKey = sessionDate.toISOString().split('T')[0];
    
    if (!dailyWorkouts[dayKey]) {
      dailyWorkouts[dayKey] = [];
    }
    dailyWorkouts[dayKey].push(session);
  });

  // Bereite Daten für das Chart vor - tägliche Aggregation
  const chartData: any[] = [];
  const exerciseData: { [key: string]: any[] } = {};

  // Initialisiere exerciseData für alle Übungen
  Object.keys(allExercises).forEach(exerciseId => {
    exerciseData[exerciseId] = [];
  });

  // Verarbeite jeden Tag
  Object.entries(dailyWorkouts).forEach(([dayKey, daySessions]) => {
    const date = new Date(dayKey);
    const dateLabel = date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit'
    });

    const dataPoint: any = { 
      date: dateLabel, 
      fullDate: date.toLocaleDateString('de-DE', {
        weekday: 'short',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      dayKey: dayKey
    };

    // Für jede Übung: finde den besten/durchschnittlichen Score des Tages
    Object.keys(allExercises).forEach(exerciseId => {
      const exerciseScoresOnDay: number[] = [];

      // Sammle alle Scores dieser Übung an diesem Tag
      daySessions.forEach(session => {
        session.exercises.forEach(exercise => {
          if (exercise.exerciseId === exerciseId) {
            exerciseScoresOnDay.push(exercise.totalScore);
          }
        });
      });

      if (exerciseScoresOnDay.length > 0) {
        // Verwende den besten Score des Tages für die Linie
        const bestScore = Math.max(...exerciseScoresOnDay);
        dataPoint[exerciseId] = bestScore;

        // Speichere für Statistiken
        exerciseData[exerciseId].push({
          date: dateLabel,
          fullDate: dataPoint.fullDate,
          score: bestScore,
          exerciseName: allExercises[exerciseId],
          dayKey: dayKey
        });
      }
    });

    chartData.push(dataPoint);
  });

  // Sortiere Daten nach Datum
  chartData.sort((a, b) => new Date(a.dayKey).getTime() - new Date(b.dayKey).getTime());

  // Farben für die Linien
  const colors = [
    '#8b5cf6', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', 
    '#06b6d4', '#84cc16', '#d946ef', '#f97316', '#64748b',
    '#14b8a6', '#f43f5e', '#8b5cf6', '#06b6d4', '#84cc16'
  ];

  const toggleExercise = (exerciseId: string) => {
    const newSelected = new Set(selectedExercises);
    if (newSelected.has(exerciseId)) {
      newSelected.delete(exerciseId);
    } else {
      newSelected.add(exerciseId);
    }
    setSelectedExercises(newSelected);
  };

  const selectAllExercises = () => {
    setSelectedExercises(new Set(Object.keys(allExercises)));
  };

  const deselectAllExercises = () => {
    setSelectedExercises(new Set());
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-xl max-w-xs">
          <p className="font-bold text-gray-800 mb-2">{label}</p>
          <p className="text-sm text-gray-600 mb-3">
            {payload[0]?.payload.fullDate}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              ></div>
              <span className="text-sm font-medium" style={{ color: entry.color }}>
                {allExercises[entry.dataKey]}: 
              </span>
              <span className="text-sm text-gray-700 font-semibold">
                {entry.value.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (Object.keys(allExercises).length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📈</div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Keine Übungsdaten</h3>
        <p className="text-gray-600">Führe Workouts durch, um Übungsentwicklungen zu sehen</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Übungsentwicklung (Täglich)</h3>
        <p className="text-gray-600">
          Tägliche Bestwerte für jede Übung - Mehrere Workouts pro Tag werden zusammengefasst
        </p>
      </div>

      {/* Zeitraum Auswahl */}
      <div className="flex justify-center">
        <div className="bg-gray-100 rounded-lg p-1">
          {[
            { value: 'month', label: '1 Monat' },
            { value: '3months', label: '3 Monate' },
            { value: 'all', label: 'Alle Zeit' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setTimeRange(option.value as any)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                timeRange === option.value
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Übungsauswahl */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-semibold text-gray-800">Übungen auswählen ({selectedExercises.size} ausgewählt)</h4>
          <div className="flex gap-2">
            <button
              onClick={selectAllExercises}
              className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
            >
              Alle auswählen
            </button>
            <button
              onClick={deselectAllExercises}
              className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600 transition-colors"
            >
              Alle abwählen
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-40 overflow-y-auto">
          {Object.entries(allExercises).map(([exerciseId, exerciseName], index) => (
            <label key={exerciseId} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-gray-50 rounded">
              <input
                type="checkbox"
                checked={selectedExercises.has(exerciseId)}
                onChange={() => toggleExercise(exerciseId)}
                className="rounded text-blue-500 focus:ring-blue-500"
              />
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: colors[index % colors.length] }}
                ></div>
                <span className="text-sm text-gray-700 truncate" title={exerciseName}>
                  {exerciseName}
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {selectedExercises.size === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📊</div>
            <p className="text-gray-600">Wähle Übungen aus, um sie im Chart zu sehen</p>
          </div>
        ) : (
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={(value) => value.toFixed(0)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {Array.from(selectedExercises).map((exerciseId, index) => (
                  <Line
                    key={exerciseId}
                    type="monotone"
                    dataKey={exerciseId}
                    stroke={colors[index % colors.length]}
                    strokeWidth={3}
                    dot={{ fill: colors[index % colors.length], strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 8, fill: colors[index % colors.length] }}
                    name={allExercises[exerciseId]}
                    connectNulls={true}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Übungsstatistiken */}
      {selectedExercises.size > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from(selectedExercises).map((exerciseId, index) => {
            const exerciseScores = exerciseData[exerciseId] || [];
            const bestScore = Math.max(...exerciseScores.map((e: any) => e.score), 0);
            const avgScore = exerciseScores.length > 0 
              ? exerciseScores.reduce((sum: number, e: any) => sum + e.score, 0) / exerciseScores.length 
              : 0;
            const workoutCount = exerciseScores.length;
            const daysWithData = new Set(exerciseScores.map((e: any) => e.dayKey)).size;

            return (
              <div key={exerciseId} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: colors[index % colors.length] }}
                  ></div>
                  <h5 className="font-semibold text-gray-800 text-sm">{allExercises[exerciseId]}</h5>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tage mit Daten:</span>
                    <span className="font-semibold text-blue-600">{daysWithData}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bester Score:</span>
                    <span className="font-semibold text-green-600">{bestScore.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ø Score:</span>
                    <span className="font-semibold text-purple-600">{avgScore.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-100 pt-2">
                    <span className="text-gray-600">Gesamt Score:</span>
                    <span className="font-semibold text-orange-600">
                      {exerciseScores.reduce((sum: number, e: any) => sum + e.score, 0).toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}