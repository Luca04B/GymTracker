"use client";

import { useState } from "react";

interface WorkoutSession {
  id: string;
  planName: string;
  endTime: any;
  totalWorkoutScore: number;
  exercises: any[];
}

interface WorkoutHistoryProps {
  workoutSessions: WorkoutSession[];
}

export default function WorkoutHistory({ workoutSessions }: WorkoutHistoryProps) {
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unbekannt';
    const date = timestamp.toDate();
    return date.toLocaleDateString('de-DE', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 2000) return 'text-green-600 bg-green-100';
    if (score >= 1500) return 'text-blue-600 bg-blue-100';
    if (score >= 1000) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const toggleExpand = (workoutId: string) => {
    setExpandedWorkout(expandedWorkout === workoutId ? null : workoutId);
  };

  if (workoutSessions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📅</div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Keine Workout-Historie</h3>
        <p className="text-gray-600">Starte dein erstes Workout, um es hier zu sehen</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Workout Verlauf</h3>
        <p className="text-gray-600">
          Chronologische Übersicht aller deiner Workouts
        </p>
      </div>

      <div className="space-y-4 max-h-[600px] overflow-y-auto">
        {workoutSessions.map((session, index) => (
          <div key={session.id} className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
            <div 
              className="p-4 cursor-pointer"
              onClick={() => toggleExpand(session.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-800 text-lg">{session.planName}</h4>
                  <p className="text-sm text-gray-500">{formatDate(session.endTime)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getScoreColor(session.totalWorkoutScore)}`}>
                    {session.totalWorkoutScore.toFixed(0)} Punkte
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    {expandedWorkout === session.id ? '▲' : '▼'}
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-gray-800">{session.exercises.length}</div>
                  <div className="text-gray-500">Übungen</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-800">
                    {session.exercises.reduce((total, exercise) => total + exercise.sets, 0)}
                  </div>
                  <div className="text-gray-500">Sätze</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-800">
                    {session.exercises.reduce((total, exercise) => 
                      total + exercise.setsData.reduce((sum: number, set: any) => sum + set.reps, 0), 0
                    )}
                  </div>
                  <div className="text-gray-500">Wiederholungen</div>
                </div>
                <div className="text-center">
                <div className="font-semibold text-gray-800">
                    {session.exercises.reduce((total, exercise) => 
                    total + exercise.setsData.reduce((sum: number, set: any) => sum + (set.weight * set.reps), 0), 0
                    ).toFixed(0)}kg
                </div>
                <div className="text-gray-500">Gesamtgewicht</div>
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedWorkout === session.id && (
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <h5 className="font-medium text-gray-700 mb-3">Übungsdetails:</h5>
                <div className="space-y-3">
                  {session.exercises.map((exercise, exIndex) => (
                    <div key={exIndex} className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <h6 className="font-semibold text-gray-800">{exercise.name}</h6>
                        <span className="text-purple-600 font-medium">
                          Score: {exercise.totalScore.toFixed(1)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        {exercise.setsData.map((set: any, setIndex: number) => (
                          <div key={setIndex} className="text-center bg-gray-100 rounded p-2">
                            <div className="font-medium">Satz {setIndex + 1}</div>
                            <div className="text-gray-700">
                              {set.reps} × {set.weight}kg
                            </div>
                            <div className="text-purple-600 text-xs font-medium">
                              Score: {set.score?.toFixed(1) || 0}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}