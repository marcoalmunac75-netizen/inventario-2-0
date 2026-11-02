const styles: Record<string, string> = {
  OPERATIVO: "bg-success/15 text-success",
  "EQUIPO NUEVO": "bg-accent text-accent-foreground",
  REACONDICIONADO: "bg-secondary text-secondary-foreground",
  "GESTION CAMBIO DE EQUIPO": "bg-warning/20 text-warning-foreground",
  "PENDIENTE DE VALIDAR": "bg-warning/20 text-warning-foreground",
  "EN BODEGA": "bg-muted text-muted-foreground",
  DAÑADO: "bg-destructive/15 text-destructive",
  BAJA: "bg-destructive/15 text-destructive",
};

export function EstadoBadge({ estado }: { estado: string }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${styles[estado] ?? "bg-muted text-muted-foreground"}`}>
      {estado || "SIN INFORMACIÓN"}
    </span>
  );
}
