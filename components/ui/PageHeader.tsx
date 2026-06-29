import type { ReactNode } from "react";

type Props = {
  titre: string;
  description?: string;
  action?: ReactNode;
};

export default function PageHeader({
  titre,
  description,
  action,
}: Props) {
  return (
    <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

      <div>

        <h1 className="text-4xl font-black tracking-tight text-slate-900">
          {titre}
        </h1>

        {description && (
          <p className="mt-2 max-w-3xl text-base text-slate-500">
            {description}
          </p>
        )}

      </div>

      {action && (
        <div className="flex shrink-0 items-center">
          {action}
        </div>
      )}

    </div>
  );
}