// src/components/setup/SetupWrapper.tsx (client)
"use client";

import { useState, useEffect } from "react";
import SetupPopup from "./SetupPopup";

export default function SetupWrapper() {
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    async function check() {
      const token = localStorage.getItem("token");
      if (!token) return;

      // immediate flag set by login
      const showSetupFlag = localStorage.getItem("showSetup");
      if (showSetupFlag === "true") {
        localStorage.removeItem("showSetup"); // show once
        setShowSetup(true);
        return;
      }

      // fallback: ask server if the user has genres
      try {
        const res = await fetch("/api/user/genres", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!data.genres || data.genres.length === 0) {
          setShowSetup(true);
        }
      } catch (err) {
        console.error("Error checking genres:", err);
      }
    }

    check();
  }, []);

  return <>{showSetup && <SetupPopup />}</>;
}
