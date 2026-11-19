import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Download, Eye, Inbox, Plus, RotateCcw, Search } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"

import { descargarCsv, descargarReporte, listJobs, resumeJob } from "@/features/sire/api"
import { JobQuickView } from "@/features/sire/JobQuickView"
import { StatusBadge } from "@/features/sire/StatusBadge"
import { apiError } from "@/shared/lib/api/error"
import { formatFecha, formatPeriodo } from "@/shared/lib/format"
import { useActiveCompany } from "@/shared/stores/activeCompany"
import { AsyncBoundary } from "@/shared/ui/async-boundary"
import { Button, buttonVariants } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"
import { DataTable } from "@/shared/ui/data-table"
import { EmptyState } from "@/shared/ui/empty-state"
import { Input } from "@/shared/ui/input"
import { Select } from "@/shared/ui/select"
import { TableToolbar } from "@/shared/ui/table-toolbar"

import type { JobStatus, ReconciliationJob } from "@/shared/types"
import type { ColumnDef } from "@tanstack/react-table"

const FILTRO_ESTADO: { value: JobStatus | "todos"; label: string }[] = [
  { value: "todos", label: "Todos los estados" },
  { value: "en_cola", label: "En cola" },
  { value: "procesando", label: "Procesando" },
  { value: "completado", label: "Completado" },
  { value: "error", label: "Error" },
]

export function JobsPage() {
  const companyId = useActiveCompany((s) => s.companyId)
  const queryClient = useQueryClient()
  const [estado, setEstado] = useState<JobStatus | "todos">("todos")
  const [busqueda, setBusqueda] = useState("")
  const [abierto, setAbierto] = useState<ReconciliationJob | null>(null)

  const jobs = useQuery({
    queryKey: ["sire", "jobs", companyId],
    queryFn: listJobs,
    enabled: companyId != null,
    refetchInterval: (query) =>
      query.state.data?.some((j) => j.status === "en_cola" || j.status === "procesando") ? 5000 : false,
  })

  const resume = useMutation({
    mutationFn: resumeJob,
    onSuccess: () => {
      toast.success("Conciliación reencolada")
      queryClient.invalidateQueries({ queryKey: ["sire", "jobs"] })
    },
    onError: (err) => toast.error(apiError(err, "No se pudo reanudar")),
  })

  const bajarReporte = useMutation({
    mutationFn: descargarReporte,
    onError: (err) => toast.error(apiError(err, "No se pudo descargar")),
  })

  const columnas: ColumnDef<ReconciliationJob>[] = [
    { header: "#", cell: ({ row }) => <span className="font-mono text-xs">#{row.original.id}</span> },
    { header: "Periodo", cell: ({ row }) => <span className="font-medium tabular-nums">{formatPeriodo(row.original.periodo)}</span> },
    { header: "Libro", cell: ({ row }) => <span className="capitalize">{row.original.tipo_libro}</span> },
    { header: "Archivo", cell: ({ row }) => <span className="block max-w-[180px] truncate text-xs text-muted-foreground">{row.original.empresa_filename ?? "—"}</span> },
    { header: "Estado", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { header: "Creado", cell: ({ row }) => <span className="text-muted-foreground">{formatFecha(row.original.created_at)}</span> },
    {
      header: "",
      id: "acciones",
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button size="icon" variant="ghost" aria-label="Ver detalle" onClick={() => setAbierto(row.original)}>
            <Eye className="size-4" />
          </Button>
          {row.original.has_report ? (
            <Button size="icon" variant="ghost" aria-label="Descargar reporte" onClick={() => bajarReporte.mutate(row.original.id)}>
              <Download className="size-4" />
            </Button>
          ) : null}
          {row.original.status === "error" ? (
            <Button size="icon" variant="ghost" aria-label="Reanudar" onClick={() => resume.mutate(row.original.id)}>
              <RotateCcw className="size-4" />
            </Button>
          ) : null}
        </div>
      ),
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
          title="Aún no hay conciliaciones"
          description="Crea tu primera conciliación para comparar tu registro contra la propuesta de SUNAT."
          action={
            <Link to="/sire/nueva" className={buttonVariants()}>
              <Plus className="size-4" />
              Nueva conciliación
            </Link>
          }
        />
      }
    >
      {(data) => {
        const q = busqueda.trim().toLowerCase()
        const filtrados = [...data]
          .sort((a, b) => b.id - a.id)
          .filter((j) => {
            if (estado !== "todos" && j.status !== estado) return false
            if (q) {
              const texto = `${j.periodo} ${j.empresa_filename ?? ""} ${j.tipo_libro}`.toLowerCase()
              if (!texto.includes(q)) return false
            }
            return true
          })
        return (
          <div className="space-y-4">
            <TableToolbar
              actions={
                <Link to="/sire/nueva" className={buttonVariants()}>
                  <Plus className="size-4" />
                  Nueva conciliación
                </Link>
              }
            >
              <Select
                aria-label="Filtrar por estado"
                className="w-auto"
                value={estado}
                onChange={(e) => setEstado(e.target.value as JobStatus | "todos")}
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
                  placeholder="Buscar periodo o archivo…"
                  className="h-9 w-56 pl-8"
                />
              </div>
            </TableToolbar>
            <Card>
              <CardContent className="p-0">
                <DataTable
                  columns={columnas}
                  data={filtrados}
                  getRowId={(j) => String(j.id)}
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
    {abierto ? (
      <JobQuickView
        job={abierto}
        onClose={() => setAbierto(null)}
        onResume={(id) => resume.mutate(id)}
        onReporte={(id) => bajarReporte.mutate(id)}
        onCsv={(id, esc) => {
          descargarCsv(id, esc).catch((e) => toast.error(apiError(e, "No se pudo descargar")))
        }}
        resumePending={resume.isPending}
      />
    ) : null}
    </>
  )
}
