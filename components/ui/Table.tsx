import type { ReactNode } from "react";

type Colonne = {
  titre: string;
  largeur?: string;
};

type Props = {
  colonnes: Colonne[];
  children: ReactNode;
  vide?: string;
};

export default function Table({
  colonnes,
  children,
  vide = "Aucune donnée.",
}: Props) {
  const lignes = Array.isArray(children)
    ? children.filter(Boolean)
    : children
    ? [children]
    : [];

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

      <div className="overflow-x-auto">

        <table className="min-w-full">

          <thead className="bg-slate-50">

            <tr>

              {colonnes.map((colonne) => (

                <th
                  key={colonne.titre}
                  className="border-b border-slate-200 px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500"
                  style={{
                    width: colonne.largeur,
                  }}
                >
                  {colonne.titre}
                </th>

              ))}

            </tr>

          </thead>

          <tbody>

            {lignes.length > 0 ? (
              children
            ) : (
              <tr>

                <td
                  colSpan={colonnes.length}
                  className="px-8 py-16 text-center text-slate-500"
                >
                  <div className="text-5xl">
                    📂
                  </div>

                  <p className="mt-5 text-lg font-semibold">
                    {vide}
                  </p>

                </td>

              </tr>
            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}