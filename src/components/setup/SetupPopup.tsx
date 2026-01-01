"use client";

import { useState } from "react";

type Props = {
  onComplete?: () => void;
};

const GENRES = [
  "Action & Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Family",
  "Kids",
  "Mystery",
  "News",
  "Reality",
  "Sci-Fi & Fantasy",
  "Soap",
  "Talk",
  "War & Politics",
  "Western",
];

export default function SetupPopup({ onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);

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
            alert("You must be logged in to save your preferences.");
            setSaving(false);
            return;
          }
          let text = "Failed to save preferences";
          try {
            const data = await res.json();
            if (data?.error) text = data.error;
          } catch {
            try {
              const t = await res.text();
              if (t) text = t;
            } catch {}
          }
          throw new Error(text);
        }

        // notify other parts of the app
        window.dispatchEvent(new Event("auth-change"));

        setCompleted(true);
        if (typeof onComplete === "function") onComplete();
      } catch (err: any) {
        console.error("Error saving genres:", err);
        alert(err?.message ?? "Could not save preferences. Please try again.");
      } finally {
        setSaving(false);
      }
    } else {
      setStep((s) => s + 1);
    }
  };

  if (completed) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-black rounded-xl shadow-xl max-w-lg w-full p-8 relative">
        {/* Progress bar */}
        <div className="flex items-center mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1">
              <div
                className={`h-1 rounded-full transition-colors ${
                  s <= step ? "bg-yellow-400" : "bg-white/30"
                }`}
              />
            </div>
          ))}
        </div>

        {/* Step content */}
        {step === 1 && (
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-yellow-400 animate-pulse">
              Welcome to Series4J
            </h1>
            <p className="text-white/80">
              Discover your favorite TV series and get personalized recommendations.
            </p>
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
                  className={`px-4 py-2 rounded-full border ${
                    selectedGenres.includes(genre)
                      ? "bg-yellow-400 text-black"
                      : "border-white/40 text-white/80"
                  } hover:bg-yellow-400 hover:text-black transition`}
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

            <div className="mt-4 flex items-center justify-center gap-4">
              <button
                onClick={nextStep}
                disabled={saving}
                className="px-6 py-2 bg-yellow-400 text-black rounded-full hover:bg-yellow-300 transition"
              >
                {saving ? "Saving…" : "Let’s Go"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
