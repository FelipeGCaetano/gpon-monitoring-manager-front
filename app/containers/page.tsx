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
  Pause,
  Play,
  Eye,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import ContainerDetailsModal from "@/components/modals/container-details-modal"

const containers = [
  {
    id: "docker-01",
    name: "docker-01",
    image: "gpon-core:latest",
    status: "running",
    uptime: "45 dias",
    cpu: 68,
    memory: 82,
    network: 45,
    modules: ["gpon", "core"],
    ip: "192.168.1.100",
  },
  {
    id: "docker-02",
    name: "docker-02",
    image: "gpon-acs:latest",
    status: "running",
    uptime: "32 dias",
    cpu: 42,
    memory: 58,
    network: 32,
    modules: ["acs"],
    ip: "192.168.1.101",
  },
  {
    id: "docker-03",
    name: "docker-03",
    image: "gpon-rupture:v2.1",
    status: "running",
    uptime: "15 dias",
    cpu: 55,
    memory: 71,
    network: 28,
    modules: ["rupture"],
    ip: "192.168.1.102",
  },
  {
    id: "docker-04",
    name: "docker-04",
    image: "gpon-core:latest",
    status: "paused",
    uptime: "0 dias",
    cpu: 0,
    memory: 15,
    network: 0,
    modules: ["gpon"],
    ip: "192.168.1.103",
  },
  {
    id: "docker-05",
    name: "docker-05",
    image: "gpon-test:dev",
    status: "running",
    uptime: "8 dias",
    cpu: 35,
    memory: 48,
    network: 22,
    modules: ["test"],
    ip: "192.168.1.104",
  },
]

const navigationItems = [
  { icon: LayoutDashboard, label: "Painel", href: "/" },
  { icon: Container, label: "Containers", href: "/containers", active: true },
  { icon: Layers, label: "Módulos", href: "/modules" },
  { icon: Users, label: "Clientes", href: "/clients" },
  { icon: Users, label: "Usuários", href: "/users" },
  { icon: Settings, label: "Configuração", href: "/settings" },
]

export default function ContainersPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedContainer, setSelectedContainer] = useState<any>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "bg-chart-4"
      case "paused":
        return "bg-chart-2"
      case "stopped":
        return "bg-destructive"
      default:
        return "bg-muted"
    }
  }

  const handleViewDetails = (container: any) => {
    setSelectedContainer(container)
    setModalOpen(true)
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
              <h1 className="text-3xl font-bold text-foreground">Containers</h1>
              <p className="text-muted-foreground">Gerenciar seus containers Docker e instâncias</p>
            </div>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Container
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Containers Table */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Containers</CardTitle>
              <CardDescription>Monitorar e gerenciar todos os containers em execução</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome do Container</TableHead>
                      <TableHead>Endereço IP</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tempo de Atividade</TableHead>
                      <TableHead>Módulos</TableHead>
                      <TableHead>CPU</TableHead>
                      <TableHead>Memória</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {containers.map((container) => (
                      <TableRow key={container.id}>
                        <TableCell className="font-medium">{container.name}</TableCell>
                        <TableCell className="text-sm font-mono">{container.ip}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`${getStatusColor(container.status)} text-white border-0`}
                          >
                            {container.status === "running"
                              ? "Em Execução"
                              : container.status === "paused"
                                ? "Pausado"
                                : "Parado"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{container.uptime}</TableCell>
                        <TableCell className="text-sm">
                          <div className="flex gap-1 flex-wrap">
                            {container.modules.map((mod: string) => (
                              <Badge key={mod} variant="secondary" className="text-xs">
                                {mod}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-12 bg-secondary rounded h-2">
                              <div className="bg-chart-1 h-2 rounded" style={{ width: `${container.cpu}%` }} />
                            </div>
                            <span className="text-xs font-medium">{container.cpu}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-12 bg-secondary rounded h-2">
                              <div className="bg-accent h-2 rounded" style={{ width: `${container.memory}%` }} />
                            </div>
                            <span className="text-xs font-medium">{container.memory}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="ghost" onClick={() => handleViewDetails(container)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              {container.status === "running" ? (
                                <Pause className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </Button>
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
        </div>
      </main>

      {/* Container Details Modal */}
      {selectedContainer && (
        <ContainerDetailsModal container={selectedContainer} isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      )}
    </div>
  )
}
