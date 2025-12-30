"use client";

import { useState, useEffect } from "react";
import SetupPopup from "./SetupPopup"; // relative import to SetupPopup

export default function SetupWrapper() {
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    const setupDone = localStorage.getItem("setupDone");
    if (!setupDone) {
      setShowSetup(true);
    }
  }, []);

  return <>{showSetup && <SetupPopup />}</>;
}
