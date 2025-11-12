"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Container, Layers, Users, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const navigationItems = [
  { icon: LayoutDashboard, label: "Painel", href: "/" },
  { icon: Container, label: "Containers", href: "/containers" },
  { icon: Layers, label: "Módulos", href: "/modules" },
  { icon: Users, label: "Clientes", href: "/clients" },
  { icon: Users, label: "Usuários", href: "/users" },
  { icon: Settings, label: "Configuração", href: "/settings" },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="space-y-2 px-3">
      {navigationItems.map((item) => (
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
