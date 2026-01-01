// src/components/setup/SetupWrapper.tsx (client)
"use client";

import { useState, useEffect } from "react";
import SetupPopup from "./SetupPopup";

export default function SetupWrapper() {
  const [showSetup, setShowSetup] = useState(false);

// src/components/setup/SetupWrapper.tsx (client)
    useEffect(() => {
      async function check() {
        try {
          const res = await fetch("/api/user/genres");
          if (!res.ok) return;
          const data = await res.json();
          if (!data.genres || data.genres.length === 0) setShowSetup(true);
        } catch (e) { console.error(e); }
      }
      check();
    }, []);


  return <>{showSetup && <SetupPopup />}</>;
}
