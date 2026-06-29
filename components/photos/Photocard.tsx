"use client";

import type { PhotoEtatDesLieux } from "@/types/photo";

type Props = {
  photo: PhotoEtatDesLieux;
  onSupprimer: (id: string) => void;
  onCommentaire: (id: string, commentaire: string) => void;
};

export default function PhotoCard({
  photo,
  onSupprimer,
  onCommentaire,
}: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">

      <img
        src={photo.url}
        alt={photo.nom}
        className="h-52 w-full object-cover"
      />

      <div className="space-y-3 p-4">

        <div className="flex items-center justify-between">

          <h3 className="font-semibold">
            {photo.piece}
          </h3>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs">
            {photo.avantApres}
          </span>

        </div>

        <textarea
          placeholder="Ajouter un commentaire..."
          value={photo.commentaire}
          onChange={(e) =>
            onCommentaire(photo.id, e.target.value)
          }
          rows={3}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
        />

        <button
          onClick={() => onSupprimer(photo.id)}
          className="w-full rounded-xl bg-red-600 py-2 text-white hover:bg-red-700"
        >
          Supprimer la photo
        </button>

      </div>

    </div>
  );
}