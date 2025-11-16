"use client";

import React from "react";

interface UserProfileCardProps {
  name: string;
  age: number;
  height: number;
  weight: number;
}

export default function UserProfileCard({ name, age, height, weight }: UserProfileCardProps) {
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Willkommen zurück, {name} 👋</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-gray-700">
        <div className="p-2 bg-gray-50 rounded-lg text-center">
          <p className="text-sm text-gray-500">Alter</p>
          <p className="font-semibold">{age}</p>
        </div>
        <div className="p-2 bg-gray-50 rounded-lg text-center">
          <p className="text-sm text-gray-500">Größe (cm)</p>
          <p className="font-semibold">{height}</p>
        </div>
        <div className="p-2 bg-gray-50 rounded-lg text-center">
          <p className="text-sm text-gray-500">Gewicht (kg)</p>
          <p className="font-semibold">{weight}</p>
        </div>
      </div>
    </div>
  );
}
