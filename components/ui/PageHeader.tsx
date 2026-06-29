type Props = {
  titre: string;
  description: string;
};

export default function PageHeader({ titre, description }: Props) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-slate-900">{titre}</h1>
      <p className="mt-2 text-slate-500">{description}</p>
    </div>
  );
}