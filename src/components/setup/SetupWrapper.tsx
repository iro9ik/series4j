// src/components/setup/SetupWrapper.tsx (client)
"use client";

import { useState, useEffect } from "react";
import SetupPopup from "./SetupPopup";

export default function SetupWrapper() {
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        // We call the server to ask whether the user has genres; cookie is sent automatically
        const res = await fetch("/api/user/genres", { credentials: "same-origin" });
        if (!res.ok) return;
        const data = await res.json();
        if (!data.genres || data.genres.length === 0) {
          setShowSetup(true);
        }
      } catch (e) {
        console.error(e);
      }
    }
    check();
  }, []);

  // pass onComplete to hide the popup when setup finishes
  return <>{showSetup && <SetupPopup onComplete={() => setShowSetup(false)} />}</>;
}
