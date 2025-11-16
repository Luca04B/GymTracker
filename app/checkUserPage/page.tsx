"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDocFromServer } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Header from "@/components/header";

export default function CheckUserPage() {
  const router = useRouter();

  useEffect(() => {
    // alles in async-Funktion
    const checkUserProfile = async (user: any) => {
      if (!user) {
        console.log("Kein User -> Weiterleitung zu /login");
        router.push("/login");
        return;
      }

      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDocFromServer(ref);
        console.log("Snapshot existiert:", snap.exists());
        console.log("Snapshot Daten:", snap.data());

        if (snap.exists()) {
          router.push("/userInterface");
        } else {
          router.push("/createProfile");
        }
      } catch (err) {
        console.error("Fehler beim Laden des Profils:", err);
      }
    };

    // Firebase Auth Listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      checkUserProfile(user);
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="flex flex-col items-center justify-center mt-20">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
          <p className="text-gray-600 text-lg mt-6">Profil wird geladen...</p>
        </div>
      </main>
    </div>
  );
}
