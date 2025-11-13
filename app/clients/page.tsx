"use client"

import { CreateClientModal } from "@/components/modals/client/create-client-modal"; // 1. Importar o novo modal
import { EditClientModal } from "@/components/modals/client/update-client-modal"; // 1. Importar o modal de EDIÇÃO
import { CreateInstanceModal } from "@/components/modals/create-instance-modal";
import { GponInstanceDetailsModal } from "@/components/modals/gpon-instance-details-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/lib/api-client";
import { Client } from "@/lib/types"; // Importando o tipo 'Client' de lib/types
import {
  Activity,
  Container,
  Edit2,
  Eye,
  Layers,
  LayoutDashboard,
  Loader2,
  Menu,
  Plus,
  Settings,
  Trash2,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react"; // Importado useEffect

// Esta interface permanece a MESMA, pois vem de apiClient.getAllInstances()
interface Instance {
  id: string
  name: string
  type: "PRODUCTION" | "BACKUP" | "TESTING" | "MONITORING"
  status: "RUNNING" | "PAUSED"
  createdAt: string
  client: {
    name: string
  }
}

interface Module {
  id: string
  name: string
}
// --- FIM DOS TIPOS ---

const navigationItems = [
  { icon: LayoutDashboard, label: "Painel", href: "/" },
  { icon: Container, label: "Containers", href: "/containers" },
  { icon: Layers, label: "Módulos", href: "/modules" },
  { icon: Users, label: "Clientes", href: "/clients", active: true },
  { icon: Users, label: "Usuários", href: "/users" },
  { icon: Settings, label: "Configuração", href: "/settings" },
]

// Helper para formatar data
const formatDate = (dateString: Date | string) => {
  if (!dateString) return "N/A"
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

// --- Helper para formatar telefone (copiado de users/page.tsx) ---
const formatPhone = (value: string) => {
  if (!value) return ""
  let v = value.replace(/\D/g, "")
  v = v.slice(0, 11)
  if (v.length > 10) {
    v = v.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3")
  } else if (v.length > 6) {
    v = v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3")
  } else if (v.length > 2) {
    v = v.replace(/^(\d{2})(\d{0,5}).*/, "($1) $2")
  } else if (v.length > 0) {
    v = v.replace(/^(\d{0,2}).*/, "($1")
  }
  return v
}

export default function ClientsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // --- Estados dos Modais ---
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null)
  const [instanceDetailsOpen, setInstanceDetailsOpen] = useState(false)
  const [createInstanceOpen, setCreateInstanceOpen] = useState(false)
  const [isCreateClientOpen, setIsCreateClientOpen] = useState(false) // 2. Estado para o novo modal
  const [isEditClientOpen, setIsEditClientOpen] = useState(false) // 2. Estado para o modal de EDIÇÃO
  const [selectedClient, setSelectedClient] = useState<Client | null>(null) // 2. Estado para guardar o cliente a ser editado

  // --- Estados de Dados da API ---
  const [clients, setClients] = useState<Client[]>([])
  const [instances, setInstances] = useState<Instance[]>([])
  const [modules, setModules] = useState<Module[]>([]) // Para o modal
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingClients, setIsLoadingClients] = useState(true) // Loading específico para clientes
  const [isLoadingInstances, setIsLoadingInstances] = useState(true) // Loading específico para instâncias
  // -----------------------------

  // --- 4. Funções de busca de dados refatoradas ---
  const fetchClients = async () => {
    setIsLoadingClients(true)
    try {
      const clientsData = await apiClient.getClients()
      setClients(clientsData || [])
    } catch (error) {
      console.error("Falha ao buscar clientes:", error)
    } finally {
      setIsLoadingClients(false)
    }
  }

  const fetchInstancesAndModules = async () => {
    setIsLoadingInstances(true)
    try {
      const [instancesData, modulesData] = await Promise.all([
        apiClient.getInstances(),
        apiClient.getModules(),
      ])
      setInstances(instancesData || [])
      setModules(modulesData || [])
    } catch (error) {
      console.error("Falha ao buscar instâncias/módulos:", error)
    } finally {
      setIsLoadingInstances(false)
    }
  }

  // Carrega todos os dados da página
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true) // Loading geral
      await Promise.all([fetchClients(), fetchInstancesAndModules()])
      setIsLoading(false)
    }
    fetchData()
  }, [])

  // (Funções de cor e tipo permanecem as mesmas)
  // ... getStatusColor, getTypeColor, getTypeName ...
  // Funções de Cores (Ainda são usadas na Aba "Instâncias")
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ONLINE": // Status do Cliente (não mais usado na tabela, mas mantido)
      case "RUNNING": // Status da Instância
        return "bg-chart-4" // Verde
      case "OFFLINE": // Status do Cliente (não mais usado na tabela, mas mantido)
        return "bg-destructive" // Vermelho
      case "PAUSED": // Status da Instância
        return "bg-chart-2" // Laranja
      default:
        return "bg-muted"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "PRODUCTION":
        return "bg-chart-4"
      case "BACKUP":
        return "bg-chart-2"
      case "TESTING":
        return "bg-chart-3"
      case "MONITORING":
        return "bg-accent"
      default:
        return "bg-secondary"
    }
  }

  const getTypeName = (type: string) => {
    switch (type) {
      case "PRODUCTION":
        return "Produção"
      case "BACKUP":
        return "Backup"
      case "TESTING":
        return "Testes"
      case "MONITORING":
        return "Monitoramento"
      default:
        return type
    }
  }


  // Ações da API
  const handleDeleteClient = async (clientId: string) => {
    if (!window.confirm("Tem certeza que deseja deletar este cliente? Isso NÃO deletará as instâncias associadas.")) {
      return
    }
    try {
      await apiClient.deleteClient(clientId)
      setClients((prev) => prev.filter((c) => c.id !== clientId))
      // TODO: Toast de sucesso
    } catch (error) {
      console.error("Falha ao deletar cliente:", error)
      // TODO: Toast de erro
    }
  }

  // Placeholder para Ações futuras
  const handleEditClient = (client: Client) => {
    // 3. Implementar a função
    setSelectedClient(client)
    setIsEditClientOpen(true)
  }

  const handleEditInstance = (instance: Instance) => {
    console.log("TODO: Abrir modal de edição para a instância", instance.id)
  }

  // Ação do Modal (como no original)
  const handleViewInstanceDetails = (instance: Instance) => {
    setSelectedInstance(instance)
    setInstanceDetailsOpen(true)
  }

  const LoadingRow = ({ cols }: { cols: number }) => (
    <TableRow>
      <TableCell colSpan={cols} className="h-24 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto" />
      </TableCell>
    </TableRow>
  )

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
              <h1 className="text-3xl font-bold text-foreground">Clientes & Instâncias</h1>
              <p className="text-muted-foreground">Gerenciar clientes conectados e suas instâncias GPON</p>
            </div>
            {/* O botão principal continua sendo Criar Instância */}
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

            {/* Clients Tab (Atualizada) */}
            <TabsContent value="clients" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Clientes Conectados</CardTitle>
                    <CardDescription>Gerenciar e monitorar todas as conexões de clientes</CardDescription>
                  </div>
                  {/* 3. Botão para abrir o novo modal */}
                  <Button variant="outline" className="gap-2" onClick={() => setIsCreateClientOpen(true)}>
                    <Plus className="w-4 h-4" />
                    Adicionar Cliente
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome do Cliente</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Telefone</TableHead>
                          <TableHead>Instâncias</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingClients ? (
                          <LoadingRow cols={5} />
                        ) : clients.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                              Nenhum cliente encontrado.
                            </TableCell>
                          </TableRow>
                        ) : (
                          clients.map((client) => (
                            <TableRow key={client.id}>
                              <TableCell className="font-medium">{client.name}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{client.email}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatPhone(client.phone)}
                              </TableCell>
                              <TableCell className="text-sm font-medium">
                                {client.gponInstances.length}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button size="sm" variant="ghost" onClick={() => handleEditClient(client)}>
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => handleDeleteClient(client.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Instances Tab (Permanece a mesma) */}
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
                          <TableHead>Criado em</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingInstances ? (
                          <LoadingRow cols={6} />
                        ) : instances.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                              Nenhuma instância encontrada.
                            </TableCell>
                          </TableRow>
                        ) : (
                          instances.map((instance) => (
                            <TableRow key={instance.id}>
                              <TableCell className="font-medium">{instance.name}</TableCell>
                              <TableCell className="text-sm">{instance.client.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={`${getTypeColor(instance.type)} text-white border-0`}>
                                  {getTypeName(instance.type)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={`${getStatusColor(instance.status)} text-white border-0`}
                                >
                                  {instance.status === "RUNNING" ? "Em Execução" : "Pausado"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatDate(instance.createdAt)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button size="sm" variant="ghost" onClick={() => handleViewInstanceDetails(instance)}>
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => handleEditInstance(instance)}>
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Modais */}
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
        clients={clients} // Passando clientes reais
        modules={modules} // Passando módulos reais
        onInstanceCreated={async () => {
          // Função para recarregar as instâncias após a criação
          setIsLoadingInstances(true)
          try {
            const instancesData = await apiClient.getInstances()
            setInstances(instancesData || [])
          } catch (error) {
            console.error("Erro ao recarregar instâncias", error)
          } finally {
            setIsLoadingInstances(false)
          }
        }}
      />

      {/* 5. Renderizar o novo modal */}
      <CreateClientModal
        open={isCreateClientOpen}
        onOpenChange={setIsCreateClientOpen}
        onClientCreated={async () => {
          // Recarrega a lista de clientes
          await fetchClients()
        }}
      />

      {/* 5. Renderizar o novo modal de EDIÇÃO */}
      <EditClientModal
        open={isEditClientOpen}
        onOpenChange={setIsEditClientOpen}
        client={selectedClient}
        onClientUpdated={async () => {
          // Recarrega a lista de clientes
          await fetchClients()
        }}
      />
    </div>
  )
}