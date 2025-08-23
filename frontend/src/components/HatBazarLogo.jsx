import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function HatBazarLogo() {
  // Words for "Haat" in different languages
  const haatWords = ["Haat", "हाट", "হাট", "حاط", "市場", "بازار"];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % haatWords.length);
    }, 2000); // change word every 2s
    return () => clearInterval(interval);
  }, [haatWords.length]);

  return (
    <div className="flex items-center space-x-2 text-5xl font-bold">
      {/* Animated "Haat" */}
      <motion.div
        key={index}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -40, opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="text-blue-600"
      >
        {haatWords[index]}
      </motion.div>

      {/* Static "Bazar" */}
      <div className="text-gray-800">Bazar</div>
    </div>
  );
}
