import type { ReactNode } from "react";

export default function TableCell({ children }: { children: ReactNode }) {
  return <td className="px-6 py-5 align-middle">{children}</td>;
}