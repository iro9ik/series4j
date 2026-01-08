import Link from "next/link";

type Props = {
  id: number;
  title: string;
  poster: string | null;
};

export default function SeriesCard({ id, title, poster }: Props) {
  return (
    <Link href={`/series/${id}`} className="block">
      <div className="transition-transform duration-300 hover:scale-105">
        {poster ? (
          <img
            src={`https://image.tmdb.org/t/p/w300${poster}`}
            alt={title}
            className="w-full rounded-lg"
          />
        ) : (
          <div className="w-full aspect-[2/3] bg-white/10 rounded-lg flex items-center justify-center text-white/60 text-sm">
            No image
          </div>
        )}
      </div>
    </Link>
  );
}
