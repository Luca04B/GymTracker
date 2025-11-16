"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface AuthFormProps {
  mode: "login" | "register";
  buttonText: string;
  successMessage?: string;
  linkText: string;
  linkHref: string;
}

export default function AuthForm({ mode, buttonText, successMessage, linkText, linkHref }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
        setSuccess(successMessage || "Login erfolgreich!");
        setTimeout(() => router.push("/welcome"), 500);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        setSuccess(successMessage || "Account erfolgreich erstellt!");
        setTimeout(() => router.push("/login"), 1000);
      }
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-gray-800">
          {mode === "login" ? "Login" : "Registrieren"}
        </h1>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg 
             text-gray-600 placeholder-gray-400
             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Passwort</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg 
             text-gray-600 placeholder-gray-400
             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-300"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-500 text-sm">{success}</p>}

          <button
            type="submit"
            className="w-full bg-blue-500 text-white font-semibold py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            {buttonText}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          {mode === "login" ? "Noch keinen Account?" : "Bereits einen Account?"}{" "}
          <Link href={linkHref} className="text-blue-500 font-medium hover:underline">
            {linkText}
          </Link>
        </p>
      </div>
    </div>
  );
}
