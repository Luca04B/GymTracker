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
import { motion, AnimatePresence } from "framer-motion";

interface Exercise {
  id: string;
  name: string;
  factor: number;
  userId: string;
  collection: "private" | "public";
   factorInput?: string; 
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
  const [user, setUser] = useState<any>(null);

  const [factorInput, setFactorInput] = useState("1"); // für das Input-Feld


  // -------------------------
  // AUTH LISTENER
  // -------------------------
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u ?? null);
    });
    return () => unsub();
  }, []);

  // -------------------------
  // EXERCISES LADEN
  // -------------------------
  const loadExercises = async () => {
    if (!user) return;

    try {
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
  };

  useEffect(() => {
    if (!user) return;
    loadExercises();
  }, [user, view]);

  // -------------------------
  // ÜBUNG HINZUFÜGEN
  // -------------------------
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

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <Header />

      {/* Toast */}
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type as any}
              onClose={() => setToast(null)}
            />
          )}

      <main className="p-4 sm:p-6 lg:p-10 mt-20 max-w-5xl mx-auto text-gray-600">
        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
   {/* Buttons-Leiste */}
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">

  {/* Links: Neue Übung oder Platzhalter */}
  <div className="flex-shrink-0 flex justify-start">
    {view === "private" ? (
      <button
        onClick={() => setShowForm(!showForm)}
        className="bg-sky-600 text-white px-4 py-2 rounded-xl shadow-md hover:bg-sky-800 transition font-medium whitespace-nowrap w-full sm:w-auto"
      >
        Neue Übung
      </button>
    ) : (
      <div className="w-full sm:w-auto" />
    )}
  </div>

  {/* Mitte: Toggle */}
  <div className="flex justify-center gap-2">
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
      } whitespace-nowrap w-full sm:w-auto`}
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
      } whitespace-nowrap w-full sm:w-auto`}
    >
      Öffentliche Übungen
    </button>
  </div>

  {/* Rechts: Bearbeiten oder Platzhalter */}
  <div className="flex-shrink-0 flex justify-end">
    {view === "private" ? (
      <button
        onClick={() => {
          if (editMode) loadExercises();
          setEditMode(!editMode);
          setShowForm(false);
        }}
        className="bg-sky-600 text-white px-4 py-2 rounded-xl shadow-md hover:bg-sky-800 transition font-medium whitespace-nowrap w-full sm:w-auto"
      >
        {editMode ? "Bearbeiten beenden" : "Bearbeiten"}
      </button>
    ) : (
      <div className="w-full sm:w-auto" />
    )}
  </div>
</div>
          {showForm && (
            <div className="bg-white shadow-lg rounded-xl p-6 mb-6 border border-gray-200">
              <input
                className="w-full border border-gray-300 rounded-lg p-2 mb-3"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg p-2 mb-3"
                placeholder="Faktor"
                value={factorInput}
                onChange={(e) => {
                  // Nur Zahlen und ein optionaler Punkt erlaubt
                  if (/^\d*\.?\d*$/.test(e.target.value)) {
                    setFactorInput(e.target.value);
                    setFactor(e.target.value === "" ? 0 : parseFloat(e.target.value));
                  }
                }}
              />
              <button
                onClick={addExercise}
                className="w-full bg-emerald-400 hover:bg-emerald-600 text-white py-2 rounded-lg"
              >
                Speichern
              </button>
            </div>
          )}

          {/* Exercises Grid mit Slide/Fade Animation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {exercises.map((ex) => (
                <motion.div
                  key={ex.id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  layout
                  transition={{ duration: 0.3 }}
                  className="relative bg-white p-5 rounded-xl shadow-md border border-gray-200"
                >
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
                      {/* Name Input */}
                      <input
                        className="border border-gray-300 rounded-lg p-2 mb-2 w-full"
                        value={ex.name}
                        onChange={(e) => {
                          const updated = [...exercises];
                          const idx = updated.findIndex((i) => i.id === ex.id);
                          updated[idx].name = e.target.value;
                          setExercises(updated);
                        }}
                      />

                      {/* Faktor Input (Decimal-safe) */}
                     <input
                        type="text"
                        className="border border-gray-300 rounded-lg p-2 w-full"
                        value={ex.factorInput ?? ex.factor.toString()}
                        onChange={(e) => {
                          const val = e.target.value;
                          // nur Ziffern und maximal ein Punkt erlauben
                          if (/^\d*\.?\d*$/.test(val)) {
                            const updated = [...exercises];
                            const idx = updated.findIndex((i) => i.id === ex.id);
                            updated[idx].factorInput = val; // temporäre Eingabe als string speichern
                            updated[idx].factor = val === "" || val === "." ? 0 : parseFloat(val);
                            setExercises(updated);
                          }
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
                </motion.div>
              ))}
            </AnimatePresence>
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
            </div>  
      </main>
    </div>
  );
}
