import Link from "next/link";

type Props = {
  id: number;
  title: string;
  poster: string | null;
};

export default function SeriesCard({ id, title, poster }: Props) {
  return (
    <Link href={`/series/${id}`} className="block">
      <div className="rounded-lg overflow-hidden bg-gray-800 hover:scale-105 transition">
        {poster && (
          <img
            src={`https://image.tmdb.org/t/p/w300${poster}`}
            alt={title}
            className="w-full h-[320px] object-cover"
          />
        )}
        <div className="p-2 text-white text-center text-sm font-semibold">
          {title}
        </div>
      </div>
    </Link>
  );
}
