"use client";

import { useState } from "react";

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

export default function SetupPopup() {
  const [step, setStep] = useState(1);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : [...prev, genre]
    );
  };

  const nextStep = () => {
    if (step === 3) {
      setCompleted(true);
      localStorage.setItem("setupDone", "true");
      localStorage.setItem("genres", JSON.stringify(selectedGenres));
    } else {
      setStep(step + 1);
    }
  };

  if (completed) return null; // hide popup after completion

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
              ></div>
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
            <h2 className="text-2xl font-bold text-yellow-400">
              Choose your favorite genres
            </h2>
            <p className="text-white/80">
              You can select multiple genres to personalize your experience.
            </p>
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
            <p className="text-white/80">
              You’re ready to start exploring Series4J. Enjoy your personalized experience!
            </p>
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
}
