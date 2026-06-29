"use client";

import { useMemo, useState } from "react";

const pieces = [
  "Entrée",
  "Salon",
  "Cuisine",
  "Chambre 1",
  "Chambre 2",
  "Salle de bain",
  "WC",
  "Balcon",
  "Terrasse",
  "Garage",
];

export default function PhotosPage() {
  const [photos, setPhotos] = useState<
    {
      piece: string;
      fichier: string;
    }[]
  >([]);

  const progression = useMemo(() => {
    const piecesCompletes = pieces.filter((piece) =>
      photos.some((photo) => photo.piece === piece)
    ).length;

    return Math.round((piecesCompletes / pieces.length) * 100);
  }, [photos]);

  function ajouterPhoto(
    piece: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const fichier = event.target.files?.[0];

    if (!fichier) return;

    setPhotos((actuelles) => [
      ...actuelles,
      {
        piece,
        fichier: fichier.name,
      },
    ]);
  }

  return (
    <div className="space-y-8">

      <div>

        <h1 className="text-3xl font-bold">
          Photos
        </h1>

        <p className="mt-2 text-slate-500">
          État des lieux intelligent.
        </p>

      </div>

      <div className="rounded-3xl bg-white p-6 shadow">

        <div className="flex items-center justify-between">

          <h2 className="text-xl font-bold">
            Progression
          </h2>

          <span className="text-2xl font-bold text-blue-600">
            {progression} %
          </span>

        </div>

        <div className="mt-4 h-4 overflow-hidden rounded-full bg-slate-200">

          <div
            className="h-full bg-blue-600 transition-all"
            style={{
              width: `${progression}%`,
            }}
          />

        </div>

      </div>

      <div className="grid gap-4">

        {pieces.map((piece) => {

          const nb = photos.filter(
            (photo) => photo.piece === piece
          ).length;

          return (
            <div
              key={piece}
              className="rounded-2xl bg-white p-5 shadow"
            >

              <div className="flex items-center justify-between">

                <div>

                  <h3 className="font-bold">
                    {piece}
                  </h3>

                  <p className="text-sm text-slate-500">
                    {nb} photo(s)
                  </p>

                </div>

                <label className="cursor-pointer rounded-xl bg-blue-600 px-4 py-2 text-white">

                  Ajouter

                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) =>
                      ajouterPhoto(piece, e)
                    }
                  />

                </label>

              </div>

            </div>
          );

        })}

      </div>

    </div>
  );
}