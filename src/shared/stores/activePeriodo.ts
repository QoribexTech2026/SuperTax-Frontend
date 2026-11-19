import { create } from "zustand"
import { persist } from "zustand/middleware"

/** Periodo tributario habitual: el mes anterior (se declara el mes cerrado). */
function periodoPorDefecto(): string {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - 1)
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`
}

interface ActivePeriodoState {
  /** Periodo activo `AAAAMM`, o `null` = sin fijar (cada vista usa su defecto). */
  periodo: string | null
  setPeriodo: (periodo: string | null) => void
}

/**
 * Periodo tributario global. Es contexto de trabajo (como estudio/empresa): un
 * contador trabaja "el periodo X" en varios módulos. Prefija el periodo al crear
 * conciliaciones SIRE y el rango por defecto en Correos. Persiste entre recargas.
 */
export const useActivePeriodo = create<ActivePeriodoState>()(
  persist(
    (set) => ({
      periodo: periodoPorDefecto(),
      setPeriodo: (periodo) => set({ periodo }),
    }),
    { name: "plataforma.activePeriodo" },
  ),
)
