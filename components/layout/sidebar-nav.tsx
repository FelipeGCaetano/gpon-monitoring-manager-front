"use client"

import { useAuth } from "@/app/auth-context"
import { cn } from "@/lib/utils"
import { Blocks, Component, Container, HardDrive, Layers, LayoutDashboard, Settings, Users } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navigationItems = [
  { icon: Blocks, label: "Projetos", href: "/projects", permission: "read:projects" },
  { icon: LayoutDashboard, label: "Painel", href: "/", permission: "read:dashboard" },
  { icon: Container, label: "Containers", href: "/containers", permission: "read:containers" },
  { icon: Layers, label: "Módulos", href: "/modules", permission: "read:modules" },
  { icon: Component, label: "Instâncias", href: "/instances", permission: "read:instances" },
  { icon: HardDrive, label: "Templates", href: "/image-templates", permission: "read:containers:images" },
  { icon: Users, label: "Clientes", href: "/clients", permission: "read:clients" },
  { icon: Users, label: "Usuários", href: "/users", permission: "read:users:all" },
  { icon: Settings, label: "Configuração", href: "/settings", permission: "read:settings" },
]

export function SidebarNav() {
  const pathname = usePathname()
  const { userCan } = useAuth() // 3. Obter o hook

  // 4. Filtrar a lista de navegação ANTES de renderizar
  const accessibleNavItems = navigationItems.filter(
    (item) => userCan(item.permission)
  )

  return (
    <nav className="space-y-2 px-3">
      {/* 5. Mapear sobre a lista FILTRADA */}
      {accessibleNavItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
            pathname === item.href
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent",
          )}
        >
          <item.icon className="w-5 h-5 flex-shrink-0" />
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  )
}
