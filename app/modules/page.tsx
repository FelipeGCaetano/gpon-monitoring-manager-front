"use client"

import { useState } from "react"
import Link from "next/link"
import {
  LayoutDashboard,
  Container,
  Layers,
  Users,
  Settings,
  Activity,
  Menu,
  X,
  Plus,
  Trash2,
  Download,
  Edit2,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ModuleAssignmentModal from "@/components/modals/module-assignment-modal"

const modules = [
  {
    id: "gpon-core",
    name: "GPON Core",
    version: "3.2.1",
    status: "deployed",
    containers: 3,
    license: "Empresa",
    expiresIn: 245,
    deployment: "Produção",
    size: "128MB",
  },
  {
    id: "gpon-acs",
    name: "Módulo ACS",
    version: "2.5.0",
    status: "deployed",
    containers: 2,
    license: "Profissional",
    expiresIn: 120,
    deployment: "Produção",
    size: "95MB",
  },
  {
    id: "gpon-rupture",
    name: "Detecção de Ruptura",
    version: "1.8.3",
    status: "deployed",
    containers: 1,
    license: "Profissional",
    expiresIn: 340,
    deployment: "Produção",
    size: "64MB",
  },
  {
    id: "gpon-test",
    name: "Suíte de Testes",
    version: "2.1.0",
    status: "staging",
    containers: 1,
    license: "Versão Teste",
    expiresIn: 30,
    deployment: "Testes",
    size: "156MB",
  },
  {
    id: "gpon-analytics",
    name: "Engine de Análise",
    version: "1.3.5",
    status: "available",
    containers: 0,
    license: "Empresa",
    expiresIn: 180,
    deployment: "Disponível",
    size: "203MB",
  },
]

const licenses = [
  {
    id: "ent-001",
    module: "GPON Core",
    type: "Empresa",
    key: "GPON-ENT-2024-XXXXX",
    issued: "2024-01-15",
    expires: "2025-01-15",
    status: "active",
    seats: 10,
  },
  {
    id: "pro-001",
    module: "Módulo ACS",
    type: "Profissional",
    key: "GPON-PRO-2024-XXXXX",
    issued: "2023-08-20",
    expires: "2025-04-20",
    status: "active",
    seats: 5,
  },
  {
    id: "pro-002",
    module: "Detecção de Ruptura",
    type: "Profissional",
    key: "GPON-PRO-2024-XXXXX",
    issued: "2023-10-10",
    expires: "2025-10-10",
    status: "active",
    seats: 5,
  },
  {
    id: "trial-001",
    module: "Suíte de Testes",
    type: "Versão Teste",
    key: "GPON-TRIAL-2024-XXXXX",
    issued: "2024-11-03",
    expires: "2024-12-03",
    status: "expiring",
    seats: 1,
  },
]

const containerModuleMap = [
  { container: "docker-01", modules: ["gpon", "core"], id: "map-1" },
  { container: "docker-02", modules: ["acs"], id: "map-2" },
  { container: "docker-03", modules: ["rupture"], id: "map-3" },
  { container: "docker-04", modules: ["gpon"], id: "map-4" },
  { container: "docker-05", modules: ["test"], id: "map-5" },
]

const navigationItems = [
  { icon: LayoutDashboard, label: "Painel", href: "/" },
  { icon: Container, label: "Containers", href: "/containers" },
  { icon: Layers, label: "Módulos", href: "/modules", active: true },
  { icon: Users, label: "Clientes", href: "/clients" },
  { icon: Users, label: "Usuários", href: "/users" },
  { icon: Settings, label: "Configuração", href: "/settings" },
]

export default function ModulesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [selectedContainer, setSelectedContainer] = useState<any>(null)

  const handleOpenAssignment = (containerId: string) => {
    const container = containerModuleMap.find((m) => m.container === containerId)
    setSelectedContainer({ id: containerId, name: containerId, modules: container?.modules || [] })
    setShowAssignmentModal(true)
  }

  const handleSaveModuleAssignment = (moduleIds: string[]) => {
    console.log("Modules saved for", selectedContainer.id, moduleIds)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "deployed":
        return "bg-chart-4"
      case "staging":
        return "bg-chart-2"
      case "available":
        return "bg-muted"
      default:
        return "bg-secondary"
    }
  }

  const getLicenseStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-chart-4"
      case "expiring":
        return "bg-chart-3"
      case "expired":
        return "bg-destructive"
      default:
        return "bg-muted"
    }
  }

  const getDaysUntilExpiry = (days: number) => {
    if (days <= 30) return "text-destructive"
    if (days <= 90) return "text-chart-3"
    return "text-chart-4"
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
              <h1 className="text-3xl font-bold text-foreground">Módulos & Licenças</h1>
              <p className="text-muted-foreground">Gerenciar implantações de módulos e licenças</p>
            </div>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Implantar Módulo
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Tabs */}
          <Tabs defaultValue="modules" className="space-y-4">
            <TabsList>
              <TabsTrigger value="modules">Módulos</TabsTrigger>
              <TabsTrigger value="assignments">Atribuições</TabsTrigger>
            </TabsList>

            {/* Modules Tab */}
            <TabsContent value="modules" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Implantações de Módulos</CardTitle>
                  <CardDescription>Todos os módulos implantados e disponíveis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome do Módulo</TableHead>
                          <TableHead>Instancias</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {modules.map((module) => (
                          <TableRow key={module.id}>
                            <TableCell className="font-medium">{module.name}</TableCell>
                            <TableCell className="text-sm">{module.containers}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Assignments Tab */}
            <TabsContent value="assignments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Atribuições de Módulo de Container</CardTitle>
                  <CardDescription>Gerenciar quais módulos são licenciados para cada container</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Container</TableHead>
                          <TableHead>Módulos Atribuídos</TableHead>
                          <TableHead>Status de Licença</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {containerModuleMap.map((map) => (
                          <TableRow key={map.id}>
                            <TableCell className="font-medium">{map.container}</TableCell>
                            <TableCell>
                              <div className="flex gap-1 flex-wrap">
                                {map.modules.map((mod) => (
                                  <Badge key={mod} variant="secondary" className="text-xs">
                                    {mod}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-chart-4/20 text-chart-4 border-0">
                                Licenciado
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="ghost" onClick={() => handleOpenAssignment(map.container)}>
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Module Assignment Modal */}
      {selectedContainer && (
        <ModuleAssignmentModal
          container={selectedContainer}
          isOpen={showAssignmentModal}
          onClose={() => setShowAssignmentModal(false)}
          onSave={handleSaveModuleAssignment}
        />
      )}
    </div>
  )
}
