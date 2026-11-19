import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Check, FileSpreadsheet, Inbox, Plus, Search, X } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"

import {
  cancelar,
  descargarReporte,
  getJobResult,
  listJobs,
  type ResultadoComprobante,
  type SunatJobItem,
  type SunatJobStatus,
} from "@/features/sunat/api"
import { ESTADO_JOB, toneComprobante } from "@/features/sunat/estados"
import { apiError } from "@/shared/lib/api/error"
import { formatFechaHora } from "@/shared/lib/format"
import { useActiveCompany } from "@/shared/stores/activeCompany"
import { AsyncBoundary } from "@/shared/ui/async-boundary"
import { Badge } from "@/shared/ui/badge"
import { Button, buttonVariants } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"
import { DataTable } from "@/shared/ui/data-table"
import { Drawer } from "@/shared/ui/drawer"
import { EmptyState } from "@/shared/ui/empty-state"
import { Input } from "@/shared/ui/input"
import { Select } from "@/shared/ui/select"
import { StatusBadge } from "@/shared/ui/status-badge"
import { TableToolbar } from "@/shared/ui/table-toolbar"

import type { ColumnDef } from "@tanstack/react-table"

const FILTRO_ESTADO: { value: SunatJobStatus | "todos"; label: string }[] = [
  { value: "todos", label: "Todos los estados" },
  { value: "en_cola", label: "En cola" },
  { value: "procesando", label: "Procesando" },
  { value: "completado", label: "Completado" },
  { value: "error", label: "Error" },
  { value: "cancelado", label: "Cancelado" },
]

/** Marca de un comprobante: no pedido (—), presente (check) o ausente (equis). */
function Marca({ pedido, tiene }: { pedido?: boolean; tiene?: boolean }) {
  if (pedido === false) return <span className="text-muted-foreground">—</span>
  return tiene ? <Check className="size-4 text-primary" /> : <X className="size-4 text-destructive" />
}

const COLUMNAS_RESULTADO: ColumnDef<ResultadoComprobante>[] = [
  { header: "Comprobante", cell: ({ row }) => <span className="font-medium">{row.original.id}</span> },
  { header: "Emisor", cell: ({ row }) => row.original.emisor ?? "—" },
  { header: "Estado", cell: ({ row }) => <Badge tone={toneComprobante(row.original.estado)}>{row.original.estado}</Badge> },
  { header: "PDF", cell: ({ row }) => <Marca pedido={row.original.pide_pdf} tiene={row.original.pdf} /> },
  { header: "XML", cell: ({ row }) => <Marca pedido={row.original.pide_xml} tiene={row.original.xml} /> },
  {
    header: "Descripción",
    cell: ({ row }) => (
      <span className="block max-w-[24rem] text-xs text-muted-foreground">{row.original.descripcion ?? "—"}</span>
    ),
  },
]

function ResultadosDelJob({ jobId }: { jobId: string }) {
  const resultados = useQuery({
    queryKey: ["sunat", "job-result", jobId],
    queryFn: () => getJobResult(jobId),
  })
  return (
    <AsyncBoundary
      query={resultados}
      isEmpty={(d) => d.length === 0}
      empty={<p className="text-sm text-muted-foreground">Sin comprobantes en este job.</p>}
    >
      {(data) => <DataTable columns={COLUMNAS_RESULTADO} data={data} getRowId={(r) => r.id} />}
    </AsyncBoundary>
  )
}

