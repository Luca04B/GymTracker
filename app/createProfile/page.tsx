"use client";

import { auth, db } from "@/lib/firebase";
import { doc, setDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Header from "@/components/header";

export default function CreateProfilePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");

  const saveProfileAndMeasurement = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // 1️⃣ User-Dokument (nur Name, einmalig)
      await setDoc(doc(db, "users", user.uid), { name: name, height: Number(height),
        age: Number(age) });

      // 2️⃣ Measurement-Dokument (immer neu)
      await addDoc(collection(db, "measurements"), {
        userId: user.uid,   // wichtig für die Rules
        weight: Number(weight),
        createdAt: serverTimestamp(),
      });

      router.push("/userInterface");
    } catch (err) {
      console.error("Fehler beim Speichern:", err);
      alert("Fehler beim Speichern der Daten. Bitte prüfe die Eingaben oder Firestore Rules.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="flex flex-col items-center justify-center mt-18 px-4 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">
          Profil anlegen
        </h1>

        <div className="flex flex-col space-y-4 w-full max-w-sm">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="number"
            placeholder="Gewicht (kg)"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="number"
            placeholder="Größe (cm)"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="number"
            placeholder="Alter"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={saveProfileAndMeasurement}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Speichern
          </button>
        </div>
      </main>
    </div>
  );
}
