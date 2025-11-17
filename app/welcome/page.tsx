"use client";

import Header from "@/components/header";
import Link from "next/link";
import UserProfileCard from "@/components/userProfileCard";
import WeightChart from "@/components/weightChart";
import MyExerciseList from "@/components/myExerciseList";
import { auth, db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { doc, getDoc, collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/loadingSpinner";

interface Exercise {
  id: string;
  name: string;
  factor: number;
}

export default function WelcomePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setLoadingProfile(false);
        setLoadingExercises(false);
        return;
      }

      // Profil laden
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) setProfile(userSnap.data());
      } catch (err) {
        console.error("Fehler beim Laden des Profils:", err);
      } finally {
        setLoadingProfile(false);
      }

      // Messungen laden
      try {
        const mQuery = query(
          collection(db, "measurements"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "asc")
        );
        const mSnap = await getDocs(mQuery);
        const mData = mSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setMeasurements(mData);
      } catch (err) {
        console.error("Fehler beim Laden der Messungen:", err);
      }

      // Übungen laden
      setLoadingExercises(true);
      try {
        const exSnap = await getDocs(collection(db, "users", user.uid, "exercises"));
        const exData = exSnap.docs.map((d) => ({
          id: d.id,
          name: d.data().name,
          factor: d.data().factor,
        }));
        setExercises(exData);
      } catch (err) {
        console.error("Fehler beim Laden der Übungen:", err);
      } finally {
        setLoadingExercises(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const goToUserInterface = () => router.push("/userInterface");

  const goToExcersice = () => router.push("/exercise");

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden pb-10">
      <Header />

      <main className="mt-20 px-4 sm:px-6 lg:px-12 space-y-10">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Willkommen bei GymTracker!</h2>
          <p className="text-gray-700 mt-2 max-w-md sm:max-w-lg mx-auto text-sm sm:text-base">
            Hier kannst du deine Trainingspläne anlegen, Workouts tracken und Statistiken deiner Übungen sehen.
          </p>
        </div>

        <div className="flex flex-col-reverse lg:flex-row gap-6 lg:gap-8">
          {/* Linke Seite: Diagramm */}
          <div className="flex-1 bg-white shadow-md rounded-lg p-4 sm:p-6 hover:shadow-xl transition-shadow duration-300 max-w-full">
            {measurements.length > 0 ? (
              <WeightChart measurements={measurements} />
            ) : (
              <p className="text-gray-500 text-center">Noch keine Messungen vorhanden.</p>
            )}
          </div>

          {/* Rechte Seite: Identity Card */}
          {loadingProfile ? (
            <div className="w-full lg:w-80 flex justify-center items-center">
              <LoadingSpinner />
            </div>
          ) : profile ? (
            <div className="w-full lg:w-80 max-w-full flex justify-center lg:justify-end">
              <div
                className="bg-white shadow-md rounded-lg p-4 sm:p-6 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 cursor-pointer max-w-xs sm:max-w-full"
                onClick={goToUserInterface}
              >
                <UserProfileCard
                  name={profile.name}
                  age={profile.age}
                  height={profile.height}
                  weight={measurements.length ? measurements[measurements.length - 1].weight : profile.weight}
                />
              </div>
            </div>
          ) : null}
        </div>

        {/* Übungen Liste */}
        <div 
         onClick={goToExcersice} 
         className="bg-white shadow-md rounded-lg p-4 sm:p-6 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 cursor-pointer max-w-xs sm:max-w-full"
          >
          {loadingExercises ? (
            <div className="flex justify-center"><LoadingSpinner /></div>
          ) : exercises.length === 0 ? (
            <p className="text-gray-500">Keine Übungen gefunden.</p>
          ) : (
            <MyExerciseList exercises={exercises} />
          )}
        </div>

        {/* Login/Register Buttons für nicht eingeloggte Nutzer */}
        {!profile && !loadingProfile && (
          <div className="flex flex-col sm:flex-row justify-center mt-10 gap-4 sm:gap-4">
            <Link
              href="/login"
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-center"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors text-center"
            >
              Registrieren
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