export function HistorialPage() {
  const companyId = useActiveCompany((s) => s.companyId)
  const queryClient = useQueryClient()
  const [abierto, setAbierto] = useState<string | null>(null)
  const [estado, setEstado] = useState<SunatJobStatus | "todos">("todos")
  const [busqueda, setBusqueda] = useState("")

  const jobs = useQuery({
    queryKey: ["sunat", "jobs", companyId],
    queryFn: listJobs,
    enabled: companyId != null,
    refetchInterval: (query) =>
      query.state.data?.some((j) => j.status === "en_cola" || j.status === "procesando") ? 5000 : false,
  })

  const exportar = async (jobId: string) => {
    try {
      await descargarReporte(jobId)
    } catch (e) {
      toast.error(apiError(e, "No se pudo exportar el reporte"))
    }
  }

  const cancelarJob = useMutation({
    mutationFn: cancelar,
    onSuccess: () => {
      toast.success("Descarga cancelada")
      queryClient.invalidateQueries({ queryKey: ["sunat", "jobs"] })
    },
    onError: (err) => toast.error(apiError(err, "No se pudo cancelar")),
  })

  const columnas: ColumnDef<SunatJobItem>[] = [
    { header: "Job", cell: ({ row }) => <span className="block max-w-[220px] truncate font-mono text-xs">{row.original.job_id}</span> },
    { header: "Estado", cell: ({ row }) => <StatusBadge value={row.original.status} map={ESTADO_JOB} /> },
    { header: "Fecha", cell: ({ row }) => <span className="text-muted-foreground">{formatFechaHora(row.original.created_at)}</span> },
    {
      header: "",
      id: "acciones",
      cell: ({ row }) => {
        const job = row.original
        const enCurso = job.status === "en_cola" || job.status === "procesando"
        return (
          <div className="flex justify-end gap-1">
            {job.has_result ? (
              <>
                <Button size="icon" variant="ghost" aria-label="Descargar Excel" title="Descargar Excel" onClick={() => exportar(job.job_id)}>
                  <FileSpreadsheet className="size-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => setAbierto(job.job_id)}>
                  Ver resultados
                </Button>
              </>
            ) : null}
            {enCurso ? (
              <Button size="sm" variant="ghost" disabled={cancelarJob.isPending} onClick={() => cancelarJob.mutate(job.job_id)}>
                Cancelar
              </Button>
            ) : null}
          </div>
        )
      },
    },
  ]

  return (
    <>
      <AsyncBoundary
        query={jobs}
        isEmpty={(d) => d.length === 0}
        empty={
          <EmptyState
            icon={Inbox}
            title="Aún no hay descargas"
            description="Cuando ejecutes una descarga, aparecerá aquí con su estado y resultados."
            action={
              <Link to="/sunat" className={buttonVariants()}>
                Nueva descarga
              </Link>
            }
          />
        }
      >
        {(data) => {
          const q = busqueda.trim().toLowerCase()
          const filtrados = data.filter((j) => {
            if (estado !== "todos" && j.status !== estado) return false
            if (q && !j.job_id.toLowerCase().includes(q)) return false
            return true
          })
          return (
            <div className="space-y-4">
              <TableToolbar
                actions={
                  <Link to="/sunat" className={buttonVariants()}>
                    <Plus className="size-4" />
                    Nueva descarga
                  </Link>
                }
              >
                <Select
                  aria-label="Filtrar por estado"
                  className="w-auto"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value as SunatJobStatus | "todos")}
                >
                  {FILTRO_ESTADO.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar job…"
                    className="h-9 w-56 pl-8"
                  />
                </div>
              </TableToolbar>
              <Card>
                <CardContent className="p-0">
                  <DataTable
                    columns={columnas}
                    data={filtrados}
                    getRowId={(j) => j.job_id}
                    empty={
                      <p className="p-6 text-center text-sm text-muted-foreground">
                        Ningún job con esos filtros.
                      </p>
                    }
                  />
                </CardContent>
              </Card>
            </div>
          )
        }}
      </AsyncBoundary>

      <Drawer
        open={abierto != null}
        onClose={() => setAbierto(null)}
        title={abierto ? `Resultados · ${abierto.slice(0, 12)}…` : ""}
        className="max-w-2xl"
        footer={
          abierto ? (
            <Button variant="outline" size="sm" onClick={() => exportar(abierto)}>
              <FileSpreadsheet className="size-4" />
              Descargar Excel
            </Button>
          ) : null
        }
      >
        {abierto ? <ResultadosDelJob jobId={abierto} /> : null}
      </Drawer>
    </>
  )
}
