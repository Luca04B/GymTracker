"use client";

interface Exercise {
  id: string;
  name: string;
  factor: number;
}

interface MyExercisesListProps {
  exercises: Exercise[];
}

export default function MyExercisesList({ exercises }: MyExercisesListProps) {
  if (!exercises || exercises.length === 0)
    return (
      <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200 text-center">
        <h2 className="text-xl font-semibold mb-4">Meine Übungen</h2>
        <p>Keine Übungen gefunden.</p>
      </div>
    );

  const scrollable = exercises.length > 3;

  return (
    <div
      className={`bg-white p-4 rounded-xl shadow-md border border-gray-100 ${
        scrollable ? "overflow-y-auto scrollbar-hide" : ""
      }`}
      style={{ maxHeight: scrollable ? "300px" : "auto" }}
    >
      <h2 className="text-xl text-gray-800 font-semibold mb-4">Meine Übungen</h2>
      <ul className="space-y-2">
        {exercises.map((ex) => (
          <li
            key={ex.id}
            className="flex justify-between items-center p-2 border-b border-gray-200 text-gray-800"
          >
            <span>{ex.name}</span>
            <span className="text-gray-500 text-sm">Faktor: {ex.factor}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
