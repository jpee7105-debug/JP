import { useEffect, useCallback, useRef } from "react";

export function useUnsavedChanges(isDirty: boolean) {
  const dirtyRef = useRef(isDirty);
  dirtyRef.current = isDirty;

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const confirmNavigation = useCallback((cb: () => void) => {
    if (dirtyRef.current) {
      if (window.confirm("You have unsaved changes. Leave without saving?")) {
        cb();
      }
    } else {
      cb();
    }
  }, []);

  return { confirmNavigation };
}
