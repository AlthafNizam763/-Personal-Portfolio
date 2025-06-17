import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";

export default function ErrorPopup({ message }) {
  const audioRef = useRef(null);

  useEffect(() => {
    // Play sound
    if (audioRef.current) {
      audioRef.current.play().catch((e) => console.error("Audio play error:", e));
    }

    // Refresh page after 4 seconds
    const timer = setTimeout(() => {
      window.location.reload();
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full text-center"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
      >
        {/* Error Sound */}
        <audio ref={audioRef} src="assets/error.mp3" preload="auto" />

        {/* Error Image */}
        <img src="assets/error.gif" alt="Error" className="mx-auto mb-4" />

        {/* Message Content */}
        <h2 className="text-xl font-semibold mb-2">500 Internal Server Error</h2>
        <p className="text-sm text-gray-700">Oops! Refreshing...</p>
        <p className="text-xs text-gray-400 mt-1">{message}</p>
      </motion.div>
    </motion.div>
  );
}
