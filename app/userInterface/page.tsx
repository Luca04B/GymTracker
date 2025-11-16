"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs, doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Header from "@/components/header";
import UserProfileCard from "@/components/userProfileCard";
import MeasurementForm from "@/components/measurementForm";
import WeightChart from "@/components/weightChart";
import LoadingSpinner from "@/components/loadingSpinner";

export default function UserInterfacePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const latestMeasurement = measurements[measurements.length - 1] || null;


  useEffect(() => {
    const load = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.push("/login");
        return;
      }

      // Profil
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) setProfile(userSnap.data());

      // Messungen
      const mQuery = query(
        collection(db, "measurements"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "asc")
      );
      const mSnap = await getDocs(mQuery);
      const mData = mSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMeasurements(mData);


      setLoading(false);
    };

    load();
  }, [router]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <Header />
      <main className="max-w-2xl mx-auto mt-10 px-4 space-y-8">
        {profile && (
          <UserProfileCard
            name={profile.name}
            age={profile.age}
            height={profile.height}
            weight={latestMeasurement.weight}
          />
        )}

        <MeasurementForm onNewMeasurement={(newM) => setMeasurements((prev) => [...prev, newM])} />

        {measurements.length > 0 && <WeightChart measurements={measurements} />}
      </main>
    </div>
  );
}
