"use client";

import { useState, useEffect } from "react";
import Header from "@/components/header";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs, addDoc, setDoc, doc } from "firebase/firestore";
import LoadingSpinner from "@/components/loadingSpinner";
import TrainingPlanList from "@/components/trainingPlanList";
import Toast from "@/components/toast";

interface Exercise {
  id: string;
  name: string;
  factor: number;
}

interface PlanItem {
  exerciseId: string;
  name: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  weight: number;
}

interface TrainingPlan {
  id: string;
  name: string;
  items: PlanItem[];
  createdAt: any;
}

export default function TrainingPlanPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedExercise, setSelectedExercise] = useState("");
  const [sets, setSets] = useState<number>(3);
  const [repsMin, setRepsMin] = useState<number>(6);
  const [repsMax, setRepsMax] = useState<number>(8);
  const [weight, setWeight] = useState<number>(0);
  const [planName, setPlanName] = useState<string>("");
  const [weightInput, setWeightInput] = useState<string>("0");

  const [currentPlanName, setCurrentPlanName] = useState<string>("");
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<PlanItem[]>([]);

  const [allPlans, setAllPlans] = useState<TrainingPlan[]>([]);

  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">("info");
  const [showToast, setShowToast] = useState(false);


  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged(async (user) => {
    if (!user) {
      setExercises([]);
      setAllPlans([]); // Leere Liste, wenn kein User
      setLoading(false);
      return;
    }

    try {
      // Übungen laden
      const exerciseSnap = await getDocs(collection(db, "users", user.uid, "exercises"));
      const exercisesList = exerciseSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Exercise[];
      setExercises(exercisesList);

      // Trainingspläne laden
      const planSnap = await getDocs(collection(db, "users", user.uid, "trainingPlans"));
      const plansList = planSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as TrainingPlan[];
      setAllPlans(plansList);
    } catch (error) {
        showToastMessage("Fehler beim Laden von Übungen oder Trainingsplänen.", "error");
    } finally {
      setLoading(false);
    }
  });

  return () => unsubscribe();
}, []);


  const addExerciseToPlan = () => {
    if (!selectedExercise) {
        showToastMessage("Bitte Übung auswählen!", "error");
        return;
    }

    const ex = exercises.find((x) => x.id === selectedExercise);
    if (!ex) return;

    const newItem: PlanItem = {
      exerciseId: ex.id,
      name: ex.name,
      sets,
      repsMin,
      repsMax,
      weight,
    };

    if (editingIndex !== null) {
      const updatedPlan = [...currentPlan];
      updatedPlan[editingIndex] = newItem;
      setCurrentPlan(updatedPlan);
      setEditingIndex(null);
    } else {
      setCurrentPlan((prev) => [...prev, newItem]);
    }

    resetInputs();
  };

  const resetInputs = () => {
    setSelectedExercise("");
    setSets(3);
    setRepsMin(6);
    setRepsMax(8);
    setWeight(0);
    setWeightInput("0");
    setEditingIndex(null);
  };

  const startEditing = (index: number) => {
    const item = currentPlan[index];
    setEditingIndex(index);
    setSelectedExercise(item.exerciseId);
    setSets(item.sets);
    setRepsMin(item.repsMin);
    setRepsMax(item.repsMax);
    setWeight(item.weight);
    setWeightInput(item.weight.toString());
  };

  const removeExercise = (index: number) => {
    setCurrentPlan((prev) => prev.filter((_, i) => i !== index));
    resetInputs();
  };

 const saveTrainingPlan = async () => {
  const user = auth.currentUser;
  if (!user) return;

  if (currentPlan.length === 0) {
        showToastMessage("Bitte mindestens eine Übung hinzufügen!", "error");
        return;
  }

  // Planname auswählen: neuer Plan → planName, bestehender → currentPlanName
  const titleToSave = currentPlanId ? currentPlanName : planName;

  if (!titleToSave || titleToSave.trim() === "") {
    showToastMessage("Planname fehlt!", "error");
        return;
  }

  if (currentPlanId) {
    // Bestehenden Plan updaten
    await setDoc(doc(db, "users", user.uid, "trainingPlans", currentPlanId), {
      name: titleToSave,
      items: currentPlan,
      createdAt: new Date(),
    });

    // Lokale Liste updaten
    setAllPlans((prev) =>
      prev.map((p) =>
        p.id === currentPlanId ? { ...p, name: titleToSave, items: currentPlan } : p
      )
    );
  } else {
    // Neuen Plan erstellen
    // Zuerst prüfen, ob es schon einen Plan mit dem Namen gibt
    const existing = allPlans.find((p) => p.name === titleToSave);
    if (existing) {
        showToastMessage("Ein Plan mit diesem Namen existiert bereits!", "error");
        return;}

    const docRef = await addDoc(collection(db, "users", user.uid, "trainingPlans"), {
      name: titleToSave,
      items: currentPlan,
      createdAt: new Date(),
    });

    setAllPlans((prev) => [...prev, { id: docRef.id, name: titleToSave, items: currentPlan, createdAt: new Date() }]);
  }

  showToastMessage("Trainingsplan gespeichert!", "success");
  setCurrentPlan([]);
  setPlanName("");         // reset für neuen Plan
  setCurrentPlanName("");   // reset für bestehender Plan
  setCurrentPlanId(null);
};

