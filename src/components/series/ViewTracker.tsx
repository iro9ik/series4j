"use client";

import { useEffect } from "react";

interface ViewTrackerProps {
    seriesId: string;
    seriesName?: string;
    posterPath?: string;
    firstAirDate?: string;
    overview?: string;
    genres?: string[];
}

export default function ViewTracker({ seriesId }: ViewTrackerProps) {
    useEffect(() => {
        if (!seriesId) return;

        // Fire and forget view tracking
        fetch("/api/views", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ seriesId }),
            credentials: "same-origin",
        }).catch(err => console.error("Failed to track view:", err));
    }, [seriesId]);

    return null;
}
