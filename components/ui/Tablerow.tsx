import type { ReactNode } from "react";

export default function TableRow({ children }: { children: ReactNode }) {
  return (
    <tr className="border-b border-slate-100 transition hover:bg-slate-50">
      {children}
    </tr>
  );
}