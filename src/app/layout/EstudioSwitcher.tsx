import { Building2, Plus } from "lucide-react"
import { useEffect, useState } from "react"

import { CrearEstudioDialog } from "@/features/company/CrearEstudioDialog"
import { useActiveCompany } from "@/shared/stores/activeCompany"
import { useActiveEstudio } from "@/shared/stores/activeEstudio"
import { useAuthStore } from "@/shared/stores/auth"
import { Button } from "@/shared/ui/button"

/** Selector de estudio activo (multi-estudio). Con varios estudios muestra un
 * <select>; con uno solo, una etiqueta con su nombre (para que siempre se vea en
 * qué estudio se trabaja). El botón "Crear estudio" solo aparece para admins. Al
 * cambiar de estudio, fija como empresa activa la primera de él. */
export function EstudioSwitcher() {
  // Se selecciona el usuario (referencia estable) y se derivan los arrays fuera
  // del selector para no crear uno nuevo en cada render (React #185).
  const user = useAuthStore((s) => s.user)
  const estudios = user?.estudios ?? []
  const companies = user?.companies ?? []
  const estudioId = useActiveEstudio((s) => s.estudioId)
  const setEstudioId = useActiveEstudio((s) => s.setEstudioId)
  const companyId = useActiveCompany((s) => s.companyId)
  const setCompanyId = useActiveCompany((s) => s.setCompanyId)
  const [creando, setCreando] = useState(false)

  // Mantiene coherentes el estudio y la empresa activos: el estudio debe existir, y
  // la empresa activa debe pertenecer a ese estudio. Sin el paso 2, un `companyId`
  // persistido de OTRO estudio sigue activo al cambiar de estudio y "filtra" sus
  // módulos al sidebar (bug de parpadeo en un estudio sin empresas).
  useEffect(() => {
    if (estudios.length === 0) return
    // 1. Estudio activo válido; si no, el de la empresa activa o el primero.
    let activo = estudioId
    if (activo == null || !estudios.some((e) => e.id === activo)) {
      const empresaActiva = companies.find((c) => c.id === companyId)
      const preferido = empresaActiva?.estudio_id ?? null
      activo =
        preferido != null && estudios.some((e) => e.id === preferido) ? preferido : estudios[0].id
      setEstudioId(activo)
    }
    // 2. La empresa activa debe pertenecer al estudio activo; si no, la primera de
    //    ese estudio (o ninguna si aún no tiene empresas).
    if (!companies.some((c) => c.id === companyId && c.estudio_id === activo)) {
      const primera = companies.find((c) => c.estudio_id === activo)
      const nuevo = primera ? primera.id : null
      if (nuevo !== companyId) setCompanyId(nuevo)
    }
  }, [estudios, estudioId, companies, companyId, setEstudioId, setCompanyId])

  const cambiarEstudio = (id: number) => {
    setEstudioId(id)
    const primera = companies.find((c) => c.estudio_id === id)
    setCompanyId(primera ? primera.id : null)
  }

  return (
    <div className="flex items-center gap-2">
      {estudios.length > 1 ? (
        <select
          aria-label="Estudio activo"
          className="max-w-[14rem] truncate rounded-md border bg-background px-3 py-1.5 text-sm"
          value={estudioId ?? ""}
          onChange={(e) => cambiarEstudio(Number(e.target.value))}
        >
          {estudios.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nombre}
            </option>
          ))}
        </select>
      ) : estudios.length === 1 ? (
        <span className="inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-sm text-muted-foreground">
          <Building2 className="size-4 shrink-0" />
          <span className="max-w-[14rem] truncate">{estudios[0].nombre}</span>
        </span>
      ) : null}

      {estudios.some((e) => e.es_admin) && (
        <Button size="sm" variant="outline" onClick={() => setCreando(true)}>
          <Plus className="size-4" />
          Estudio
        </Button>
      )}

      {creando && <CrearEstudioDialog onClose={() => setCreando(false)} />}
    </div>
  )
}
