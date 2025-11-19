"use client";

interface WorkoutSession {
  id: string;
  planName: string;
  endTime: any;
  totalWorkoutScore: number;
  exercises: any[];
}

interface MiniStatsProps {
  workoutSessions: WorkoutSession[];
}

export default function MiniStats({ workoutSessions }: MiniStatsProps) {
  const totalWorkouts = workoutSessions.length;
  const totalScore = workoutSessions.reduce((sum, session) => sum + session.totalWorkoutScore, 0);
  const avgScore = totalWorkouts > 0 ? totalScore / totalWorkouts : 0;
  const bestScore = Math.max(...workoutSessions.map(s => s.totalWorkoutScore), 0);

  // Recent workouts (last 7 days)
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentWorkouts = workoutSessions.filter(session => 
    session.endTime?.toDate() >= oneWeekAgo
  ).length;

  if (totalWorkouts === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6 text-center">
        <div className="text-4xl mb-3">🎯</div>
        <h3 className="font-semibold text-gray-800 mb-2">Starte deine Fitness-Reise</h3>
        <p className="text-gray-600 text-sm">
          Beginne mit deinem ersten Workout, um Statistiken zu sehen
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800 text-lg">🏆 Deine Statistik</h3>
        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
          {recentWorkouts} diese Woche
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{totalWorkouts}</div>
          <div className="text-xs text-blue-700 font-medium">Workouts</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{avgScore.toFixed(0)}</div>
          <div className="text-xs text-green-700 font-medium">Ø Score</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{bestScore.toFixed(0)}</div>
          <div className="text-xs text-purple-700 font-medium">Bester</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {workoutSessions.reduce((total, session) => total + session.exercises.length, 0)}
          </div>
          <div className="text-xs text-orange-700 font-medium">Übungen</div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-blue-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Letztes Workout:</span>
          <span className="font-semibold text-gray-800">
            {workoutSessions[0]?.endTime?.toDate().toLocaleDateString('de-DE') || 'Noch keins'}
          </span>
        </div>
      </div>
    </div>
  );
}