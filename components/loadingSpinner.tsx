"use client";

import React from "react";

export default function LoadingSpinner({ message = "Lade Daten..." }: { message?: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
      <p className="text-gray-600 text-lg mt-6">{message}</p>
    </div>
  );
}
