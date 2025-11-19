"use client";

import { auth, db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/components/header";
import LoadingSpinner from "@/components/loadingSpinner";
import ScoreProgressChart from "@/components/statistics/scoreProgressChart";
import ExerciseComparison from "@/components/statistics/exerciseComparison";
import WorkoutHistory from "@/components/statistics/workoutHistory";
import PersonalRecords from "@/components/statistics/personalRecords";
import MonthlyProgress from "@/components/statistics/monthlyProgress";
import ScoreDistribution from "@/components/statistics/scoreDistribution";
import ExerciseProgressChart from "@/components/statistics/exerciseProgressChart";

interface WorkoutSession {
  id: string;
  planId: string;
  planName: string;
  exercises: any[];
  startTime: any;
  endTime: any;
  completed: boolean;
  userId: string;
  totalWorkoutScore: number;
}

export default function StatisticsPage() {
  const router = useRouter();
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'all'>('month');
  const [activeTab, setActiveTab] = useState<'progress' | 'comparison' | 'history' | 'records' | 'monthly' | 'distribution' | 'exerciseProgress'>('progress');
  useEffect(() => {
    fetchWorkoutSessions();
  }, []);

  const fetchWorkoutSessions = async () => {
    const user = auth.currentUser;
    if (!user) {
      router.push("/login");
      return;
    }

    try {
      const sessionsQuery = query(
        collection(db, "users", user.uid, "workoutSessions"),
        orderBy("endTime", "desc")
      );
      
      const querySnapshot = await getDocs(sessionsQuery);
      const sessionsData: WorkoutSession[] = [];
      
      querySnapshot.forEach((doc) => {
        sessionsData.push({
          id: doc.id,
          ...doc.data()
        } as WorkoutSession);
      });
      
      setWorkoutSessions(sessionsData);
    } catch (err) {
      console.error("Fehler beim Laden der Workout-Sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="mt-16 flex justify-center items-center">
          <LoadingSpinner message="Lade Statistiken..." />
        </div>
      </div>
    );
  }

  const totalWorkouts = workoutSessions.length;
  const totalExercises = workoutSessions.reduce((total, session) => total + session.exercises.length, 0);
  const bestScore = Math.max(...workoutSessions.map(s => s.totalWorkoutScore), 0);
  const avgScore = totalWorkouts > 0 ? workoutSessions.reduce((sum, session) => sum + session.totalWorkoutScore, 0) / totalWorkouts : 0;

  return (
    <div className="min-h-screen bg-gray-50 overflow-hidden">
      <Header />

      <main className="mt-30 px-4 max-w-7xl mx-auto pb-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🏆 Trainingsstatistiken</h1>
          <p className="text-gray-600">Analysiere deine Fortschritte und vergleiche deine Leistungen</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition-shadow">
            <div className="text-3xl font-bold text-blue-600">{totalWorkouts}</div>
            <div className="text-sm text-gray-600 mt-1">Workouts</div>
            <div className="text-xs text-blue-400 mt-1">Gesamt</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition-shadow">
            <div className="text-3xl font-bold text-green-600">{totalExercises}</div>
            <div className="text-sm text-gray-600 mt-1">Übungen</div>
            <div className="text-xs text-green-400 mt-1">Absolviert</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition-shadow">
            <div className="text-3xl font-bold text-purple-600">{bestScore.toFixed(0)}</div>
            <div className="text-sm text-gray-600 mt-1">Bester Score</div>
            <div className="text-xs text-purple-400 mt-1">Rekord</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition-shadow">
            <div className="text-3xl font-bold text-orange-600">{avgScore.toFixed(0)}</div>
            <div className="text-sm text-gray-600 mt-1">Ø Score</div>
            <div className="text-xs text-orange-400 mt-1">Pro Workout</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex overflow-x-auto border-b border-gray-200">
            {[
              { id: 'progress', label: 'Fortschritt' },
              { id: 'exerciseProgress', label: 'Übungsentwicklung' },
              { id: 'comparison', label: 'Übungsvergleich' },
              { id: 'history', label: 'Workout History' },
              { id: 'records', label: 'Personal Records' },
              { id: 'monthly', label: 'Monatlicher Fortschritt'},
              { id: 'distribution', label: 'Score Verteilung' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-6 px-6 py-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'progress' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-800">Score Fortschritt</h3>
                  <TimeRangeSelector value={selectedTimeRange} onChange={setSelectedTimeRange} />
                </div>
                <ScoreProgressChart 
                  workoutSessions={workoutSessions} 
                  timeRange={selectedTimeRange}
                />
              </div>
            )}
            {activeTab === 'comparison' && (
              <ExerciseComparison workoutSessions={workoutSessions} />
            )}
            {activeTab === 'history' && (
              <WorkoutHistory workoutSessions={workoutSessions} />
            )}
            {activeTab === 'records' && (
              <PersonalRecords workoutSessions={workoutSessions} />
            )}
            {activeTab === 'monthly' && (
              <MonthlyProgress workoutSessions={workoutSessions} />
            )}
            {activeTab === 'distribution' && (
              <ScoreDistribution workoutSessions={workoutSessions} />
            )}
            {activeTab === 'exerciseProgress' && (
            <ExerciseProgressChart workoutSessions={workoutSessions} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// Time Range Selector Component
function TimeRangeSelector({ value, onChange }: { value: string; onChange: (value: 'week' | 'month' | 'all') => void }) {
  return (
    <div className="flex bg-gray-100 rounded-lg p-1">
      {[
        { value: 'week', label: '1 Woche' },
        { value: 'month', label: '1 Monat' },
        { value: 'all', label: 'Alle Zeit' },
      ].map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value as any)}
          className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
            value === option.value
              ? 'bg-white text-gray-800 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}