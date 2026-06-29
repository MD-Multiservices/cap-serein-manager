"use client";

import { useEffect, useRef, useState } from "react";

type Logement = {
  id: string;
  nom: string;
  adresse: string;
  ville: string;
  codePostal: string;
};

type PhotoPiece = {
  id: string;
  nom: string;
  dataUrl: string;
};

type EtatDesLieux = {
  id: string;
  logementId: string;
  type: string;
  notes: Record<string, string>;
  photos: Record<string, PhotoPiece[]>;
  signature: string;
  date: string;
};

const pieces = [
  "Entrée",
  "Salon",
  "Cuisine",
  "Chambre 1",
  "Chambre 2",
  "Salle de bain",
  "WC",
  "Terrasse / Balcon",
  "Compteurs",
  "Clés",
];

export default function NouvelEtatDesLieuxPage() {
  const [logements, setLogements] = useState<Logement[]>([]);
  const [logementId, setLogementId] = useState("");
  const [type, setType] = useState("Entrant");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<Record<string, PhotoPiece[]>>({});
  const [signature, setSignature] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dessinActif = useRef(false);

  useEffect(() => {
    const sauvegarde = localStorage.getItem("cap-serein-logements");
    if (sauvegarde) setLogements(JSON.parse(sauvegarde));
  }, []);

  function ajouterPhotos(piece: string, fichiers: FileList | null) {
    if (!fichiers) return;

    Array.from(fichiers).forEach((fichier) => {
      const reader = new FileReader();
      reader.onload = () => {
        const nouvellePhoto: PhotoPiece = {
          id: crypto.randomUUID(),
          nom: fichier.name,
          dataUrl: String(reader.result),
        };

        setPhotos((actuelles) => ({
          ...actuelles,
          [piece]: [...(actuelles[piece] || []), nouvellePhoto],
        }));
      };

      reader.readAsDataURL(fichier);
    });
  }

  function supprimerPhoto(piece: string, photoId: string) {
    setPhotos((actuelles) => ({
      ...actuelles,
      [piece]: (actuelles[piece] || []).filter((photo) => photo.id !== photoId),
    }));
  }

  function positionCanvas(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function commencerSignature(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    dessinActif.current = true;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = positionCanvas(event);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function dessinerSignature(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!dessinActif.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = positionCanvas(event);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.stroke();

    setSignature(canvas.toDataURL("image/png"));
  }

  function terminerSignature() {
    dessinActif.current = false;
  }

  function effacerSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature("");
  }

  function sauvegarderEtatDesLieux() {
    if (!logementId) {
      alert("Sélectionne un logement avant d’enregistrer.");
      return;
    }

    const rapport: EtatDesLieux = {
      id: crypto.randomUUID(),
      logementId,
      type,
      notes,
      photos,
      signature,
      date: new Date().toISOString(),
    };

    const ancienneSauvegarde = localStorage.getItem("cap-serein-etats-des-lieux");
    const etats: EtatDesLieux[] = ancienneSauvegarde
      ? JSON.parse(ancienneSauvegarde)
      : [];

    localStorage.setItem(
      "cap-serein-etats-des-lieux",
      JSON.stringify([...etats, rapport])
    );

    alert("État des lieux enregistré.");
    setNotes({});
    setPhotos({});
    setSignature("");
    effacerSignature();
  }

  const totalPhotos = Object.values(photos).reduce(
    (total, liste) => total + liste.length,
    0
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Nouvel état des lieux
        </h1>
        <p className="mt-2 text-slate-500">
          Photos, remarques, compteurs, clés et signature client.
        </p>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow">
        <h2 className="text-2xl font-bold">Informations générales</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label>
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Logement
            </span>
            <select
              value={logementId}
              onChange={(e) => setLogementId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
            >
              <option value="">Sélectionner un logement</option>
              {logements.map((logement) => (
                <option key={logement.id} value={logement.id}>
                  {logement.nom} — {logement.ville}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Type
            </span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
            >
              <option>Entrant</option>
              <option>Sortant</option>
              <option>Contrôle intermédiaire</option>
            </select>
          </label>
        </div>

        <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          Photos ajoutées : <strong>{totalPhotos}</strong>
        </div>
      </div>

      {pieces.map((piece) => (
        <div key={piece} className="rounded-3xl bg-white p-6 shadow">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold">{piece}</h2>
              <p className="text-sm text-slate-500">
                Photos et remarques de la zone.
              </p>
            </div>

            <label className="cursor-pointer rounded-xl border border-slate-300 px-4 py-3 text-center font-semibold hover:bg-slate-100">
              📷 Ajouter photos
              <input
                type="file"
                accept="image/*"
                multiple
                capture="environment"
                onChange={(e) => ajouterPhotos(piece, e.target.files)}
                className="hidden"
              />
            </label>
          </div>

          {(photos[piece] || []).length > 0 && (
            <div className="mt-5 grid gap-4 md:grid-cols-3 xl:grid-cols-4">
              {photos[piece].map((photo) => (
                <div key={photo.id} className="overflow-hidden rounded-2xl border bg-slate-50">
                  <img src={photo.dataUrl} alt={photo.nom} className="h-40 w-full object-cover" />
                  <div className="p-3">
                    <p className="truncate text-xs text-slate-500">{photo.nom}</p>
                    <button
                      onClick={() => supprimerPhoto(piece, photo.id)}
                      className="mt-2 rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <textarea
            value={notes[piece] || ""}
            onChange={(e) => setNotes({ ...notes, [piece]: e.target.value })}
            rows={4}
            placeholder={`Remarques pour ${piece.toLowerCase()}...`}
            className="mt-5 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
          />
        </div>
      ))}

      <div className="rounded-3xl bg-white p-6 shadow">
        <h2 className="text-2xl font-bold">Signature client</h2>
        <p className="mt-2 text-sm text-slate-500">
          Le client signe directement avec le doigt ou la souris.
        </p>

        <canvas
          ref={canvasRef}
          width={900}
          height={260}
          onPointerDown={commencerSignature}
          onPointerMove={dessinerSignature}
          onPointerUp={terminerSignature}
          onPointerLeave={terminerSignature}
          className="mt-5 h-64 w-full touch-none rounded-2xl border bg-white"
        />

        <button
          onClick={effacerSignature}
          className="mt-4 rounded-xl border px-5 py-3 font-semibold hover:bg-slate-100"
        >
          Effacer la signature
        </button>
      </div>

      <div className="sticky bottom-0 rounded-3xl border bg-white p-5 shadow-xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-500">
            État des lieux : <strong>{type}</strong> · Photos :{" "}
            <strong>{totalPhotos}</strong> · Signature :{" "}
            <strong>{signature ? "oui" : "non"}</strong>
          </p>

          <button
            onClick={sauvegarderEtatDesLieux}
            className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Enregistrer l’état des lieux
          </button>
        </div>
      </div>
    </div>
  );
}