const BASE_URL = "https://api.themoviedb.org/3";

export async function getPopularSeries() {
  try {
    const res = await fetch(
      `${BASE_URL}/tv/popular?api_key=${process.env.TMDB_API_KEY}`
    );

    if (!res.ok) {
      console.error("TMDB API error:", res.status, await res.text());
      return [];
    }

    const data = await res.json();
    return data.results || [];
  } catch (err) {
    console.error("Failed to fetch popular series:", err);
    return [];
  }
}

export async function getSeriesDetails(id: string) {
  try {
    const res = await fetch(
      `${BASE_URL}/tv/${id}?api_key=${process.env.TMDB_API_KEY}`
    );

    if (!res.ok) {
      console.error("TMDB API error:", res.status, await res.text());
      return null;
    }

    return res.json();
  } catch (err) {
    console.error("Failed to fetch series details:", err);
    return null;
  }
}
