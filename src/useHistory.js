import { useState, useEffect } from "react";

export function useHistory() {
  const [sessions, setSessions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cribbage_history") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    function onStorage(e) {
      if (e.key === "cribbage_history") {
        try {
          setSessions(JSON.parse(e.newValue || "[]"));
        } catch {
          setSessions([]);
        }
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return sessions;
}
