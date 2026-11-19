import {
  Database,
  Download,
  FileSpreadsheet,
  Landmark,
  LayoutDashboard,
  LifeBuoy,
  Mail,
  ScanLine,
  Settings,
} from "lucide-react"
import { NavLink } from "react-router-dom"

import { useActivity } from "@/app/layout/useActivity"
import { cn } from "@/shared/lib/utils"
import { useActiveCompany } from "@/shared/stores/activeCompany"
import { useActiveEstudio } from "@/shared/stores/activeEstudio"
import { useAuthStore } from "@/shared/stores/auth"

import type { LucideIcon } from "lucide-react"

type NavGroup = "principal" | "operacion" | "gestion"

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  visible: boolean
  group: NavGroup
  badge?: number
}

function useNavItems(): NavItem[] {
  const user = useAuthStore((s) => s.user)
  const companyId = useActiveCompany((s) => s.companyId)
  const estudioId = useActiveEstudio((s) => s.estudioId)
  // La empresa activa solo cuenta si pertenece al estudio activo: así un companyId
  // persistido de otro estudio no "filtra" sus módulos mientras se reconcilia.
  const empresa = user?.companies.find((c) => c.id === companyId && c.estudio_id === estudioId)
  const modulos = empresa?.modules ?? []
  const actividad = useActivity()
  // Admin del estudio activo: puede administrar aunque el estudio aún no tenga una
  // empresa activa (si no, un estudio recién creado perdería el acceso a /admin).
  const esAdminEstudio = user?.estudios?.some((e) => e.id === estudioId && e.es_admin) ?? false
  const puedeAdministrar =
    (user?.is_platform_admin ?? false) || empresa?.role_key === "admin_empresa" || esAdminEstudio

  return [
    { to: "/dashboard", label: "Inicio", icon: LayoutDashboard, visible: true, group: "principal" },
    {
      to: "/sire",
      label: "SIRE",
      icon: FileSpreadsheet,
      visible: modulos.includes("sire"),
      group: "operacion",
      badge: actividad.sire.activos,
    },
    {
      to: "/sunat",
      label: "SUNAT",
      icon: Download,
      visible: modulos.includes("sunat"),
      group: "operacion",
      badge: actividad.sunat.activos,
    },
    { to: "/scanner", label: "Escaneo", icon: ScanLine, visible: modulos.includes("scanner"), group: "operacion" },
    {
      to: "/datafilter",
      label: "DataFilter",
      icon: Database,
      visible: modulos.includes("datafilter"),
      group: "operacion",
    },
    {
      to: "/correos",
      label: "Correos",
      icon: Mail,
      visible: modulos.includes("correos"),
      group: "operacion",
    },
    {
      to: "/soporte",
      label: "Soporte",
      icon: LifeBuoy,
      visible: (user?.is_platform_admin ?? false) || companyId != null,
      group: "gestion",
    },
    { to: "/admin", label: "Administración", icon: Settings, visible: puedeAdministrar, group: "gestion" },
  ]
}

const GRUPOS: { id: NavGroup; label: string | null }[] = [
  { id: "principal", label: null },
  { id: "operacion", label: "Operación" },
  { id: "gestion", label: "Gestión" },
]

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const items = useNavItems().filter((item) => item.visible)
  return (
    <>
      <div className="flex h-16 items-center gap-2 px-6">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Landmark className="size-4" />
        </span>
        <span className="text-lg font-semibold tracking-tight">SuperTax</span>
      </div>
      <nav className="flex flex-col gap-4 px-3">
        {GRUPOS.map((grupo) => {
          const delGrupo = items.filter((item) => item.group === grupo.id)
          if (delGrupo.length === 0) return null
          return (
            <div key={grupo.id} className="flex flex-col gap-1">
              {grupo.label ? (
                <p className="px-3 pb-0.5 text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/40">
                  {grupo.label}
                </p>
              ) : null}
              {delGrupo.map(({ to, label, icon: Icon, badge }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onNavigate}
                  end={to === "/dashboard"}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50",
                    )
                  }
                >
                  <Icon className="size-4" />
                  {label}
                  {badge ? (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                      {badge}
                    </span>
                  ) : null}
                </NavLink>
              ))}
            </div>
          )
        })}
      </nav>
    </>
  )
}

/** Sidebar estático (escritorio). */
export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
      <SidebarContent />
    </aside>
  )
}

/** Drawer del sidebar en móvil. */
export function SidebarDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 md:hidden" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <aside
        className="absolute left-0 top-0 flex h-full w-60 flex-col bg-sidebar text-sidebar-foreground shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <SidebarContent onNavigate={onClose} />
      </aside>
    </div>
  )
}
