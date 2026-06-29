import type { ReactNode } from "react";

type Props = {
  titre: string;
  children: ReactNode;
  description?: string;
  action?: ReactNode;
};

export default function Section({
  titre,
  description,
  action,
  children,
}: Props) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

      <header className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 md:flex-row md:items-center md:justify-between">

        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {titre}
          </h2>

          {description && (
            <p className="mt-1 text-sm text-slate-500">
              {description}
            </p>
          )}
        </div>

        {action && (
          <div className="shrink-0">
            {action}
          </div>
        )}

      </header>

      <div className="p-6">
        {children}
      </div>

    </section>
  );
}