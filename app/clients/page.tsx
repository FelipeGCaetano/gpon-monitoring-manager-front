"use client"

import { CreateClientModal } from "@/components/modals/client/create-client-modal";
import { EditClientModal } from "@/components/modals/client/update-client-modal";
// Modais de Instância removidos
// import { CreateInstanceModal } from "@/components/modals/create-instance-modal";
// import { GponInstanceDetailsModal } from "@/components/modals/gpon-instance-details-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// Tabs removidas
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/lib/api-client";
import { Client } from "@/lib/types"; // Importando o tipo 'Client' de lib/types
import {
  Activity,
  Component,
  Container,
  Edit2,
  // Eye, // Removido (era para instâncias)
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

// Interfaces de Instância e Módulo removidas
// interface Instance { ... }
// interface Module { ... }

const navigationItems = [
  { icon: LayoutDashboard, label: "Painel", href: "/" },
  { icon: Container, label: "Containers", href: "/containers" },
  { icon: Layers, label: "Módulos", href: "/modules" },
  { icon: Component, label: "Instâncias", href: "/instances" }, // 2. Adicionar novo item
  { icon: Users, label: "Clientes", href: "/clients", active: true },
  { icon: Users, label: "Usuários", href: "/users" },
  { icon: Settings, label: "Configuração", href: "/settings" },
]

// Helper para formatar data (Removido, não é usado nesta tabela)
// const formatDate = (dateString: Date | string) => { ... }

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

  // --- Estados dos Modais (Apenas Cliente) ---
  const [isCreateClientOpen, setIsCreateClientOpen] = useState(false)
  const [isEditClientOpen, setIsEditClientOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  // --- Estados de Dados da API (Apenas Cliente) ---
  const [clients, setClients] = useState<Client[]>([])
  const [isLoadingClients, setIsLoadingClients] = useState(true)

  // --- Funções de busca de dados (Apenas Cliente) ---
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

  // Carrega todos os dados da página
  useEffect(() => {
    fetchClients()
  }, [])

  // Funções de cor/tipo de Instância removidas
  // const getStatusColor = (status: string) => { ... }
  // const getTypeColor = (type: string) => { ... }
  // const getTypeName = (type: string) => { ... }


  // Ações da API (Apenas Cliente)
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

  const handleEditClient = (client: Client) => {
    setSelectedClient(client)
    setIsEditClientOpen(true)
  }

  // Handlers de Instância removidos
  // const handleEditInstance = (instance: Instance) => { ... }
  // const handleViewInstanceDetails = (instance: Instance) => { ... }

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
        {/* Header (Atualizado) */}
        <div className="sticky top-0 bg-card border-b border-border p-6 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
              <p className="text-muted-foreground">Gerenciar clientes do sistema</p>
            </div>
            <Button className="gap-2" onClick={() => setIsCreateClientOpen(true)}>
              <Plus className="w-4 h-4" />
              Adicionar Cliente
            </Button>
          </div>
        </div>

        {/* Content (Tabs Removidas) */}
        <div className="p-6 space-y-6">
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
        </div>
      </main>

      {/* Modais (Apenas Cliente) */}
      <CreateClientModal
        open={isCreateClientOpen}
        onOpenChange={setIsCreateClientOpen}
        onClientCreated={async () => {
          await fetchClients()
        }}
      />

      <EditClientModal
        open={isEditClientOpen}
        onOpenChange={setIsEditClientOpen}
        client={selectedClient}
        onClientUpdated={async () => {
          await fetchClients()
        }}
      />
    </div>
  )
}