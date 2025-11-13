"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTheme } from "@/hooks/use-theme"
import { apiClient } from "@/lib/api-client"; // Importa o API Client
import {
  Activity,
  Component,
  Container,
  Layers,
  LayoutDashboard,
  Loader2,
  Menu,
  Save,
  Settings,
  Users,
  X
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

// Tipo para as variáveis globais, baseado no Prisma
interface GlobalEnv {
  id: string
  key: string
  value: string
}

// Tipo para as configurações gerais
interface GeneralSettings {
  systemName: string
  adminEmail: string
  updatedAt: string // Armazenaremos a data formatada
}

const navigationItems = [
  { icon: LayoutDashboard, label: "Painel", href: "/" },
  { icon: Container, label: "Containers", href: "/containers" },
  { icon: Layers, label: "Módulos", href: "/modules" },
  { icon: Component, label: "Instâncias", href: "/instances" }, // 2. Adicionar novo item
  { icon: Users, label: "Clientes", href: "/clients", active: true },
  { icon: Users, label: "Usuários", href: "/users" },
  { icon: Settings, label: "Configuração", href: "/settings" },
]

// Helper para formatar data
const formatDate = (dateString: Date | string) => {
  if (!dateString) return "N/A"
  return new Date(dateString).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { theme, toggleTheme, mounted } = useTheme()

  // --- Estados para dados da API ---
  const [settingsId, setSettingsId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Estado para a Tab 1 "Geral"
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    systemName: "",
    adminEmail: "",
    updatedAt: "",
  })

  // Estado para a Tab 2 "Variáveis Globais"
  const [globalEnvs, setGlobalEnvs] = useState<GlobalEnv[]>([])
  // ---------------------------------

  // Função para carregar os dados
  const fetchSettings = async () => {
    setIsLoading(true)
    try {
      // Assumindo que apiClient.getSettings() existe
      const settingsData = await apiClient.getSettings()

      setSettingsId(settingsData.id)
      setGeneralSettings({
        systemName: settingsData.systemName,
        adminEmail: settingsData.adminEmail,
        updatedAt: formatDate(settingsData.updatedAt),
      })
      setGlobalEnvs(settingsData.globalEnv || [])
    } catch (error) {
      console.error("Falha ao carregar configurações:", error)
      // TODO: Adicionar toast de erro
    } finally {
      setIsLoading(false)
    }
  }

  // Carrega os dados no mount
  useEffect(() => {
    fetchSettings()
  }, [])

  // Atualiza o estado da Tab 1
  const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setGeneralSettings((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Atualiza o estado da Tab 2
  const handleGlobalVarChange = (index: number, value: string) => {
    setGlobalEnvs((prevEnvs) =>
      prevEnvs.map((env, i) => (i === index ? { ...env, value } : env))
    )
  }

  // Função ÚNICA de salvamento para ambas as abas
  const handleSaveSettings = async () => {
    if (!settingsId) {
      console.error("ID das Configurações não encontrado.")
      // TODO: Toast de erro
      return
    }

    setIsSubmitting(true)
    try {
      // O backend (UpdateSettingsSchema) espera este payload:
      const payload = {
        systemName: generalSettings.systemName,
        adminEmail: generalSettings.adminEmail,
        // O backend espera um array de { key, value }
        globalEnvs: globalEnvs.map((env) => ({
          key: env.key,
          value: env.value,
        })),
      }

      // Assumindo que apiClient.updateSettings(id, data) existe
      await apiClient.updateSettings(settingsId, payload)

      // Recarrega os dados para pegar a nova data de "updatedAt"
      await fetchSettings()
      // TODO: Adicionar toast de sucesso
    } catch (error) {
      console.error("Falha ao salvar configurações:", error)
      // TODO: Adicionar toast de erro
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`bg-sidebar border-r border-sidebar-border transition-all duration-300 ${sidebarOpen ? "w-64" : "w-20"
          } flex flex-col`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-primary-foreground" />
            </div>
            {sidebarOpen && <span className="text-sidebar-foreground font-bold text-lg">GPON</span>}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-2">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${item.active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="mx-3 mb-6 p-2 hover:bg-sidebar-accent rounded-lg text-sidebar-foreground"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-6 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
              <p className="text-muted-foreground">Gerenciar configurações globais do sistema</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-w-6xl space-y-6">
          <Tabs defaultValue="general" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">Geral</TabsTrigger>
              <TabsTrigger value="variables">Variáveis Globais</TabsTrigger>
            </TabsList>

            {/* General Settings */}
            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Informações do Sistema</CardTitle>
                  <CardDescription>Configuração geral e detalhes do sistema</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Nome do Sistema</label>
                          <input
                            type="text"
                            name="systemName" // Nome do campo no estado
                            value={generalSettings.systemName}
                            onChange={handleGeneralChange}
                            disabled={isSubmitting}
                            className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground disabled:opacity-50"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Email do Administrador</label>
                          <input
                            type="email"
                            name="adminEmail" // Nome do campo no estado
                            value={generalSettings.adminEmail}
                            onChange={handleGeneralChange}
                            disabled={isSubmitting}
                            className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground disabled:opacity-50"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Versão do Sistema</label>
                          <input
                            type="text"
                            value="v1.0.0" // Este campo não vem da API
                            disabled
                            className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-muted-foreground"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Última Atualização</label>
                          <input
                            type="text"
                            value={generalSettings.updatedAt} // Valor da API
                            disabled
                            className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-muted-foreground"
                          />
                        </div>
                      </div>

                      <div className="flex gap-4 pt-4">
                        <Button className="gap-2" onClick={handleSaveSettings} disabled={isSubmitting || isLoading}>
                          {isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          Salvar Alterações
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Global Variables Tab */}
            <TabsContent value="variables" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Variáveis Globais de Configuração</CardTitle>
                  <CardDescription>Gerenciar variáveis de ambiente do sistema</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      {globalEnvs.map((env, index) => (
                        <div key={env.id} className="space-y-2 p-4 rounded-lg bg-secondary">
                          <label className="text-sm font-medium text-foreground">{env.key}</label>
                          <input
                            type="text"
                            value={env.value}
                            onChange={(e) => handleGlobalVarChange(index, e.target.value)}
                            disabled={isSubmitting}
                            className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground disabled:opacity-50"
                          />
                        </div>
                      ))}
                      <Button className="gap-2 w-full" onClick={handleSaveSettings} disabled={isSubmitting || isLoading}>
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Salvar Variáveis Globais
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}