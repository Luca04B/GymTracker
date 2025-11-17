"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import Header from "@/components/header";
import Toast from "@/components/toast";

interface Exercise {
  id: string;
  name: string;
  factor: number;
  userId: string;
  collection: "private" | "public";
}

export default function ExercisesPage() {
  const [view, setView] = useState<"private" | "public">("private");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [factor, setFactor] = useState(1);
  const [editMode, setEditMode] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type?: string } | null>(null);

  const user = auth.currentUser;

  const loadExercises = async () => {
    if (!user) return;

    if (view === "private") {
      const snap = await getDocs(collection(db, "users", user.uid, "exercises"));
      setExercises(
        snap.docs.map((d) => ({ id: d.id, ...d.data(), collection: "private" } as Exercise))
      );
    } else {
      const snap = await getDocs(collection(db, "globalExercises"));
      setExercises(
        snap.docs.map((d) => ({ id: d.id, ...d.data(), collection: "public" } as Exercise))
      );
    }
  };

  useEffect(() => {
    loadExercises();
  }, [view]);

  const addExercise = async () => {
    if (!user || !name.trim()) return;

    const exists = exercises.some((e) => e.name.toLowerCase() === name.trim().toLowerCase());
    if (exists) {
      setToast({ message: "Diese Übung existiert bereits!", type: "error" });
      return;
    }

    const collectionRef =
      view === "private"
        ? collection(db, "users", user.uid, "exercises")
        : collection(db, "globalExercises");

    await addDoc(collectionRef, {
      name: name.trim(),
      factor,
      userId: user.uid,
      createdAt: Date.now(),
    });

    setName("");
    setFactor(1);
    setShowForm(false);
    loadExercises();
    setToast({ message: "Übung hinzugefügt!", type: "success" });
  };

  // Save all edited exercises (nur privat)
  const saveAll = async () => {
    try {
      await Promise.all(
        exercises
          .filter((ex) => ex.collection === "private")
          .map(async (ex) => {
            await updateDoc(doc(db, "users", user!.uid, "exercises", ex.id), {
              name: ex.name,
              factor: ex.factor,
            });
          })
      );
      setEditMode(false);
      setToast({ message: "Alle Änderungen gespeichert!", type: "success" });
    } catch {
      setToast({ message: "Fehler beim Speichern", type: "error" });
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    const ex = exercises.find((e) => e.id === deleteId);
    if (!ex) return;

    try {
      if (ex.collection === "private") {
        await deleteDoc(doc(db, "users", user!.uid, "exercises", ex.id));
      } else {
        await deleteDoc(doc(db, "globalExercises", ex.id));
      }

      setDeleteId(null);
      loadExercises();
      setToast({ message: "Übung gelöscht!", type: "success" });
    } catch {
      setToast({ message: "Fehler beim Löschen", type: "error" });
    }
  };

  const makePrivate = async (ex: Exercise) => {
    if (!user) return;
    const privateSnap = await getDocs(collection(db, "users", user.uid, "exercises"));
    const exists = privateSnap.docs.some(
      (d) => d.data().name.toLowerCase() === ex.name.toLowerCase()
    );
    if (exists) {
      setToast({ message: "Diese Übung ist bereits privat vorhanden!", type: "error" });
      return;
    }

    await addDoc(collection(db, "users", user.uid, "exercises"), {
      name: ex.name,
      factor: ex.factor,
      userId: user.uid,
      createdAt: Date.now(),
    });
    setToast({ message: "Übung privat hinzugefügt!", type: "success" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="p-4 sm:p-6 lg:p-10 mt-20 max-w-5xl mx-auto text-gray-600">

        {/* Toggle */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => { setView("private"); setShowForm(false); setEditMode(false); }}
            className={`px-4 py-2 rounded-lg ${view === "private" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"}`}
          >
            Meine Übungen
          </button>
          <button
            onClick={() => { setView("public"); setShowForm(false); setEditMode(false); }}
            className={`px-4 py-2 rounded-lg ${view === "public" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"}`}
          >
            Öffentliche Übungen
          </button>
        </div>

        {/* Add Exercise (nur privat) */}
        {view === "private" && (
          <div className="flex justify-center mb-6">
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white px-5 py-3 rounded-xl shadow-md hover:bg-blue-700 transition font-medium"
            >
              Neue Übung
            </button>
          </div>
        )}

        {showForm && (
          <div className="bg-white shadow-lg rounded-xl p-6 mb-6 border border-gray-200">
            <input
              className="w-full border border-gray-300 rounded-lg p-2 mb-3"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="number"
              className="w-full border border-gray-300 rounded-lg p-2 mb-3"
              placeholder="Faktor"
              min={0.1}
              step={0.1}
              value={factor}
              onChange={(e) => setFactor(Number(e.target.value))}
            />
            <button
              onClick={addExercise}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
            >
              Speichern
            </button>
          </div>
        )}

        {/* Bulk Edit (nur privat) */}
        {view === "private" && (
          <div className="flex justify-end mb-4">
            <button
              onClick={() => { setEditMode(!editMode); setShowForm(false); }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              {editMode ? "Bearbeiten beenden" : "Bearbeiten"}
            </button>
          </div>
        )}

        {/* Exercises Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {exercises.map((ex, idx) => (
            <div key={ex.id} className="relative bg-white p-5 rounded-xl shadow-md border border-gray-200">

              {/* Delete Button */}
              <button
                onClick={() => setDeleteId(ex.id)}
                className="absolute top-3 right-3 text-red-500 hover:text-red-700 font-bold text-lg"
              >
                ×
              </button>

              {view === "private" && editMode ? (
                <>
                  <input
                    className="border border-gray-300 rounded-lg p-2 mb-2 w-full"
                    value={ex.name}
                    onChange={(e) => {
                      const newExercises = [...exercises];
                      newExercises[idx].name = e.target.value;
                      setExercises(newExercises);
                    }}
                  />
                  <input
                    type="number"
                    className="border border-gray-300 rounded-lg p-2 w-full"
                    min={0.1}
                    step={0.1}
                    value={ex.factor}
                    onChange={(e) => {
                      const newExercises = [...exercises];
                      newExercises[idx].factor = Number(e.target.value);
                      setExercises(newExercises);
                    }}
                  />
                </>
              ) : (
                <>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">{ex.name}</h3>
                  <p className="text-gray-700">Faktor: {ex.factor}</p>
                  {ex.collection === "public" && (
                    <button
                      onClick={() => makePrivate(ex)}
                      className="mt-2 mr-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Privat machen
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Save All Button */}
        {editMode && (
          <div className="flex justify-end mt-6">
            <button
              onClick={saveAll}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
            >
              Änderungen speichern
            </button>
          </div>
        )}

        {/* Delete Dialog */}
        {deleteId && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl text-center">
              <h2 className="text-xl font-semibold mb-4">Übung löschen?</h2>
              <p className="text-gray-700 mb-6">Willst du diese Übung wirklich löschen?</p>
              <div className="flex gap-4 justify-center">
                <button onClick={() => setDeleteId(null)} className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400">Abbrechen</button>
                <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Löschen</button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <Toast message={toast.message} type={toast.type as "success" | "error" | "info"} onClose={() => setToast(null)} />
        )}
      </main>
    </div>
  );
}
