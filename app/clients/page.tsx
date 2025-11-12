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
  Edit2,
  Eye,
  MapPin,
  Wifi,
  WifiOff,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GponInstanceDetailsModal } from "@/components/modals/gpon-instance-details-modal"
import { CreateInstanceModal } from "@/components/modals/create-instance-modal"

const clients = [
  {
    id: "client-001",
    name: "Gateway OLT - Região A",
    ipAddress: "192.168.1.50",
    location: "São Paulo",
    status: "online",
    instances: 3,
    lastSeen: "2 min atrás",
    uptime: "45 dias",
    version: "v2.3.1",
  },
  {
    id: "client-002",
    name: "Hub de Fibra - Região B",
    ipAddress: "192.168.1.51",
    location: "Rio de Janeiro",
    status: "online",
    instances: 2,
    lastSeen: "5 min atrás",
    uptime: "32 dias",
    version: "v2.3.0",
  },
  {
    id: "client-003",
    name: "Ponto de Acesso - Região C",
    ipAddress: "192.168.1.52",
    location: "Belo Horizonte",
    status: "offline",
    instances: 0,
    lastSeen: "4 horas atrás",
    uptime: "0 dias",
    version: "v2.1.5",
  },
  {
    id: "client-004",
    name: "Terminal de Rede - Região D",
    ipAddress: "192.168.1.53",
    location: "Brasília",
    status: "online",
    instances: 4,
    lastSeen: "1 min atrás",
    uptime: "60 dias",
    version: "v2.3.1",
  },
  {
    id: "client-005",
    name: "Nó de Distribuição - Região E",
    ipAddress: "192.168.1.54",
    location: "Recife",
    status: "online",
    instances: 1,
    lastSeen: "8 min atrás",
    uptime: "18 dias",
    version: "v2.2.8",
  },
]

const instances = [
  {
    id: "inst-001",
    client: "Gateway OLT - Região A",
    name: "Instância A-1",
    type: "Production",
    status: "running",
    cpu: 45,
    memory: 62,
    uptime: "45 dias",
    services: 5,
  },
  {
    id: "inst-002",
    client: "Gateway OLT - Região A",
    name: "Instância A-2",
    type: "Backup",
    status: "running",
    cpu: 28,
    memory: 41,
    uptime: "45 dias",
    services: 3,
  },
  {
    id: "inst-003",
    client: "Gateway OLT - Região A",
    name: "Instância A-3",
    type: "Testing",
    status: "paused",
    cpu: 0,
    memory: 18,
    uptime: "12 dias",
    services: 2,
  },
  {
    id: "inst-004",
    client: "Hub de Fibra - Região B",
    name: "Instância B-1",
    type: "Production",
    status: "running",
    cpu: 52,
    memory: 75,
    uptime: "32 dias",
    services: 6,
  },
  {
    id: "inst-005",
    client: "Hub de Fibra - Região B",
    name: "Instância B-2",
    type: "Monitoring",
    status: "running",
    cpu: 35,
    memory: 48,
    uptime: "32 dias",
    services: 4,
  },
]

const navigationItems = [
  { icon: LayoutDashboard, label: "Painel", href: "/" },
  { icon: Container, label: "Containers", href: "/containers" },
  { icon: Layers, label: "Módulos", href: "/modules" },
  { icon: Users, label: "Clientes", href: "/clients", active: true },
  { icon: Users, label: "Usuários", href: "/users" },
  { icon: Settings, label: "Configuração", href: "/settings" },
]

