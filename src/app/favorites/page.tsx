export default async function FavoritesPage() {
  const res = await fetch("/api/favorites", { cache: "no-store" });

  if (!res.ok) {
    return <div className="p-6">Failed to load favorites</div>;
  }

  const favorites = await res.json();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Favorite Series</h1>
      {favorites.length === 0 ? (
        <p>No favorites yet.</p>
      ) : (
        <ul className="space-y-2">
          {favorites.map((fav: any) => (
            <li key={fav.series_id} className="border p-3 rounded-lg">
              Series ID: {fav.series_id}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
