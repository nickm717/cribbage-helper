import { useState, useEffect } from "react";

/**
 * One day's practice session, persisted to localStorage.
 * @typedef {Object} Session
 * @property {string} id
 * @property {string} date  ISO yyyy-mm-dd (locale "sv")
 * @property {number} hands
 * @property {number} yourEV
 * @property {number} optEV
 * @property {number} efficiency
 * @property {Record<string, number>} grades
 * @property {number} [yourPts]  legacy point totals (optional)
 * @property {number} [optPts]
 */

/** @returns {Session[]} */
function loadSessions() {
  try {
    return JSON.parse(localStorage.getItem("cribbage_history") || "[]");
  } catch {
    return [];
  }
}

/** @returns {Session[]} */
export function useHistory() {
  const [sessions, setSessions] = useState(loadSessions);

  useEffect(() => {
    /** @param {StorageEvent} e */
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
