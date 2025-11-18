"use client"

import type React from "react"

import { useAuth } from "@/app/auth-context"
import { SidebarNav } from "@/components/layout/sidebar-nav"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api-client"
import { Activity, LogOut } from "lucide-react"
import { useEffect, useState } from "react"
import { UserProfileModal } from "../modals/users/user-profile-modal"

interface ProtectedLayoutProps {
  children: React.ReactNode
  title: string
  description?: string
}

export function ProtectedLayout({ children, title, description }: ProtectedLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { userCan, user, logout } = useAuth()
  const [systemName, setSystemName] = useState("GPON")
  
  // Estado para controlar o modal de perfil
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  // Busca nome do sistema
  useEffect(() => {
    const fetchSettings = async () => {
      if (userCan("read:settings")) {
        try {
          const data = await apiClient.getSettings()
          if (data?.systemName) setSystemName(data.systemName)
        } catch (error) {
          console.error("Erro ao buscar settings:", error)
        }
      } else {
        setSystemName("GPON Manager")
      }
    }
    fetchSettings()
  }, [userCan]) // Adicionei userCan nas deps para evitar warnings

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`bg-sidebar border-r border-sidebar-border transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-20"
        } flex flex-col`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-primary-foreground" />
            </div>
            {sidebarOpen && <span className="text-sidebar-foreground font-bold text-lg">{systemName}</span>}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-auto">{sidebarOpen && <SidebarNav />}</div>

        {/* User Info and Logout */}
        <div className="border-t border-sidebar-border p-4 space-y-3">
          {sidebarOpen && (
            // Transformei a div em um elemento clicável/interativo
            <div 
              className="px-2 text-sm cursor-pointer hover:bg-sidebar-accent rounded-md p-2 transition-colors group"
              onClick={() => setIsProfileModalOpen(true)}
              title="Clique para ver perfil e alterar senha"
            >
              <p className="font-medium text-sidebar-foreground truncate group-hover:text-accent-foreground">
                {user?.name}
              </p>
              <p className="text-sidebar-foreground/70 text-xs truncate group-hover:text-accent-foreground/80">
                {user?.email}
              </p>
              <Badge variant="outline" className="mt-2 text-xs bg-background/50 group-hover:bg-background">
                {user?.role.name === "ADMIN" ? "Administrador" : user?.role.name === "OPERATOR" ? "Operador" : "Visualizador"}
              </Badge>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <LogOut className="w-4 h-4" />
            {sidebarOpen && <span className="ml-2">Sair</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-6 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{title}</h1>
              {description && <p className="text-muted-foreground">{description}</p>}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-accent/10">
                Autenticado
              </Badge>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">{children}</div>
        </div>
      </main>

      {/* Modal de Perfil (Renderizado fora do fluxo principal) */}
      <UserProfileModal 
        open={isProfileModalOpen} 
        onOpenChange={setIsProfileModalOpen} 
      />
    </div>
  )
}