"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs, doc, getDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Header from "@/components/header";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function UserInterfacePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [editWeight, setEditWeight] = useState("");
  const [editHeight, setEditHeight] = useState("");
  const [editAge, setEditAge] = useState("");

  useEffect(() => {
    const load = async () => {
      const user = auth.currentUser;

      if (!user) {
        router.push("/login");
        return;
      }

      // --- USER PROFIL LADEN ---
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) setProfile(userSnap.data());

      // --- ALLE MEASUREMENTS LADEN ---
      const mQuery = query(
        collection(db, "measurements"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "asc")
      );
      const mSnap = await getDocs(mQuery);
      const mData = mSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMeasurements(mData);

      // Letzte Messung in Edit-Felder setzen
      if (mData.length) {
        const last = mData[mData.length - 1];
        setEditWeight(last.weight);
        setEditHeight(last.height);
        setEditAge(last.age);
      }

      setLoading(false);
    };

    load();
  }, [router]);

  // 🔹 Immer neue Messung speichern
  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const newDoc = await addDoc(collection(db, "measurements"), {
        userId: user.uid,
        weight: Number(editWeight),
        height: Number(editHeight),
        age: Number(editAge),
        createdAt: serverTimestamp(),
      });

      // State sofort aktualisieren, damit Diagramm direkt aktualisiert wird
      setMeasurements((prev) => [
        ...prev,
        {
          id: newDoc.id,
          userId: user.uid,
          weight: Number(editWeight),
          height: Number(editHeight),
          age: Number(editAge),
          createdAt: new Date(), // vorläufig, Firestore timestamp wird später geladen
        },
      ]);
    } catch (err) {
      console.error("Fehler beim Speichern des Measurements:", err);
      alert("Fehler beim Speichern. Prüfe Firestore Regeln.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="flex flex-col items-center justify-center mt-20">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
          <p className="text-gray-600 text-lg mt-6">Lade Daten...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-2xl mx-auto mt-10 px-4 space-y-8">
        {/* Profil */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Willkommen zurück, {profile?.name ?? "User"} 👋
          </h1>
        </div>

        {/* Messungen eingeben */}
        <div className="bg-white shadow-md rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-700">Neue Messung</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-600 mb-1">Gewicht (kg)</label>
              <input
                type="number"
                value={editWeight}
                onChange={(e) => setEditWeight(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 text-gray-400 rounded-lg focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-1">Größe (cm)</label>
              <input
                type="number"
                value={editHeight}
                onChange={(e) => setEditHeight(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 text-gray-400 rounded-lg focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-1">Alter</label>
              <input
                type="number"
                value={editAge}
                onChange={(e) => setEditAge(e.target.value)}
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

        {/* Diagramm */}
        {measurements.length > 0 && (
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Gewichtsverlauf</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={measurements}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="createdAt"
                  tickFormatter={(ts) =>
                    ts?.toDate ? ts.toDate().toLocaleDateString() : new Date(ts).toLocaleDateString()
                  }
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(ts) =>
                    ts?.toDate ? ts.toDate().toLocaleString() : new Date(ts).toLocaleString()
                  }
                />
                <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </main>
    </div>
  );
}
