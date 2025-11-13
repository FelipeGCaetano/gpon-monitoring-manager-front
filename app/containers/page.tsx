"use client"

import ContainerDetailsModal from "@/components/modals/containers/container-details-modal";
import { CreateContainerModal } from "@/components/modals/containers/create-container-model"; // 1. Importar o novo modal
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiClient } from "@/lib/api-client"; // Importado o API Client
import { Container as ContainerType } from "@/lib/types";
import {
  Activity,
  Component,
  Container,
  Eye,
  Layers,
  LayoutDashboard,
  Loader2,
  Menu,
  Pause,
  Play,
  Plus,
  RefreshCw, // 1. Ícone de Reiniciar Adicionado
  Settings,
  Trash2,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

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
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export default function ContainersPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // --- Estados dos Modais ---
  const [selectedContainer, setSelectedContainer] = useState<ContainerType | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false) // 2. Adicionar estado

  // --- Estados de Dados da API ---
  const [containers, setContainers] = useState<ContainerType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  // Armazena o ID do container que está sofrendo uma ação
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null)
  // -----------------------------

  // Função para carregar containers
  const fetchContainers = async () => {
    setIsLoading(true)
    try {
      const data = await apiClient.getContainers()
      setContainers(data || [])
    } catch (error) {
      console.error("Falha ao buscar containers:", error)
      // TODO: Adicionar toast de erro
    } finally {
      setIsLoading(false)
    }
  }

  // Carrega os dados no mount
  useEffect(() => {
    fetchContainers()
  }, [])

  // Atualizado para usar os status da API (maiúsculas)
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "RUNNING":
        return "bg-chart-4"
      case "PAUSED":
        return "bg-chart-2"
      case "STOPPED":
        return "bg-destructive"
      default:
        return "bg-muted"
    }
  }

  const handleViewDetails = (container: ContainerType) => {
    setSelectedContainer(container)
    setModalOpen(true)
  }

  // --- Ações da API ---
  const handleToggleStatus = async (container: ContainerType) => {
    setIsSubmitting(container.id)
    const action = container.status === "RUNNING" ? "stop" : "start"

    try {
      if (action === "stop") {
        await apiClient.stopContainer(container.id)
      } else {
        await apiClient.startContainer(container.id)
      }
      // TODO: Toast de sucesso
      await fetchContainers() // Recarrega a lista
    } catch (error) {
      console.error(`Falha ao ${action} o container:`, error)
      // TODO: Toast de erro
    } finally {
      setIsSubmitting(null)
    }
  }

  // 2. Nova função para Reiniciar
  const handleRestartContainer = async (containerId: string) => {
    setIsSubmitting(containerId)
    try {
      await apiClient.restartContainer(containerId)
      // TODO: Toast de sucesso "Container reiniciado"
      await fetchContainers() // Recarrega a lista
    } catch (error) {
      console.error("Falha ao reiniciar o container:", error)
      // TODO: Toast de erro
    } finally {
      setIsSubmitting(null)
    }
  }

  const handleDeleteContainer = async (containerId: string) => {
    if (!window.confirm("Tem certeza que deseja deletar este container? Esta ação é irreversível.")) {
      return
    }

    setIsSubmitting(containerId)
    try {
      await apiClient.deleteContainer(containerId)
      // TODO: Toast de sucesso
      await fetchContainers() // Recarrega a lista
    } catch (error) {
      console.error("Falha ao deletar o container:", error)
      // TODO: Toast de erro
    } finally {
      setIsSubmitting(null)
    }
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
              <h1 className="text-3xl font-bold text-foreground">Containers</h1>
              <p className="text-muted-foreground">Gerenciar seus containers Docker e instâncias</p>
            </div>
            {/* 3. Ligar o botão ao estado */}
            <Button className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
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
                      <TableHead>Nome</TableHead>
                      <TableHead>Imagem</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <LoadingRow cols={5} />
                    ) : containers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          Nenhum container encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      containers.map((container) => (
                        <TableRow key={container.id}>
                          <TableCell className="font-medium">{container.name}</TableCell>
                          <TableCell className="text-sm font-mono">{container.imageTemplate.image}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`${getStatusColor(container.status)} text-white border-0`}
                            >
                              {container.status === "RUNNING"
                                ? "Em Execução"
                                : container.status === "PAUSED"
                                  ? "Pausado"
                                  : "Parado"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{formatDate(container.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Botão Detalhes */}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewDetails(container)}
                                disabled={!!isSubmitting} // Desabilita se qualquer ação estiver em progresso
                              >
                                <Eye className="w-4 h-4" />
                              </Button>

                              {/* Botão Start/Pause */}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleToggleStatus(container)}
                                disabled={!!isSubmitting} // Desabilita se qualquer ação estiver em progresso
                              >
                                {isSubmitting === container.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : container.status === "RUNNING" ? (
                                  <Pause className="w-4 h-4" />
                                ) : (
                                  <Play className="w-4 h-4" />
                                )}
                              </Button>

                              {/* 3. Botão Reiniciar Adicionado */}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRestartContainer(container.id)}
                                disabled={!!isSubmitting}
                              >
                                {isSubmitting === container.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="w-4 h-4" />
                                )}
                              </Button>

                              {/* Botão Deletar */}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDeleteContainer(container.id)}
                                disabled={!!isSubmitting} // Desabilita se qualquer ação estiver em progresso
                              >
                                {isSubmitting === container.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
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

      {/* Container Details Modal */}
      {selectedContainer && (
        <ContainerDetailsModal
          container={selectedContainer} // Passa o objeto container completo da API
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      )}

      {/* 4. Renderizar o novo modal */}
      <CreateContainerModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onContainerCreated={() => {
          fetchContainers(); // Recarrega a lista
        }}
      />
    </div>
  )
}