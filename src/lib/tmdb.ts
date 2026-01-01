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

export async function getTopRatedSeries() {
  try {
    const res = await fetch(`${BASE_URL}/tv/top_rated?api_key=${process.env.TMDB_API_KEY}&language=en-US&page=1`);
    if (!res.ok) {
      console.error("TMDB API error (top rated):", res.status, await res.text());
      return [];
    }
    const data = await res.json();
    return data.results || [];
  } catch (err) {
    console.error("Failed to fetch top rated series:", err);
    return [];
  }
}

export async function getTvGenres() {
  try {
    const res = await fetch(`${BASE_URL}/genre/tv/list?api_key=${process.env.TMDB_API_KEY}&language=en-US`);
    if (!res.ok) {
      console.error("TMDB genre list error:", res.status, await res.text());
      return [];
    }
    const data = await res.json();
    return data.genres || [];
  } catch (err) {
    console.error("Failed to fetch tmdb tv genres:", err);
    return [];
  }
}