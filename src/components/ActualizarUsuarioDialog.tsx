import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useUpdateUsuario, type Activo } from "@/lib/inventory";

export function ActualizarUsuarioDialog({ activo, usuarios, onClose }: { activo: Activo | null; usuarios: string[]; onClose: () => void }) {
  const [usuario, setUsuario] = useState("");
  const [area, setArea] = useState("");
  const [responsable, setResponsable] = useState("");
  const upd = useUpdateUsuario();

  useEffect(() => {
    if (activo) {
      setUsuario(activo.usuario);
      setArea(activo.area);
      setResponsable(activo.responsable);
    }
  }, [activo]);

  const guardar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activo) return;
    upd.mutate(
      { id: activo.id, usuario: usuario.trim().toUpperCase(), area: area.trim().toUpperCase(), responsable: responsable.trim().toUpperCase() },
      {
        onSuccess: () => { toast.success(`Usuario de ${activo.id} actualizado`); onClose(); },
        onError: () => toast.error("No se pudo actualizar el usuario"),
      },
    );
  };

  return (
    <Dialog open={!!activo} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Actualizar usuario · {activo?.id}</DialogTitle>
        </DialogHeader>
        {activo && (
          <form onSubmit={guardar} className="space-y-3">
            <p className="text-sm text-muted-foreground">{activo.tipo} · {activo.marca} {activo.modelo} · {activo.serie || "sin serie"}</p>
            <div className="grid gap-1.5">
              <Label htmlFor="u-usuario">Usuario</Label>
              <Input id="u-usuario" list="u-usuarios" value={usuario} onChange={(e) => setUsuario(e.target.value)} autoFocus />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="u-area">Área</Label>
              <Input id="u-area" value={area} onChange={(e) => setArea(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="u-resp">Responsable</Label>
              <Input id="u-resp" list="u-usuarios" value={responsable} onChange={(e) => setResponsable(e.target.value)} />
            </div>
            <datalist id="u-usuarios">{usuarios.map((v) => <option key={v} value={v} />)}</datalist>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={upd.isPending}>Guardar</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
