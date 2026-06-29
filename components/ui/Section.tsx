import type { ReactNode } from "react";

type Props = {
  titre: string;
  children: ReactNode;
};

export default function Section({ titre, children }: Props) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow">
      <h2 className="mb-6 text-2xl font-bold">{titre}</h2>
      {children}
    </section>
  );
}