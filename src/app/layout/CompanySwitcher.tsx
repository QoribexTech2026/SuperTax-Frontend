import { Plus } from "lucide-react"
import { useState } from "react"

import { AgregarEmpresaDialog } from "@/features/company/AgregarEmpresaDialog"
import { useActiveCompany } from "@/shared/stores/activeCompany"
import { useActiveEstudio } from "@/shared/stores/activeEstudio"
import { useAuthStore } from "@/shared/stores/auth"
import { Button } from "@/shared/ui/button"
import { Select } from "@/shared/ui/select"

/** Selector de empresa activa (Modelo B): un usuario opera varias empresas. */
export function CompanySwitcher() {
  // Se selecciona el usuario (referencia estable) y se deriva el array fuera del
  // selector: devolver `?? []` dentro del selector crea un array nuevo en cada
  // render y provoca un bucle infinito en useSyncExternalStore (React #185).
  const user = useAuthStore((s) => s.user)
  const companies = user?.companies ?? []
  const estudios = user?.estudios ?? []
  const estudioId = useActiveEstudio((s) => s.estudioId)
  const companyId = useActiveCompany((s) => s.companyId)
  const setCompanyId = useActiveCompany((s) => s.setCompanyId)
  const [agregando, setAgregando] = useState(false)

  // Con un estudio activo se muestran solo sus empresas; sin él, todas (compat).
  const visibles =
    estudioId != null ? companies.filter((c) => c.estudio_id === estudioId) : companies

  // Solo un admin del estudio activo puede agregar empresas (gestiona tenencia).
  const esAdminActivo =
    estudioId != null
      ? (estudios.find((e) => e.id === estudioId)?.es_admin ?? false)
      : estudios.some((e) => e.es_admin)

  return (
    <div className="flex items-center gap-2">
      {visibles.length > 0 ? (
        <Select
          aria-label="Empresa activa"
          className="max-w-[18rem]"
          value={companyId ?? ""}
          onChange={(e) => setCompanyId(Number(e.target.value))}
        >
          {visibles.map((c) => (
            <option key={c.id} value={c.id}>
              {c.razon_social} — {c.ruc}
            </option>
          ))}
        </Select>
      ) : (
        <span className="text-sm text-muted-foreground">Sin empresas aún</span>
      )}

      {esAdminActivo && (
        <Button
          size="icon"
          variant="outline"
          onClick={() => setAgregando(true)}
          aria-label="Agregar empresa"
          title="Agregar empresa"
        >
          <Plus className="size-4" />
        </Button>
      )}

      {agregando && <AgregarEmpresaDialog onClose={() => setAgregando(false)} />}
    </div>
  )
}
