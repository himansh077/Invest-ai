"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@/components/Logo";

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Hide splash screen after 3.5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          id="splash-wrapper"
          className="fixed inset-0 bg-[#030303] z-[9998] flex items-center justify-center overflow-hidden cursor-pointer"
          initial={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
          onClick={() => setIsVisible(false)}
        >
          {/* Fractal noise background for splash */}
          <div className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-10 bg-noise" />
          
          <div className="relative z-20 text-center w-full h-full flex flex-col justify-between py-[60px] px-[40px]">
            <motion.div 
              className="tracking-[0.2em] text-[#888888] font-mono text-xs uppercase"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
            >
              System Initialization
            </motion.div>
            
            <div className="flex flex-col gap-2 items-center justify-center flex-1">
              <motion.div 
                className="font-sans font-light text-[clamp(3rem,8vw,7rem)] leading-[1.1] tracking-[0.05em] text-white uppercase flex flex-col"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
              >
                <div className="flex justify-center items-center w-full mb-4">
                  <Logo className="h-24 md:h-32 text-white" />
                </div>
                <span className="block text-transparent font-bold tracking-[0.1em]" style={{ WebkitTextStroke: "1.5px rgba(255, 255, 255, 0.75)" }}>
                  Core
                </span>
              </motion.div>
              
              <motion.div 
                className="font-mono text-[0.75rem] tracking-[0.25em] text-[#888888] mt-[40px]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
              >
                LOADING MODULES...
              </motion.div>
            </div>
            
            <motion.div 
              className="flex justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
            >
              <button className="bg-transparent text-[#888888] border border-[rgba(255,255,255,0.08)] font-mono text-[0.7rem] tracking-[0.15em] py-[12px] px-[24px] rounded-[4px] cursor-none uppercase transition-all hover:bg-[rgba(255,255,255,0.05)] hover:text-white hover:border-[rgba(255,255,255,0.2)]">
                Override Sequence
              </button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
