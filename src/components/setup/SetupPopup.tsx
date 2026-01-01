"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const GENRES = [
  "Drama",
  "Comedy",
  "Action",
  "Sci-Fi",
  "Fantasy",
  "Horror",
  "Thriller",
  "Crime",
  "Documentary",
  "Anime",
  "Cartoon",
];

export default function SetupPopup({ onComplete }: { onComplete?: () => void }) {
  const [step, setStep] = useState(1);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const toggleGenre = (genre: string) =>
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );

  const nextStep = async () => {
    if (step === 3) {
      try {
        const res = await fetch("/api/user/genres", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ genres: selectedGenres }),
        });

        if (!res.ok) {
          if (res.status === 401) {
            alert("You must be logged in to save your preferences.");
            return;
          }
          const text = await res.text().catch(() => null);
          throw new Error(text || "Failed to save genres");
        }

        // notify app (navbar etc) and close popup
        window.dispatchEvent(new Event("auth-change"));
        setCompleted(true);
        if (onComplete) onComplete();
      } catch (err) {
        console.error("Error saving genres:", err);
        alert("Could not save preferences. Please try again.");
      }
    } else {
      setStep((s) => s + 1);
    }
  };

  if (!mounted) return null;

  const popup = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* overlay */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />

      {/* panel */}
      <div className="relative bg-black rounded-xl shadow-xl max-w-lg w-full p-8 z-10">
        {/* progress */}
        <div className="flex items-center mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 px-1">
              <div className={`h-1 rounded-full transition-colors ${s <= step ? "bg-yellow-400" : "bg-white/20"}`} />
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-yellow-400">Welcome to Series4J</h1>
            <p className="text-white/80">Discover your favorite TV series and get personalized recommendations.</p>
            <button
              onClick={nextStep}
              className="mt-4 px-6 py-2 bg-yellow-400 text-black rounded-full hover:bg-yellow-300 transition"
            >
              Next
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-yellow-400">Choose your favorite genres</h2>
            <p className="text-white/80">You can select multiple genres to personalize your experience.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4 max-h-64 overflow-y-auto">
              {GENRES.map((genre) => (
                <button
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className={`px-4 py-2 rounded-full border text-sm transition
                    ${selectedGenres.includes(genre) ? "bg-yellow-400 text-black border-yellow-400" : "border-white/30 text-white/90"}`}
                >
                  {genre}
                </button>
              ))}
            </div>
            <button
              onClick={nextStep}
              className="mt-6 px-6 py-2 bg-yellow-400 text-black rounded-full hover:bg-yellow-300 transition"
            >
              Next
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-yellow-400">All Set!</h2>
            <p className="text-white/80">You’re ready to start exploring Series4J. Enjoy your personalized experience!</p>
            <button
              onClick={nextStep}
              className="mt-4 px-6 py-2 bg-yellow-400 text-black rounded-full hover:bg-yellow-300 transition"
            >
              Let’s Go
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // render into document.body so it is not hidden by app-level rules
  return createPortal(popup, document.body);
}
