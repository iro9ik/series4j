"use client";

import { useState, useEffect, useCallback } from "react";
import SetupPopup from "./SetupPopup";

export default function SetupWrapper() {
  const [showSetup, setShowSetup] = useState(false);

  const check = useCallback(async () => {
    try {
      // ask the server if the user has already chosen genres
      const res = await fetch("/api/user/genres", { credentials: "same-origin" });
      if (!res.ok) {
        // unauthorized -> no popup (user not logged)
        return;
      }
      const data = await res.json();
      if (!data.genres || data.genres.length === 0) {
        setShowSetup(true);
      } else {
        setShowSetup(false);
      }
    } catch (e) {
      console.error("SetupWrapper: check failed", e);
    }
  }, []);

  useEffect(() => {
    // initial check on mount
    check();

    // re-check when auth state changes (login/logout)
    function onAuthChange() {
      check();
    }
    window.addEventListener("auth-change", onAuthChange);

    return () => {
      window.removeEventListener("auth-change", onAuthChange);
    };
  }, [check]);

  // toggle body class so main remains hidden while setup is shown.
  useEffect(() => {
    if (showSetup) {
      document.body.classList.add("setup-open");
    } else {
      document.body.classList.remove("setup-open");
    }
    return () => {
      document.body.classList.remove("setup-open");
    };
  }, [showSetup]);

  // render the popup as a portal inside the document body (SetupPopup does the portal),
  // We pass onComplete so popup can notify wrapper to hide.
  return <>{showSetup && <SetupPopup onComplete={() => setShowSetup(false)} />}</>;
}
