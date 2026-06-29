"use client";

type Props = {
  piece: string;
  photos: number;
  minimum: number;
  onOuvrir: () => void;
};

export default function ChecklistPiece({
  piece,
  photos,
  minimum,
  onOuvrir,
}: Props) {
  const complete = photos >= minimum;

  return (
    <button
      onClick={onOuvrir}
      className="w-full rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-center justify-between">

        <div>

          <h3 className="text-lg font-bold">
            {piece}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {photos} / {minimum} photo(s)
          </p>

        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full text-xl ${
            complete
              ? "bg-green-100 text-green-700"
              : "bg-orange-100 text-orange-600"
          }`}
        >
          {complete ? "✓" : "📷"}
        </div>

      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">

        <div
          className={`h-full ${
            complete ? "bg-green-600" : "bg-orange-500"
          }`}
          style={{
            width: `${Math.min(
              (photos / minimum) * 100,
              100
            )}%`,
          }}
        />

      </div>

    </button>
  );
}