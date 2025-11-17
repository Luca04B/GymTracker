"use client";

import Image from "next/image";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAssetPath } from "@/lib/getAssetPath";
import { useState } from "react";
import { HiMenu, HiX } from "react-icons/hi";

export default function Header() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push("/login");
    } catch (err) {
      console.error(err);
    }
  };

  const menuItems = [
    { href: "/trainingPlan", label: "Trainingspläne", icon: "/plan.png" },
    { href: "/exercise", label: "Übungen", icon: "/exercise.png" },
    { href: "/checkUserPage", label: "Benutzer", icon: "/user.png" },
  ];

  return (
    <header className="w-full bg-white shadow-md fixed top-0 left-0 z-50">
      <div className="flex justify-between items-center p-4 max-w-5xl mx-auto">
        <h1
          onClick={() => router.push("/welcome")}
          className="text-xl sm:text-2xl font-bold text-gray-800 cursor-pointer"
        >
          GymTracker
        </h1>

        {/* Desktop Menu */}
        <nav className="hidden sm:flex items-center gap-6">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center gap-1">
              <Image
                src={getAssetPath(item.icon)}
                alt={item.label}
                width={40}
                height={40}
                unoptimized
              />
              <span className="text-gray-800 font-medium">{item.label}</span>
            </Link>
          ))}

          <button
            onClick={handleLogout}
            className="bg-sky-600 text-white px-3 py-1 rounded-lg hover:bg-sky-800 transition-colors"
          >
            Logout
          </button>
        </nav>

        {/* Mobile Hamburger */}
        <div className="sm:hidden flex items-center text-gray-800">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? (
              <HiX size={28} />
            ) : (
              <HiMenu size={28} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-white shadow-md border-t border-gray-200 w-full animate-slideDown">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 px-6 py-3 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Image
                src={getAssetPath(item.icon)}
                alt={item.label}
                width={30}
                height={30}
                unoptimized
              />
              <span className="text-gray-800 font-medium">{item.label}</span>
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="w-full text-left px-6 py-3 text-gray-800 font-medium hover:bg-gray-100"
          >
            Logout
          </button>
        </div>
      )}

      {/* Slide-down animation */}
      <style jsx>{`
        .animate-slideDown {
          animation: slideDown 0.3s ease forwards;
        }
        @keyframes slideDown {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </header>
  );
}