export default function ClientsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedInstance, setSelectedInstance] = useState<any>(null)
  const [instanceDetailsOpen, setInstanceDetailsOpen] = useState(false)
  const [createInstanceOpen, setCreateInstanceOpen] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-chart-4"
      case "offline":
        return "bg-destructive"
      case "running":
        return "bg-chart-4"
      case "paused":
        return "bg-chart-2"
      default:
        return "bg-muted"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Production":
        return "bg-chart-4"
      case "Backup":
        return "bg-chart-2"
      case "Testing":
        return "bg-chart-3"
      case "Monitoring":
        return "bg-accent"
      default:
        return "bg-secondary"
    }
  }

  const handleViewInstanceDetails = (instance: any) => {
    setSelectedInstance(instance)
    setInstanceDetailsOpen(true)
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
              <h1 className="text-3xl font-bold text-foreground">Clientes & Instâncias</h1>
              <p className="text-muted-foreground">Gerenciar clientes conectados e suas instâncias GPON</p>
            </div>
            <Button className="gap-2" onClick={() => setCreateInstanceOpen(true)}>
              <Plus className="w-4 h-4" />
              Criar Instância
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Tabs */}
          <Tabs defaultValue="clients" className="space-y-4">
            <TabsList>
              <TabsTrigger value="clients">Clientes</TabsTrigger>
              <TabsTrigger value="instances">Instâncias</TabsTrigger>
            </TabsList>

            {/* Clients Tab */}
            <TabsContent value="clients" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Clientes Conectados</CardTitle>
                  <CardDescription>Gerenciar e monitorar todas as conexões de clientes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome do Cliente</TableHead>
                          <TableHead>Local</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Instâncias</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clients.map((client) => (
                          <TableRow key={client.id}>
                            <TableCell className="font-medium">{client.name}</TableCell>
                            <TableCell className="text-sm">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                {client.location}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`${getStatusColor(client.status)} text-white border-0`}
                              >
                                {client.status === "online" ? (
                                  <Wifi className="w-3 h-3 mr-1" />
                                ) : (
                                  <WifiOff className="w-3 h-3 mr-1" />
                                )}
                                {client.status === "online" ? "Online" : "Offline"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm font-medium">{client.instances}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button size="sm" variant="ghost">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="ghost">
                                  <Edit2 className="w-4 h-4" />
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
            </TabsContent>

            {/* Instances Tab */}
            <TabsContent value="instances" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Instâncias de Clientes</CardTitle>
                  <CardDescription>Monitorar todas as instâncias em execução nos clientes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome da Instância</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>CPU</TableHead>
                          <TableHead>Memória</TableHead>
                          <TableHead>Última Atualização</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {instances.map((instance) => (
                          <TableRow key={instance.id}>
                            <TableCell className="font-medium">{instance.name}</TableCell>
                            <TableCell className="text-sm">{instance.client}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`${getTypeColor(instance.type)} text-white border-0`}>
                                {instance.type === "Production"
                                  ? "Produção"
                                  : instance.type === "Backup"
                                    ? "Backup"
                                    : instance.type === "Testing"
                                      ? "Testes"
                                      : "Monitoramento"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`${getStatusColor(instance.status)} text-white border-0`}
                              >
                                {instance.status === "running" ? "Em Execução" : "Pausado"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-12 bg-secondary rounded h-2">
                                  <div className="bg-chart-1 h-2 rounded" style={{ width: `${instance.cpu}%` }} />
                                </div>
                                <span className="text-xs font-medium">{instance.cpu}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-12 bg-secondary rounded h-2">
                                  <div className="bg-accent h-2 rounded" style={{ width: `${instance.memory}%` }} />
                                </div>
                                <span className="text-xs font-medium">{instance.memory}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">Agora</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button size="sm" variant="ghost" onClick={() => handleViewInstanceDetails(instance)}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="ghost">
                                  <Edit2 className="w-4 h-4" />
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
          </Tabs>
        </div>
      </main>

      {selectedInstance && (
        <GponInstanceDetailsModal
          instance={selectedInstance}
          open={instanceDetailsOpen}
          onOpenChange={setInstanceDetailsOpen}
        />
      )}

      <CreateInstanceModal
        open={createInstanceOpen}
        onOpenChange={setCreateInstanceOpen}
        clients={clients}
        modules={[]}
      />
    </div>
  )
}
