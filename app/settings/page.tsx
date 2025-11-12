"use client"

import { useState } from "react"
import Link from "next/link"
import { LayoutDashboard, Container, Layers, Users, Settings, Activity, Menu, X, Save, Moon, Sun } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTheme } from "@/hooks/use-theme"

const navigationItems = [
  { icon: LayoutDashboard, label: "Painel", href: "/" },
  { icon: Container, label: "Containers", href: "/containers" },
  { icon: Layers, label: "Módulos", href: "/modules" },
  { icon: Users, label: "Clientes", href: "/clients" },
  { icon: Users, label: "Usuários", href: "/users" },
  { icon: Settings, label: "Configuração", href: "/settings", active: true },
]

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { theme, toggleTheme, mounted } = useTheme()

  const [globalVars, setGlobalVars] = useState({
    MANAGER_API_URL: "http://localhost:3000/api",
    GPON_TIMEOUT: "30000",
    MAX_RETRIES: "3",
    LOG_LEVEL: "info",
    ENABLE_MONITORING: "true",
  })

  const handleUpdateGlobalVar = (key: string, value: string) => {
    setGlobalVars((prev) => ({ ...prev, [key]: value }))
  }

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
            {sidebarOpen && <span className="text-sidebar-foreground font-bold text-lg">GPON</span>}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-2">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                item.active
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
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nome do Sistema</label>
                      <input
                        type="text"
                        value="GPON Monitoring Manager"
                        className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email do Administrador</label>
                      <input
                        type="email"
                        value="admin@gpon.local"
                        className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Versão do Sistema</label>
                      <input
                        type="text"
                        value="v3.2.1"
                        disabled
                        className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-muted-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Última Atualização</label>
                      <input
                        type="text"
                        value="2024-11-03 14:30:00 UTC"
                        disabled
                        className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-muted-foreground"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fuso Horário do Sistema</label>
                    <select className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground">
                      <option>UTC</option>
                      <option>America/Sao_Paulo</option>
                      <option>America/Rio_Branco</option>
                      <option>America/Bahia</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Idioma do Sistema</label>
                    <select className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground">
                      <option>English</option>
                      <option>Português (Brasil)</option>
                      <option>Español</option>
                    </select>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button className="gap-2">
                      <Save className="w-4 h-4" />
                      Salvar Alterações
                    </Button>
                    <Button variant="outline">Restaurar Padrões</Button>
                  </div>
                </CardContent>
              </Card>

              {/* Theme Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Configurações de Tema</CardTitle>
                  <CardDescription>Personalizar a aparência da sua interface</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-secondary">
                    <div className="flex items-center gap-3">
                      {theme === "dark" ? (
                        <Moon className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <Sun className="w-5 h-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium text-foreground">Modo Escuro/Claro</p>
                        <p className="text-sm text-muted-foreground">
                          Atualmente em modo {mounted ? (theme === "dark" ? "ESCURO" : "CLARO") : "..."}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={toggleTheme}
                      disabled={!mounted}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                        theme === "dark" ? "bg-primary" : "bg-secondary"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                          theme === "dark" ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
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
                  {Object.entries(globalVars).map(([key, value]) => (
                    <div key={key} className="space-y-2 p-4 rounded-lg bg-secondary">
                      <label className="text-sm font-medium text-foreground">{key}</label>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handleUpdateGlobalVar(key, e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground"
                      />
                    </div>
                  ))}
                  <Button className="gap-2 w-full">
                    <Save className="w-4 h-4" />
                    Salvar Variáveis Globais
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
