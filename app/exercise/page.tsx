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
import LoadingSpinner from "@/components/loadingSpinner";

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
  const [toast, setToast] = useState<{ message: string; type?: string } | null>(
    null
  );

  // loading wird nur fürs main verwendet
  const [loadingMain, setLoadingMain] = useState(true);
  const [user, setUser] = useState<any>(null);

  // -----------------------------------------
  // AUTH LISTENER
  // -----------------------------------------
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      console.log("AuthStateChanged:", u?.uid);
      setUser(u ?? null);
    });
    return () => unsub();
  }, []);

  // -----------------------------------------
  // EXERCISES LADEN
  // -----------------------------------------
  const loadExercises = async () => {
    if (!user) return;

    setLoadingMain(true);

    try {
      console.log("loadExercises: view =", view, "user =", user.uid);

      let snap;

      if (view === "private") {
        snap = await getDocs(collection(db, "users", user.uid, "exercises"));
      } else {
        snap = await getDocs(collection(db, "globalExercises"));
      }

      setExercises(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
          collection: view,
        }))
      );
    } catch (err) {
      console.error("Fehler beim Laden der Übungen:", err);
      setExercises([]);
    }

    setLoadingMain(false);
  };

  // Laden, wenn user oder view sich ändert
  useEffect(() => {
    if (!user) return;
    loadExercises();
  }, [user, view]);

  // -----------------------------------------
  // ÜBUNG HINZUFÜGEN
  // -----------------------------------------
  const addExercise = async () => {
    if (!user || !name.trim()) return;

    const exists = exercises.some(
      (e) => e.name.toLowerCase() === name.trim().toLowerCase()
    );
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

  // -----------------------------------------
  // ALLE SPEICHERN (nur privat)
  // -----------------------------------------
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

  // -----------------------------------------
  // ÜBUNG LÖSCHEN
  // -----------------------------------------
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

  // -----------------------------------------
  // PUBLIC → PRIVATE
  // -----------------------------------------
  const makePrivate = async (ex: Exercise) => {
    if (!user) return;

    const privateSnap = await getDocs(
      collection(db, "users", user.uid, "exercises")
    );
    const exists = privateSnap.docs.some(
      (d) => d.data().name.toLowerCase() === ex.name.toLowerCase()
    );
    if (exists) {
      setToast({
        message: "Diese Übung ist bereits privat vorhanden!",
        type: "error",
      });
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

  // -----------------------------------------
  // PRIVATE → PUBLIC
  // -----------------------------------------
  const publishExercise = async (ex: Exercise) => {
    if (!user) return;

    const globalSnap = await getDocs(collection(db, "globalExercises"));
    const exists = globalSnap.docs.some(
      (d) => d.data().name.toLowerCase() === ex.name.toLowerCase()
    );

    if (exists) {
      setToast({
        message: "Diese Übung ist bereits öffentlich!",
        type: "error",
      });
      return;
    }

    await addDoc(collection(db, "globalExercises"), {
      name: ex.name,
      factor: ex.factor,
      createdBy: user.uid,
      createdAt: Date.now(),
    });

    setToast({ message: "Übung veröffentlicht!", type: "success" });
  };

  // -----------------------------------------
  // UI
  // -----------------------------------------

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <Header />

      <main className="p-4 sm:p-6 lg:p-10 mt-20 max-w-5xl mx-auto text-gray-600">
        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">

          {/* MAIN LOADING */}
          {loadingMain ? (
            <div className="flex justify-center mt-20">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              {/* Toggle */}
              <div className="flex justify-center gap-4 mb-6">
                <button
                  onClick={() => {
                    setView("private");
                    setShowForm(false);
                    setEditMode(false);
                  }}
                  className={`px-4 py-2 rounded-lg ${
                    view === "private"
                      ? "bg-sky-600 text-white font-semibold"
                      : "bg-slate-300 text-gray-800"
                  }`}
                >
                  Meine Übungen
                </button>
                <button
                  onClick={() => {
                    setView("public");
                    setShowForm(false);
                    setEditMode(false);
                  }}
                  className={`px-4 py-2 rounded-lg ${
                    view === "public"
                      ? "bg-sky-600 text-white font-semibold"
                      : "bg-slate-300 text-gray-800"
                  }`}
                >
                  Öffentliche Übungen
                </button>
              </div>

              {/* Neue Übung */}
              {view === "private" && (
                <div className="flex justify-center mb-6">
                  <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-sky-600 text-white px-5 py-3 rounded-xl shadow-md hover:bg-sky-800 transition font-medium"
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
                    className="w-full bg-emerald-400 hover:bg-emerald-600 text-white py-2 rounded-lg"
                  >
                    Speichern
                  </button>
                </div>
              )}

              {/* Edit Mode */}
            {view === "private" && (
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => {
                      if (editMode) {
                        // Bearbeiten beenden ohne speichern → reload
                        loadExercises();
                      }
                      setEditMode(!editMode);
                      setShowForm(false);
                    }}
                    className="bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-800"
                  >
                    {editMode ? "Bearbeiten beenden" : "Bearbeiten"}
                  </button>
                </div>
              )}

              {/* Exercises Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {exercises.map((ex, idx) => (
                  <div
                    key={ex.id}
                    className="relative bg-white p-5 rounded-xl shadow-md border border-gray-200"
                  >
                    {/* Delete */}
                    {!editMode && (
                      <button
                        onClick={() => setDeleteId(ex.id)}
                        className="absolute top-3 right-3 text-red-500 hover:text-red-700 font-bold text-lg"
                      >
                        ×
                      </button>
                    )}

                    {view === "private" && editMode ? (
                      <>
                        <input
                          className="border border-gray-300 rounded-lg p-2 mb-2 w-full"
                          value={ex.name}
                          onChange={(e) => {
                            const updated = [...exercises];
                            updated[idx].name = e.target.value;
                            setExercises(updated);
                          }}
                        />
                        <input
                          type="number"
                          min={0.1}
                          step={0.1}
                          className="border border-gray-300 rounded-lg p-2 w-full"
                          value={ex.factor}
                          onChange={(e) => {
                            const updated = [...exercises];
                            updated[idx].factor = Number(e.target.value);
                            setExercises(updated);
                          }}
                        />
                      </>
                    ) : (
                      <>
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">
                          {ex.name}
                        </h3>
                        <p className="text-gray-700">Faktor: {ex.factor}</p>

                        {ex.collection === "public" && (
                          <button
                            onClick={() => makePrivate(ex)}
                            className="mt-2 mr-2 px-3 py-1 text-sm bg-emerald-400 text-white rounded-lg hover:bg-emerald-600"
                          >
                            Privat machen
                          </button>
                        )}
                      </>
                    )}

                    {view === "private" && !editMode && (
                      <button
                        onClick={() => publishExercise(ex)}
                        className="mt-3 px-3 py-1 text-sm bg-emerald-400 text-white rounded-lg hover:bg-emerald-600"
                      >
                        Veröffentlichen
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Save Button */}
              {editMode && (
                <div className="flex justify-end mt-6">
                  <button
                    onClick={saveAll}
                    className="bg-emerald-400 text-white px-6 py-3 rounded-lg hover:bg-emerald-600"
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
                    <p className="text-gray-700 mb-6">
                      Willst du diese Übung wirklich löschen?
                    </p>
                    <div className="flex gap-4 justify-center">
                      <button
                        onClick={() => setDeleteId(null)}
                        className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
                      >
                        Abbrechen
                      </button>
                      <button
                        onClick={confirmDelete}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Löschen
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Toast */}
              {toast && (
                <Toast
                  message={toast.message}
                  type={toast.type as any}
                  onClose={() => setToast(null)}
                />
              )}
            </>
          )}
          </div>
      </main>
    </div>
  );
}
