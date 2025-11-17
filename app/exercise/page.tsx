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
    multiplier: number;
    userId: string;
    collection: "private" | "public";
    factorInput?: string;
    multiplierInput?: string;
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
  const [multiplier, setMultiplier] = useState(1);
  const [multiplierInput, setMultiplierInput] = useState("1");


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
        snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            ...data,
            multiplier: data.multiplier ?? 1, // Default-Wert
            collection: view,
          };
        })
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
              multiplier: ex.multiplier
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
      multiplier: ex.multiplier,
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
      multiplier: ex.multiplier,
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
  <div className="bg-white shadow-md rounded-xl p-6 mb-6 border border-gray-200">
    <h2 className="text-lg font-semibold mb-4 text-gray-700">
      Übung {editMode ? "bearbeiten" : "hinzufügen"}
    </h2>

    {/* Name */}
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-600 mb-1">
        Name der Übung
      </label>
      <input
        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
        placeholder="z.B. Bankdrücken"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
    </div>

    {/* Faktor */}
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-600 mb-1">
        Faktor
      </label>
      <input
        type="text"
        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
        placeholder="Faktor eingeben"
        value={factorInput}
        onChange={(e) => {
          if (/^\d*\.?\d*$/.test(e.target.value)) {
            setFactorInput(e.target.value);
            setFactor(e.target.value === "" ? 0 : parseFloat(e.target.value));
          }
        }}
      />
    </div>

    {/* Multiplier */}
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-600 mb-1">
        Multiplikator (Multiplier)
      </label>
      <input
        type="text"
        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
        placeholder="Multiplier eingeben"
        value={multiplierInput}
        onChange={(e) => {
          if (/^\d*\.?\d*$/.test(e.target.value)) {
            setMultiplierInput(e.target.value);
            setMultiplier(
              e.target.value === "" ? 0 : parseFloat(e.target.value)
            );
          }
        }}
      />
    </div>

    <button
      onClick={addExercise}
      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg transition"
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
                    <div className="flex flex-col gap-3 mt-3">

                        {/* NAME */}
                        <div className="flex flex-col">
                        <label className="text-sm text-gray-600 mb-1">Name</label>
                        <input
                            className="border border-gray-300 rounded-lg p-2 w-full"
                            value={ex.name}
                            onChange={(e) => {
                            const updated = [...exercises];
                            const idx = updated.findIndex((i) => i.id === ex.id);
                            updated[idx].name = e.target.value;
                            setExercises(updated);
                            }}
                        />
                        </div>

                        {/* FAKTOR */}
                        <div className="flex flex-col">
                        <label className="text-sm text-gray-600 mb-1">Faktor</label>
                        <input
                            type="text"
                            className="border border-gray-300 rounded-lg p-2 w-full"
                            value={ex.factorInput ?? ex.factor?.toString() ?? ""}
                            onChange={(e) => {
                            const val = e.target.value;

                            if (/^\d*\.?\d*$/.test(val)) {
                                const updated = [...exercises];
                                const idx = updated.findIndex((i) => i.id === ex.id);

                                updated[idx].factorInput = val;
                                updated[idx].factor =
                                val === "" || val === "." ? 0 : parseFloat(val);

                                setExercises(updated);
                            }
                            }}
                        />
                        </div>

                        {/* MULTIPLIER */}
                        <div className="flex flex-col">
                        <label className="text-sm text-gray-600 mb-1">Multiplier</label>
                        <input
                            type="text"
                            className="border border-gray-300 rounded-lg p-2 w-full"
                            value={ex.multiplierInput ?? ex.multiplier?.toString() ?? ""}
                            onChange={(e) => {
                            const val = e.target.value;

                            if (/^\d*\.?\d*$/.test(val)) {
                                const updated = [...exercises];
                                const idx = updated.findIndex((i) => i.id === ex.id);

                                updated[idx].multiplierInput = val;
                                updated[idx].multiplier =
                                val === "" || val === "." ? 0 : parseFloat(val);

                                setExercises(updated);
                            }
                            }}
                        />
                        </div>

                    </div>
                    ) : (
                    <>
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">
                        {ex.name}
                      </h3>
                      <p className="text-gray-700">Faktor: {ex.factor}</p>
                      <p className="text-gray-700">Multiplier: {ex.multiplier}</p>

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
