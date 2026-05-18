"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function IntroLoader() {
  const [isMounted, setIsMounted] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setIsMounted(true);
    
    // Comprobar sessionStorage para evitar repetir la intro en la misma sesión
    const hasSeenIntro = sessionStorage.getItem("garage_intro_seen");
    
    // Comprobar preferencia del sistema para movimientos reducidos
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (hasSeenIntro || prefersReduced) {
      setShowLoader(false);
      return;
    }

    // Si es la primera visita y no hay reduced motion activo, activamos el loader
    setShowLoader(true);
    document.body.style.overflow = "hidden";

    // Duración de la carga: aprox 2 segundos (2000ms)
    const duration = 2000;
    const intervalTime = 30; // Frecuencia de actualización en ms
    const steps = duration / intervalTime;
    const increment = 100 / steps;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          return 100;
        }
        return next;
      });
    }, intervalTime);

    return () => {
      clearInterval(timer);
      document.body.style.overflow = "";
    };
  }, []);

  // Al completar la carga, desactivar el loader con un ligero delay para percibir la barra al 100%
  useEffect(() => {
    if (progress === 100 && showLoader) {
      const timeout = setTimeout(() => {
        setShowLoader(false);
        sessionStorage.setItem("garage_intro_seen", "true");
        document.body.style.overflow = "";
      }, 400);
      return () => clearTimeout(timeout);
    }
  }, [progress, showLoader]);

  if (!isMounted) return null;

  return (
    <AnimatePresence>
      {showLoader && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black px-4 select-none"
          aria-hidden="true"
        >
          {/* Contenedor del contenido con escala sutil al salir */}
          <motion.div
            initial={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="flex flex-col items-center justify-center text-center max-w-lg w-full"
          >
            {/* Reproductor de vídeo 3D centrado y escalado premium */}
            <div className="relative mb-6 flex items-center justify-center h-44 w-44 md:h-64 md:w-64">
              <video
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-contain pointer-events-none"
              >
                <source src="/videos/logo3d.webm" type="video/webm" />
                <source src="/videos/logo3d.mp4" type="video/mp4" />
              </video>
            </div>

            {/* Textos con la tipografía e identidad de Garage Studios */}
            <h1 className="text-3xl font-black uppercase italic tracking-[0.25em] text-white sm:text-4xl">
              GARAGE <span className="text-[#F59E0B]">STUDIOS</span>
            </h1>
            
            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.35em] text-white/50 sm:text-xs">
              RECORDING · PRODUCTION · VISUALS
            </p>

            {/* Sección de la barra de progreso dorada/ámbar */}
            <div className="mt-12 flex flex-col items-center w-full max-w-[240px]">
              <div className="flex justify-between w-full text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">
                <span>LOADING</span>
                <span className="text-[#F59E0B] font-mono">{Math.round(progress)}%</span>
              </div>
              
              {/* Barra de progreso premium ultra fina */}
              <div className="h-[2px] w-full bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#F59E0B] rounded-full transition-all duration-75 ease-out shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
