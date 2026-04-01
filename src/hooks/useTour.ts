"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { driver, type DriveStep, type Driver } from "driver.js";

const TOUR_DELAY_MS = 600;

function getStorageItem(key: string): boolean {
  try {
    return localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

function setStorageItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Modo privado ou localStorage desabilitado — ignora silenciosamente
  }
}

export function useTour(pageKey: string, steps: DriveStep[], autoStart = true) {
  const driverRef = useRef<Driver | null>(null);
  const [hasSeenTour, setHasSeenTour] = useState(false);
  const storageKey = `tour_seen_${pageKey}`;

  const createDriver = useCallback(() => {
    // Filtra steps cujo elemento não existe no DOM (renders condicionais)
    const availableSteps = steps.filter((s) => {
      if (!s.element) return true;
      return !!document.querySelector(s.element as string);
    });

    return driver({
      showProgress: true,
      progressText: "{{current}} de {{total}}",
      nextBtnText: "Próximo →",
      prevBtnText: "← Voltar",
      doneBtnText: "✓ Entendi",
      smoothScroll: true,
      allowClose: true,
      overlayOpacity: 0.65,
      stagePadding: 12,
      stageRadius: 14,
      steps: availableSteps,
      onHighlighted: (el) => {
        if (!el) return;
        const handler = () => driverRef.current?.moveNext();
        el.addEventListener("click", handler, { once: true });
        (el as any).__tourClickHandler = handler;
      },
      onDeselected: (el) => {
        if (!el) return;
        const handler = (el as any).__tourClickHandler;
        if (handler) {
          el.removeEventListener("click", handler);
          delete (el as any).__tourClickHandler;
        }
      },
      onDestroyed: () => {
        setStorageItem(storageKey, "true");
        setHasSeenTour(true);
      },
    });
  }, [steps, storageKey]);

  const startTour = useCallback(() => {
    driverRef.current?.destroy();
    driverRef.current = createDriver();
    driverRef.current.drive();
  }, [createDriver]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const seen = getStorageItem(storageKey);
    setHasSeenTour(seen);

    if (!seen && autoStart) {
      const timer = setTimeout(() => {
        driverRef.current = createDriver();
        driverRef.current.drive();
      }, TOUR_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [storageKey, createDriver]);

  // Cleanup no unmount (troca de rota)
  useEffect(() => {
    return () => {
      driverRef.current?.destroy();
    };
  }, []);

  return { startTour, hasSeenTour };
}
