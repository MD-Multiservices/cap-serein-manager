"use client";

import {
  PointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type Point = {
  x: number;
  y: number;
};

type SignaturePadProps = {
  label: string;
  description?: string;
  value: string;
  onChange: (signature: string) => void;
  disabled?: boolean;
};

export default function SignaturePad({
  label,
  description,
  value,
  onChange,
  disabled = false,
}: SignaturePadProps) {
  const canvasRef =
    useRef<HTMLCanvasElement | null>(null);

  const dessinEnCoursRef = useRef(false);
  const dernierPointRef = useRef<Point | null>(null);

  const [signatureEnCours, setSignatureEnCours] =
    useState(false);

  const dessinerImage = useCallback(
    (
      canvas: HTMLCanvasElement,
      signature: string
    ) => {
      const contexte = canvas.getContext("2d");

      if (!contexte) return;

      contexte.save();
      contexte.setTransform(1, 0, 0, 1, 0, 0);
      contexte.fillStyle = "#ffffff";
      contexte.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
      );
      contexte.restore();

      if (!signature) return;

      const image = new Image();

      image.onload = () => {
        contexte.drawImage(
          image,
          0,
          0,
          canvas.width,
          canvas.height
        );
      };

      image.src = signature;
    },
    []
  );

  const preparerCanvas = useCallback(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const rectangle =
      canvas.getBoundingClientRect();

    const ratio = Math.min(
      window.devicePixelRatio || 1,
      2
    );

    const largeur = Math.max(
      1,
      Math.round(rectangle.width * ratio)
    );

    const hauteur = Math.max(
      1,
      Math.round(rectangle.height * ratio)
    );

    if (
      canvas.width !== largeur ||
      canvas.height !== hauteur
    ) {
      canvas.width = largeur;
      canvas.height = hauteur;
    }

    const contexte = canvas.getContext("2d");

    if (!contexte) return;

    contexte.lineCap = "round";
    contexte.lineJoin = "round";
    contexte.strokeStyle = "#0f172a";
    contexte.fillStyle = "#0f172a";
    contexte.lineWidth = Math.max(3, 3 * ratio);

    dessinerImage(canvas, value);
  }, [dessinerImage, value]);

  useEffect(() => {
    preparerCanvas();

    const canvas = canvasRef.current;

    if (!canvas) return;

    const observateur = new ResizeObserver(() => {
      preparerCanvas();
    });

    observateur.observe(canvas);

    return () => {
      observateur.disconnect();
    };
  }, [preparerCanvas]);

  function obtenirPoint(
    event: PointerEvent<HTMLCanvasElement>
  ): Point {
    const canvas = canvasRef.current;

    if (!canvas) {
      return {
        x: 0,
        y: 0,
      };
    }

    const rectangle =
      canvas.getBoundingClientRect();

    return {
      x:
        (event.clientX - rectangle.left) *
        (canvas.width / rectangle.width),

      y:
        (event.clientY - rectangle.top) *
        (canvas.height / rectangle.height),
    };
  }

  function commencerSignature(
    event: PointerEvent<HTMLCanvasElement>
  ) {
    if (disabled) return;

    event.preventDefault();

    const canvas = canvasRef.current;
    const contexte = canvas?.getContext("2d");

    if (!canvas || !contexte) return;

    canvas.setPointerCapture(event.pointerId);

    const point = obtenirPoint(event);

    dessinEnCoursRef.current = true;
    dernierPointRef.current = point;
    setSignatureEnCours(true);

    contexte.beginPath();
    contexte.arc(
      point.x,
      point.y,
      contexte.lineWidth / 2,
      0,
      Math.PI * 2
    );
    contexte.fill();
  }

  function continuerSignature(
    event: PointerEvent<HTMLCanvasElement>
  ) {
    if (
      disabled ||
      !dessinEnCoursRef.current
    ) {
      return;
    }

    event.preventDefault();

    const canvas = canvasRef.current;
    const contexte = canvas?.getContext("2d");
    const dernierPoint =
      dernierPointRef.current;

    if (
      !canvas ||
      !contexte ||
      !dernierPoint
    ) {
      return;
    }

    const nouveauPoint = obtenirPoint(event);

    contexte.beginPath();
    contexte.moveTo(
      dernierPoint.x,
      dernierPoint.y
    );
    contexte.lineTo(
      nouveauPoint.x,
      nouveauPoint.y
    );
    contexte.stroke();

    dernierPointRef.current = nouveauPoint;
  }

  function terminerSignature(
    event: PointerEvent<HTMLCanvasElement>
  ) {
    if (
      disabled ||
      !dessinEnCoursRef.current
    ) {
      return;
    }

    event.preventDefault();

    const canvas = canvasRef.current;

    dessinEnCoursRef.current = false;
    dernierPointRef.current = null;
    setSignatureEnCours(false);

    if (!canvas) return;

    if (
      canvas.hasPointerCapture(event.pointerId)
    ) {
      canvas.releasePointerCapture(
        event.pointerId
      );
    }

    onChange(canvas.toDataURL("image/png"));
  }

  function effacerSignature() {
    if (disabled) return;

    const canvas = canvasRef.current;

    if (!canvas) return;

    const contexte = canvas.getContext("2d");

    if (!contexte) return;

    contexte.save();
    contexte.setTransform(1, 0, 0, 1, 0, 0);
    contexte.fillStyle = "#ffffff";
    contexte.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );
    contexte.restore();

    onChange("");
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-black text-slate-950">
            {label}
          </h3>

          {description && (
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {description}
            </p>
          )}
        </div>

        {value ? (
          <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
            ✓ Signature enregistrée
          </span>
        ) : (
          <span className="w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
            Signature requise
          </span>
        )}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-white">
        <canvas
          ref={canvasRef}
          aria-label={label}
          onPointerDown={commencerSignature}
          onPointerMove={continuerSignature}
          onPointerUp={terminerSignature}
          onPointerCancel={terminerSignature}
          onPointerLeave={(event) => {
            if (dessinEnCoursRef.current) {
              terminerSignature(event);
            }
          }}
          className={`block h-48 w-full touch-none bg-white sm:h-56 ${
            disabled
              ? "cursor-not-allowed opacity-60"
              : "cursor-crosshair"
          }`}
        />
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-medium leading-5 text-slate-500">
          Signez avec le doigt, un stylet ou la
          souris dans le cadre blanc.
        </p>

        <button
          type="button"
          onClick={effacerSignature}
          disabled={
            disabled ||
            (!value && !signatureEnCours)
          }
          className="min-h-11 rounded-2xl border border-red-200 bg-red-50 px-5 py-2 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Effacer la signature
        </button>
      </div>
    </section>
  );
}