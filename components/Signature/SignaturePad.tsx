"use client";

import { useRef, useState } from "react";

type Props = {
  onSignatureChange?: (signature: string | null) => void;
};

export default function SignaturePad({
  onSignatureChange,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [dessine, setDessine] = useState(false);

  function position(
    e: React.MouseEvent<HTMLCanvasElement>
  ) {
    const canvas = canvasRef.current!;

    const rect = canvas.getBoundingClientRect();

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  function commencer(
    e: React.MouseEvent<HTMLCanvasElement>
  ) {
    const canvas = canvasRef.current!;

    const ctx = canvas.getContext("2d")!;

    const p = position(e);

    ctx.beginPath();

    ctx.moveTo(p.x, p.y);

    ctx.lineWidth = 2;

    ctx.lineCap = "round";

    setDessine(true);
  }

  function dessiner(
    e: React.MouseEvent<HTMLCanvasElement>
  ) {
    if (!dessine) return;

    const canvas = canvasRef.current!;

    const ctx = canvas.getContext("2d")!;

    const p = position(e);

    ctx.lineTo(p.x, p.y);

    ctx.stroke();
  }

  function terminer() {
    setDessine(false);

    const canvas = canvasRef.current;

    if (!canvas) return;

    onSignatureChange?.(
      canvas.toDataURL("image/png")
    );
  }

  function effacer() {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;

    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    onSignatureChange?.(null);
  }

  return (
    <div className="rounded-2xl border bg-white p-4">

      <h2 className="mb-4 text-lg font-bold">
        Signature
      </h2>

      <canvas
        ref={canvasRef}
        width={700}
        height={250}
        onMouseDown={commencer}
        onMouseMove={dessiner}
        onMouseUp={terminer}
        onMouseLeave={terminer}
        className="w-full rounded-xl border bg-white"
      />

      <button
        onClick={effacer}
        className="mt-4 rounded-xl bg-red-600 px-5 py-2 text-white"
      >
        Effacer
      </button>

    </div>
  );
}