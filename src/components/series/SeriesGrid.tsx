import SeriesCard from "./SeriesCard";

type Props = {
  series: any[];
};

export default function SeriesGrid({ series }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {series.map((s) => (
        <SeriesCard
          key={s.id}
          id={s.id}
          title={s.name}
          poster={s.poster_path}
        />
      ))}
    </div>
  );
}
