// components/ComingSoon.tsx
"use client";

import Header from "@/components/header";

interface ComingSoonProps {
  title?: string;
  subtitle?: string;
}

export default function ComingSoon({
  title = "Kommt bald",
  subtitle = "Wir arbeiten noch an dieser Seite.",
}: ComingSoonProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="flex flex-col items-center justify-center mt-20 px-4 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">{title}</h2>
        <p className="text-gray-700 mb-6 max-w-md">{subtitle}</p>

        <div className="flex space-x-4">
          <a
            href="/welcome"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Zur Startseite
          </a>
          <a
            href="/contact"
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Kontakt
          </a>
        </div>
      </main>
    </div>
  );
}
