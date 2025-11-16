"use client";

import Image from "next/image";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Header() {
  const router = useRouter();
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push("/login");
    } catch (err) {
      console.error(err);
    }
  };

  const handleUserInterface = () => {
    router.push("/userInterface");
  };

  return (
    <header className="w-full bg-white shadow-md p-4 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <h1
          onClick={() => router.push("/welcome")}
          className="text-xl sm:text-2xl font-bold text-gray-800 cursor-pointer"
        >
          GymTracker
        </h1>
      </div>

      <nav className="flex items-center gap-4">
      <Link href='/userinterface'>
      <Image
        src='/user.png'
        alt="User"
        width={40}
        height={40}
        unoptimized
      />
    </Link>

        <button
          onClick={handleLogout}
          className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Logout
        </button>
      </nav>
    </header>
  );
}
