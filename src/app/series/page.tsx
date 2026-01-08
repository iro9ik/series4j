// src/app/series/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Filter, TrendingUp, Clock, Star, History, ChevronLeft, ChevronRight } from "lucide-react";

const SORT_OPTIONS = [
    { value: "popular", label: "Popular", icon: TrendingUp },
    { value: "recent", label: "Recent", icon: Clock },
    { value: "toprated", label: "Top Rated", icon: Star },
    { value: "oldest", label: "Oldest", icon: History },
];

const GENRES = [
    "Action & Adventure", "Animation", "Comedy", "Crime", "Documentary",
    "Drama", "Family", "Kids", "Mystery", "News", "Reality",
    "Sci-Fi & Fantasy", "Western", "War & Politics"
];

function SeriesPageContent() {
    const searchParams = useSearchParams();
    const initialSort = searchParams.get("sort") || "popular";
    const initialGenre = searchParams.get("genre") || "";
    const initialPage = parseInt(searchParams.get("page") || "1") || 1;

    const [series, setSeries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sort, setSort] = useState(initialSort);
    const [genre, setGenre] = useState(initialGenre);
    const [page, setPage] = useState(initialPage);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        async function fetchSeries() {
            setLoading(true);
            try {
                if (genre) {
                    const res = await fetch(`/api/tmdb/discover?genreName=${encodeURIComponent(genre)}&page=${page}`);
                    if (res.ok) {
                        const data = await res.json();
                        let results = data.results || [];
                        results = sortResults(results, sort);
                        setSeries(results);
                        setTotalPages(data.total_pages || 1);
                    }
                } else {
                    let url = "";
                    if (sort === "popular") {
                        url = `/api/series/list?type=popular&page=${page}`;
                    } else if (sort === "toprated") {
                        url = `/api/series/list?type=top_rated&page=${page}`;
                    } else if (sort === "recent") {
                        url = `/api/series/list?type=airing_today&page=${page}`;
                    } else if (sort === "oldest") {
                        url = `/api/series/list?type=popular&sort=oldest&page=${page}`;
                    } else {
                        url = `/api/series/list?type=popular&page=${page}`;
                    }

                    const res = await fetch(url);
                    if (res.ok) {
                        const data = await res.json();
                        setSeries(data.results || []);
                        setTotalPages(data.total_pages || 1);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch series:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchSeries();
    }, [sort, genre, page]);

    function sortResults(results: any[], sortType: string) {
        const sorted = [...results];
        switch (sortType) {
            case "popular":
                return sorted.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
            case "recent":
                return sorted.sort((a, b) =>
                    new Date(b.first_air_date || "1900").getTime() - new Date(a.first_air_date || "1900").getTime()
                );
            case "toprated":
                return sorted.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
            case "oldest":
                return sorted.sort((a, b) =>
                    new Date(a.first_air_date || "2100").getTime() - new Date(b.first_air_date || "2100").getTime()
                );
            default:
                return sorted;
        }
    }

    function updateUrl(newSort: string, newGenre: string, newPage: number) {
        const url = new URL(window.location.href);
        url.searchParams.set("sort", newSort);
        url.searchParams.set("page", String(newPage));
        if (newGenre) {
            url.searchParams.set("genre", newGenre);
        } else {
            url.searchParams.delete("genre");
        }
        window.history.pushState({}, "", url);
    }

    function handleSortChange(newSort: string) {
        setSort(newSort);
        setPage(1);
        updateUrl(newSort, genre, 1);
    }

    function handleGenreChange(newGenre: string) {
        const g = newGenre === genre ? "" : newGenre;
        setGenre(g);
        setPage(1);
        updateUrl(sort, g, 1);
    }

    function handlePageChange(newPage: number) {
        if (newPage < 1 || newPage > totalPages) return;
        setPage(newPage);
        updateUrl(sort, genre, newPage);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // Generate page numbers to display
    function getPageNumbers() {
        const pages: (number | string)[] = [];
        const showPages = 5;
        let start = Math.max(1, page - 2);
        let end = Math.min(totalPages, page + 2);

        if (page <= 3) {
            end = Math.min(showPages, totalPages);
        }
        if (page >= totalPages - 2) {
            start = Math.max(1, totalPages - showPages + 1);
        }

        if (start > 1) {
            pages.push(1);
            if (start > 2) pages.push("...");
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        if (end < totalPages) {
            if (end < totalPages - 1) pages.push("...");
            pages.push(totalPages);
        }

        return pages;
    }

    return (
        <div className="min-h-screen px-6 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2">
                    {genre ? genre : "All Series"}
                </h1>
                <p className="text-white/60">
                    Discover amazing TV series
                </p>
            </div>

            {/* Filter Bar */}
            <div className="sticky top-[73px] z-40 bg-black/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 mb-8">
                {/* Sort Options */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                    <div className="flex items-center gap-2 text-white/60 mr-2">
                        <Filter className="w-4 h-4" />
                        <span className="text-sm font-medium">Sort:</span>
                    </div>
                    {SORT_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        return (
                            <button
                                key={option.value}
                                onClick={() => handleSortChange(option.value)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${sort === option.value
                                    ? "bg-yellow-400 text-black"
                                    : "bg-white/5 text-white/80 hover:bg-white/10 border border-white/10"
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {option.label}
                            </button>
                        );
                    })}
                </div>

                {/* Genre Filter */}
                <div className="flex flex-wrap gap-2">
                    <span className="text-white/60 text-sm font-medium mr-2 self-center">Genres:</span>
                    {GENRES.map((g) => (
                        <button
                            key={g}
                            onClick={() => handleGenreChange(g)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${genre === g
                                ? "bg-yellow-400 text-black"
                                : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/5"
                                }`}
                        >
                            {g}
                        </button>
                    ))}
                    {genre && (
                        <button
                            onClick={() => handleGenreChange("")}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Results */}
            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-6">
                    {[...Array(12)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                            <div className="bg-white/10 rounded-lg aspect-[2/3]" />
                        </div>
                    ))}
                </div>
            ) : series.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-white/60 text-lg">No series found</p>
                    <button
                        onClick={() => { setSort("popular"); setGenre(""); setPage(1); }}
                        className="mt-4 px-6 py-2 bg-yellow-400 text-black rounded-lg font-medium hover:bg-yellow-300 transition"
                    >
                        Reset Filters
                    </button>
                </div>
            ) : (
                <>
                    {/* Grid - Same size as home page carousel */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-6">
                        {series.map((s) => (
                            <Link key={s.id} href={`/series/${s.id}`} className="block group">
                                <div className="transition-transform duration-300 group-hover:scale-105">
                                    {s.poster_path ? (
                                        <img
                                            src={`https://image.tmdb.org/t/p/w300${s.poster_path}`}
                                            alt={s.name}
                                            className="w-full rounded-lg"
                                        />
                                    ) : (
                                        <div className="w-full aspect-[2/3] bg-white/10 rounded-lg flex items-center justify-center text-white/60 text-sm">
                                            No image
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-12">
                            <button
                                onClick={() => handlePageChange(page - 1)}
                                disabled={page === 1}
                                className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>

                            {getPageNumbers().map((p, i) => (
                                typeof p === "number" ? (
                                    <button
                                        key={i}
                                        onClick={() => handlePageChange(p)}
                                        className={`w-10 h-10 rounded-lg font-medium transition-all ${p === page
                                            ? "bg-yellow-400 text-black"
                                            : "bg-white/5 hover:bg-white/10"
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ) : (
                                    <span key={i} className="w-10 h-10 flex items-center justify-center text-white/50">
                                        {p}
                                    </span>
                                )
                            ))}

                            <button
                                onClick={() => handlePageChange(page + 1)}
                                disabled={page === totalPages}
                                className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default function SeriesPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full" />
            </div>
        }>
            <SeriesPageContent />
        </Suspense>
    );
}
