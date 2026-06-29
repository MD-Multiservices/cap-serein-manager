type Props = {
  titre: string;
  valeur: string | number;
  couleur?: "blue" | "green" | "orange" | "red";
};

const couleurs = {
  blue: "border-blue-500 text-blue-600",
  green: "border-green-500 text-green-600",
  orange: "border-orange-500 text-orange-600",
  red: "border-red-500 text-red-600",
};

export default function StatCard({
  titre,
  valeur,
  couleur = "blue",
}: Props) {
  return (
    <div
      className={`rounded-3xl border-l-4 bg-white p-6 shadow ${couleurs[couleur]}`}
    >
      <p className="text-sm font-medium text-slate-500">
        {titre}
      </p>

      <h2 className="mt-3 text-4xl font-bold">
        {valeur}
      </h2>
    </div>
  );
}