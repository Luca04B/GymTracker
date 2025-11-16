"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs, doc, getDoc, addDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Header from "@/components/header";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface Measurement {
  id: string;
  userId: string;
  weight: number;
  createdAt?: any;
}

export default function UserInterfacePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [editWeight, setEditWeight] = useState("");

  const loadData = async () => {
    const user = auth.currentUser;
    if (!user) {
      router.push("/login");
      return;
    }

    // --- USER PROFIL LADEN ---
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      setProfile(userSnap.data());
    }

    // --- ALLE MEASUREMENTS LADEN ---
    const mQuery = query(
      collection(db, "measurements"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "asc")
    );
    const mSnap = await getDocs(mQuery);
    const mData: Measurement[] = mSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Measurement));
    setMeasurements(mData);

    // Letzte Gewichtsmessung in Edit-Feld setzen
    if (mData.length) {
      const last = mData[mData.length - 1];
      setEditWeight(last.weight.toString());
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [router]);

  // 🔹 Neue Gewichtsmessung speichern
  const handleSaveWeight = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const newMeasurement = {
        userId: user.uid,
        weight: Number(editWeight),
        createdAt: serverTimestamp(),
      };

      const newDocRef = await addDoc(collection(db, "measurements"), newMeasurement);

      // State sofort aktualisieren
      setMeasurements((prev) => [
        ...prev,
        { id: newDocRef.id, ...newMeasurement, createdAt: new Date() },
      ]);
      setEditWeight(newMeasurement.weight.toString());
    } catch (err) {
      console.error("Fehler beim Speichern des Gewichts:", err);
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
    <div className="min-h-screen bg-gray-50 pb-10">
      <Header />
      <main className="max-w-2xl mx-auto mt-10 px-4 space-y-8">

        {/* User-Karte */}
        {profile && (
          <div className="bg-white shadow-md rounded-lg p-6 space-y-2 text-gray-400 ">
            <h2 className="text-xl font-semibold text-gray-700">Profil</h2>
            <p><strong className="text-gray-600">Name:</strong> {profile.name}</p>
            <p><strong className="text-gray-600">Alter:</strong> {profile.age} Jahre</p>
            <p><strong className="text-gray-600">Größe:</strong> {profile.height} cm</p>
          </div>
        )}

        {/* Neue Gewichtsmessung */}
        <div className="bg-white shadow-md rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-700">Neue Gewichtsmessung</h2>
          <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
            <div>
              <label className="block text-gray-600 mb-1">Gewicht (kg)</label>
              <input
                type="number"
                value={editWeight}
                onChange={(e) => setEditWeight(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 text-gray-400 rounded-lg focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
          <button
            onClick={handleSaveWeight}
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
              <LineChart
                data={measurements.map((m) => ({
                  ...m,
                  createdAt: m.createdAt?.toDate ? m.createdAt.toDate() : m.createdAt,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="createdAt"
                  tickFormatter={(ts) => ts instanceof Date ? ts.toLocaleDateString() : ""}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(ts) => ts instanceof Date ? ts.toLocaleString() : ""}
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
