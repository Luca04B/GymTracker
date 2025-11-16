"use client";

import Header from "@/components/header";
import Link from "next/link";

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="flex flex-col items-center justify-center mt-20 px-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 text-center">
          Willkommen bei GymTracker!
        </h2>
        <p className="text-gray-700 text-center mb-6 max-w-md">
          Hier kannst du deine Trainingspläne anlegen, Workouts tracken und Statistiken deiner Übungen sehen.
        </p>

        <div className="flex space-x-4">
          <Link
            href="/login"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Registrieren
          </Link>
        </div>
      </main>
    </div>
  );
}
