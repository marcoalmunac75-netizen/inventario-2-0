import type { Estado } from "@/lib/inventory";

const styles: Record<Estado, string> = {
  Operativo: "bg-success/15 text-success",
  "En reparación": "bg-warning/20 text-warning-foreground",
  "En bodega": "bg-muted text-muted-foreground",
  "De baja": "bg-destructive/15 text-destructive",
};

export function EstadoBadge({ estado }: { estado: Estado }) {
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${styles[estado]}`}>{estado}</span>;
}
