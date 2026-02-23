import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "rabbit-hole-tour-completed";

export function useOnboarding() {
  const [tourCompleted, setTourCompleted] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  useEffect(() => {
    if (!tourCompleted) {
      const timer = setTimeout(() => setTourActive(true), 800);
      return () => clearTimeout(timer);
    }
  }, [tourCompleted]);

  const completeTour = useCallback(() => {
    setTourActive(false);
    setTourCompleted(true);
    setTourStep(0);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {}
  }, []);

  const restartTour = useCallback(() => {
    setTourStep(0);
    setTourCompleted(false);
    setTourActive(true);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  const nextStep = useCallback(() => {
    setTourStep((s) => s + 1);
  }, []);

  const prevStep = useCallback(() => {
    setTourStep((s) => Math.max(0, s - 1));
  }, []);

  return {
    tourCompleted,
    tourActive,
    tourStep,
    completeTour,
    restartTour,
    nextStep,
    prevStep,
    setTourActive,
  };
}