const showToastMessage = (message: string, type: "success" | "error" | "info" = "info") => {
  setToastMessage(message);
  setToastType(type);
  setShowToast(true);
};


  if (loading) return <LoadingSpinner message="Lade Übungen..." />;

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-10">
        {loading ? (
    <div className="flex justify-center items-center h-64">
      <LoadingSpinner message="Lade Übungen..." />
    </div>
  ) : (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-300 mt-18">
          <h1 className="text-3xl font-semibold mb-6 text-gray-900">
            📋 Trainingsplan bearbeiten
          </h1>

          {/* Planname */}
          {currentPlanName && (
            <>
              <label className="block mb-2 font-semibold text-gray-800">Trainingsplan</label>
              <input
                type="text"
                className="w-full p-3 border rounded-lg mb-6 bg-gray-200 border-gray-400"
                value={currentPlanName}
                readOnly
              />
            </>
          )}

          {/* Name (nur für neue Pläne) */}
            {!currentPlanId && (
            <>
                <label className="block mb-2 font-semibold text-gray-800">Plan Name</label>
                <input
                type="text"
                className="w-full p-3 border rounded-lg mb-4 bg-gray-50 border-gray-400"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                />
            </>
            )}

          {/* Übungsauswahl */}
          <label className="block mb-2 font-semibold text-gray-800">Übung auswählen / hinzufügen</label>
          <select
            className="w-full p-3 border rounded-lg mb-4 bg-gray-50 border-gray-400"
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
          >
            <option value="">Bitte auswählen…</option>
            {exercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>

          {/* Sätze */}
          <label className="block mb-2 font-semibold text-gray-800">Sätze</label>
          <input
            type="text"
            className="w-full p-3 border rounded-lg mb-4 bg-gray-50 border-gray-400"
            value={sets}
            onChange={(e) => setSets(Number(e.target.value))}
          />

          {/* Gewicht */}
          <label className="block mb-2 font-semibold text-gray-800">Vorschlags Gewicht</label>
          <input
            type="text"
            className="w-full p-3 border rounded-lg mb-4 bg-gray-50 border-gray-400"
            value={weightInput}
            onChange={(e) => {
              const val = e.target.value;
              if (/^\d*\.?\d*$/.test(val)) {
                setWeightInput(val);
                setWeight(val === "" ? 0 : parseFloat(val));
              }
            }}
          />

          {/* Wiederholungen */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-2 font-semibold text-gray-800">Wdh. min</label>
              <input
                type="text"
                className="w-full p-3 border rounded-lg bg-gray-50 border-gray-400"
                value={repsMin}
                onChange={(e) => setRepsMin(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block mb-2 font-semibold text-gray-800">Wdh. max</label>
              <input
                type="text"
                className="w-full p-3 border rounded-lg bg-gray-50 border-gray-400"
                value={repsMax}
                onChange={(e) => setRepsMax(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Hinzufügen / Änderungen übernehmen */}
          <button
            onClick={addExerciseToPlan}
            className="w-full mt-2 bg-sky-500 hover:bg-sky-700 text-white py-3 rounded-lg font-bold shadow-md"
          >
            {editingIndex !== null ? "✅ Änderungen übernehmen" : "➕ Übung hinzufügen"}
          </button>

          {/* Aktueller Plan */}
          {currentPlan.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-4">Aktueller Plan</h2>
              <div className="space-y-3">
                {currentPlan.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-100 border border-gray-300 rounded-lg shadow-sm cursor-pointer"
                    onClick={() => startEditing(index)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-bold text-lg">{item.name}</div>
                        <div className="text-sm text-gray-700">
                          {item.sets} Sätze – {item.repsMin}-{item.repsMax} Wdh. a {item.weight} kg
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeExercise(index);
                        }}
                        className="text-red-500 font-bold ml-4"
                      >
                        ✖
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trainingsplan speichern */}
          <button
            onClick={saveTrainingPlan}
            className="w-full mt-8 bg-emerald-400 hover:bg-emerald-600 text-white py-3 rounded-lg font-bold shadow-md disabled:bg-gray-400"
            disabled={currentPlan.length === 0}
            >
            💾 Trainingsplan speichern
            </button>


          {/* Liste bestehender Trainingspläne */}
          <TrainingPlanList
            plans={allPlans}
            loading={loading} 
           onSelectPlan={(plan) => {
             if (currentPlanId === plan.id) {
                // Plan ist schon ausgewählt → alles clearen
                setCurrentPlan([]);
                setCurrentPlanName("");
                setCurrentPlanId(null);
                resetInputs();
            } else {
                // Neuer Plan auswählen → laden
                setCurrentPlanName(plan.name);
                setCurrentPlan(plan.items);
                setCurrentPlanId(plan.id);
                resetInputs();
            }
            }}
            />
        </div>)}
      </main>
      {showToast && (
        <Toast
            message={toastMessage}
            type={toastType}
            onClose={() => setShowToast(false)}
        />
        )}
    </div>
  );
}
