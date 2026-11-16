"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const INTRO_DURATION_MS = 1600;
const TICK_MS = 30;
const SESSION_KEY = "garage_intro_seen";

interface NetworkInformationLike {
  saveData?: boolean;
  effectiveType?: string;
}

/**
 * Decide si merece la pena descargar el vídeo 3D del logo (≈ 5-9 MB).
 * En conexiones lentas o con ahorro de datos mostramos solo el texto.
 */
function canAffordVideo(): boolean {
  if (typeof navigator === "undefined") return true;
  const connection = (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
  if (!connection) return true;
  if (connection.saveData) return false;
  if (connection.effectiveType && connection.effectiveType !== "4g") return false;
  return true;
}

/**
 * Pantalla de bienvenida cinemática (una vez por sesión).
 * - No se muestra con `prefers-reduced-motion`.
 * - Dura 1,6 s y no bloquea la hidratación ni la carga del resto de la página.
 * - El vídeo es decorativo: si no puede cargarse a tiempo, la barra avanza igual.
 */
export default function IntroLoader() {
  const [showLoader, setShowLoader] = useState(false);
  const [withVideo, setWithVideo] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let hasSeenIntro = true;
    try {
      hasSeenIntro = sessionStorage.getItem(SESSION_KEY) === "true";
    } catch {
      hasSeenIntro = true;
    }

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (hasSeenIntro || prefersReduced) return;

    // Primera visita: activamos el loader y bloqueamos el scroll de fondo
    const timer = window.setTimeout(() => {
      setWithVideo(canAffordVideo());
      setShowLoader(true);
      document.body.style.overflow = "hidden";
    }, 0);

    const steps = INTRO_DURATION_MS / TICK_MS;
    const increment = 100 / steps;
    const interval = window.setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          window.clearInterval(interval);
          return 100;
        }
        return next;
      });
    }, TICK_MS);

    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
      document.body.style.overflow = "";
    };
  }, []);

  // Al completar, desactivar el loader con un ligero delay para percibir el 100 %
  useEffect(() => {
    if (progress < 100 || !showLoader) return;
    const timeout = window.setTimeout(() => {
      setShowLoader(false);
      try {
        sessionStorage.setItem(SESSION_KEY, "true");
      } catch {
        /* sessionStorage no disponible */
      }
      document.body.style.overflow = "";
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [progress, showLoader]);

  return (
    <AnimatePresence>
      {showLoader && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex select-none flex-col items-center justify-center bg-black px-4"
          role="status"
          aria-live="polite"
          aria-label="Cargando Garage Studios"
        >
          <motion.div
            initial={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
            className="flex w-full max-w-lg flex-col items-center justify-center text-center"
          >
            {/* Logo 3D (decorativo). El MP4 va primero por ser el archivo más ligero. */}
            <div className="relative mb-6 flex h-44 w-44 items-center justify-center md:h-64 md:w-64" aria-hidden="true">
              {withVideo ? (
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  className="pointer-events-none h-full w-full object-contain"
                >
                  <source src="/videos/logo3d.mp4" type="video/mp4" />
                  <source src="/videos/logo3d.webm" type="video/webm" />
                </video>
              ) : (
                <div className="h-24 w-24 rounded-full border-2 border-[#F59E0B]/40 border-t-[#F59E0B] motion-safe:animate-spin" />
              )}
            </div>

            <p className="text-3xl font-black uppercase italic tracking-[0.25em] text-white sm:text-4xl">
              GARAGE <span className="text-[#F59E0B]">STUDIOS</span>
            </p>

            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.35em] text-white/60 sm:text-xs">
              RECORDING · PRODUCTION · VISUALS
            </p>

            {/* Barra de progreso ámbar ultrafina */}
            <div className="mt-12 flex w-full max-w-[240px] flex-col items-center">
              <div className="mb-2 flex w-full justify-between text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
                <span>LOADING</span>
                <span className="font-mono text-[#F59E0B]">{Math.round(progress)}%</span>
              </div>
              <div
                className="h-[2px] w-full overflow-hidden rounded-full bg-white/10"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress)}
              >
                <div
                  className="h-full origin-left rounded-full bg-[#F59E0B] shadow-[0_0_8px_rgba(245,158,11,0.5)] transition-transform duration-75 ease-out"
                  style={{ transform: `scaleX(${progress / 100})` }}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
