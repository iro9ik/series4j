// src/app/search/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import SeriesCard from "@/components/series/SeriesCard";
import { Search, Filter, X } from "lucide-react";

const GENRES = [
    "Action & Adventure", "Animation", "Comedy", "Crime", "Documentary",
    "Drama", "Family", "Kids", "Mystery", "Reality", "Sci-Fi & Fantasy"
];

function SearchPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const query = searchParams.get("q") || "";
    const initialGenre = searchParams.get("genre") || "";

    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [genre, setGenre] = useState(initialGenre);
    const [searchInput, setSearchInput] = useState(query);

    useEffect(() => {
        if (!query) {
            setResults([]);
            return;
        }

        async function fetchResults() {
            setLoading(true);
            try {
                const url = `/api/search?q=${encodeURIComponent(query)}${genre ? `&genre=${encodeURIComponent(genre)}` : ""}`;
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    setResults(data.results || []);
                }
            } catch (err) {
                console.error("Search failed:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchResults();
    }, [query, genre]);

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        if (!searchInput.trim()) return;
        const url = `/search?q=${encodeURIComponent(searchInput.trim())}${genre ? `&genre=${encodeURIComponent(genre)}` : ""}`;
        router.push(url);
    }

    function handleGenreFilter(g: string) {
        const newGenre = g === genre ? "" : g;
        setGenre(newGenre);
        if (query) {
            const url = `/search?q=${encodeURIComponent(query)}${newGenre ? `&genre=${encodeURIComponent(newGenre)}` : ""}`;
            router.push(url);
        }
    }

    return (
        <div className="min-h-screen px-6 py-8">
            {/* Search Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-4">Search Series</h1>

                {/* Search Bar */}
                <form onSubmit={handleSearch} className="relative max-w-2xl">
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Search for TV series..."
                        className="w-full px-6 py-4 pl-14 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-lg transition-all"
                    />
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                    <button
                        type="submit"
                        className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-2 bg-yellow-400 text-black rounded-xl font-semibold hover:bg-yellow-300 transition"
                    >
                        Search
                    </button>
                </form>
            </div>

            {/* Filter Bar */}
            <div className="sticky top-[73px] z-40 bg-black/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 mb-8">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 text-white/60 mr-2">
                        <Filter className="w-4 h-4" />
                        <span className="text-sm font-medium">Filter by Genre:</span>
                    </div>
                    {GENRES.map((g) => (
                        <button
                            key={g}
                            onClick={() => handleGenreFilter(g)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${genre === g
                                    ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/25"
                                    : "bg-white/5 text-white/80 hover:bg-white/10 border border-white/10"
                                }`}
                        >
                            {g}
                        </button>
                    ))}
                    {genre && (
                        <button
                            onClick={() => handleGenreFilter("")}
                            className="flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"
                        >
                            <X className="w-4 h-4" />
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Results */}
            {query && (
                <div className="mb-4">
                    <p className="text-white/60">
                        {loading ? "Searching..." : `Found ${results.length} results for "${query}"${genre ? ` in ${genre}` : ""}`}
                    </p>
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                            <div className="bg-white/10 rounded-lg h-[320px]" />
                            <div className="mt-2 bg-white/10 rounded h-4 w-3/4 mx-auto" />
                        </div>
                    ))}
                </div>
            ) : !query ? (
                <div className="text-center py-20">
                    <Search className="w-16 h-16 mx-auto text-white/20 mb-4" />
                    <p className="text-white/60 text-lg">Enter a search term to find series</p>
                </div>
            ) : results.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-white/60 text-lg">No series found for "{query}"</p>
                    {genre && (
                        <button
                            onClick={() => handleGenreFilter("")}
                            className="mt-4 px-6 py-2 bg-yellow-400 text-black rounded-full font-medium hover:bg-yellow-300 transition"
                        >
                            Clear Genre Filter
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {results.map((s) => (
                        <SeriesCard
                            key={s.id}
                            id={s.id}
                            title={s.name}
                            poster={s.poster_path}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full" />
            </div>
        }>
            <SearchPageContent />
        </Suspense>
    );
}
