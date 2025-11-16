"use client";

import React, { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface MeasurementFormProps {
  onNewMeasurement: (data: any) => void;
}

export default function MeasurementForm({ onNewMeasurement }: MeasurementFormProps) {
  const [weight, setWeight] = useState("");

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const docRef = await addDoc(collection(db, "measurements"), {
        userId: user.uid,
        weight: Number(weight),
        createdAt: serverTimestamp(),
      });

      onNewMeasurement({
        id: docRef.id,
        weight: Number(weight),
        createdAt: new Date(), // provisorisch, wird Firestore timestamp später überschreiben
      });

      setWeight("");
    } catch (err) {
      console.error("Fehler beim Speichern:", err);
      alert("Fehler beim Speichern. Prüfe Firestore Regeln.");
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 space-y-4">
      <h2 className="text-xl font-semibold text-gray-700">Neue Messung</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-gray-600 mb-1">Gewicht (kg)</label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 text-gray-400 rounded-lg focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>
      <button
        onClick={handleSave}
        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
      >
        Speichern
      </button>
    </div>
  );
}
