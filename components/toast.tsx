"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  duration?: number; // in ms
  onClose: () => void;
}

export default function Toast({
  message,
  type = "info",
  duration = 1500,
  onClose,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor =
    type === "success"
      ? "bg-green-600"
      : type === "error"
      ? "bg-red-600"
      : "bg-blue-600";
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className={`fixed top-4 right-4 z-50 flex items-center gap-3 ${bgColor} text-white px-4 py-3 rounded-lg shadow-lg w-64 sm:w-72 md:w-80 lg:w-96`}
      >
        {/* Text */}
        <p className="truncate text-sm sm:text-base">
          {message}
        </p>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="ml-auto text-white hover:text-gray-200 font-bold"
        >
          ×
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
