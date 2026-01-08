"use client";

import { useState, useEffect } from "react";

type Props = {
  onComplete?: () => void;
};

const GENRES = [
  "Action", "Animation", "Comedy", "Crime", "Documentary",
  "Drama", "Family", "Kids", "Mystery", "News", "Reality", "Fantasy",
];

export default function SetupPopup({ onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);

  // Prevent body scroll when popup is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const toggleGenre = (genre: string) =>
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );

  const nextStep = async () => {
    if (step === 3) {
      setSaving(true);
      try {
        const res = await fetch("/api/user/genres", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ genres: selectedGenres }),
          credentials: "same-origin",
        });

        if (!res.ok) {
          if (res.status === 401) {
            alert("You must be logged in.");
            setSaving(false);
            return;
          }
          throw new Error("Failed to save preferences");
        }

        window.dispatchEvent(new Event("auth-change"));
        setCompleted(true);
        if (typeof onComplete === "function") onComplete();
      } catch (err: any) {
        console.error("Error saving genres:", err);
        alert(err?.message ?? "Could not save preferences.");
      } finally {
        setSaving(false);
      }
    } else {
      setStep((s) => s + 1);
    }
  };

  if (completed) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-black/80 border border-yellow-400/20 rounded-3xl max-w-lg w-full mx-4 p-8 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-yellow-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-yellow-400/10 rounded-full blur-3xl" />

        {/* Progress bar */}
        <div className="relative flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 h-1.5 rounded-full bg-white/10">
              <div
                className={`h-full rounded-full transition-all duration-500 ${s <= step ? "bg-yellow-400" : ""}`}
                style={{ width: s <= step ? "100%" : "0%" }}
              />
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="text-center space-y-6 relative z-10">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent">
              Welcome to Series4J
            </h1>
            <p className="text-white/60 max-w-sm mx-auto">
              Discover TV series and get personalized recommendations.
            </p>
            <button
              onClick={nextStep}
              className="mt-4 px-8 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black rounded-xl font-bold hover:from-yellow-300 hover:to-yellow-400 transition-all shadow-lg shadow-yellow-400/25 flex items-center justify-center gap-2 mx-auto"
            >
              Get Started
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="text-center space-y-6 relative z-10">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent">
              Choose your genres
            </h2>
            <p className="text-white/60 text-sm">
              Select genres to personalize your experience
            </p>

            <div className="grid grid-cols-3 gap-3 mt-4 max-h-64 overflow-y-auto py-2">
              {GENRES.map((genre) => (
                <button
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className={`px-4 py-3 rounded-xl font-medium text-sm transition-all ${selectedGenres.includes(genre)
                      ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/25"
                      : "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10"
                    }`}
                >
                  {genre}
                </button>
              ))}
            </div>

            <p className="text-white/40 text-xs">{selectedGenres.length} selected</p>

            <button
              onClick={nextStep}
              className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black rounded-xl font-bold hover:from-yellow-300 hover:to-yellow-400 transition-all shadow-lg shadow-yellow-400/25 flex items-center justify-center gap-2 mx-auto"
            >
              Continue
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="text-center space-y-6 relative z-10">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent">
              All Set!
            </h2>
            <p className="text-white/60 max-w-sm mx-auto">
              You're ready to start exploring.
            </p>
            <button
              onClick={nextStep}
              disabled={saving}
              className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black rounded-xl font-bold hover:from-yellow-300 hover:to-yellow-400 transition-all shadow-lg shadow-yellow-400/25 disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
            >
              {saving && <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
              Let's Go
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
