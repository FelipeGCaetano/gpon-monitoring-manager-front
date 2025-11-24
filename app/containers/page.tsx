"use client"

import { ProtectedLayout } from "@/components/layout/protected-layout"
import ContainerDetailsModal from "@/components/modals/containers/container-details-modal"
import { CreateContainerModal } from "@/components/modals/containers/create-container-model"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// Importar o Input
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { apiClient } from "@/lib/api-client"
import { Container as ContainerType } from "@/lib/types"
// Adicionar SearchIcon se quiser usar (opcional, aqui usei apenas o Input simples)
import { ArrowUpDown, Eye, Loader2, Pause, Play, Plus, RefreshCw, Search, Trash2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useAuth } from "../auth-context"

// ✅ Função de data atualizada com hora/minuto/segundo
const formatDate = (dateString: Date | string) => {
  if (!dateString) return "N/A"
  return new Date(dateString).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

type SortConfig = {
  key: string
  direction: "asc" | "desc"
} | null

export default function ContainersPage() {
  const { userCan, isAuthLoading } = useAuth()

  const [containers, setContainers] = useState<ContainerType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null)

  // ✅ Novo estado para a busca
  const [searchQuery, setSearchQuery] = useState("")
  const [sortConfig, setSortConfig] = useState<SortConfig>(null)

  const [selectedContainer, setSelectedContainer] = useState<ContainerType | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const fetchContainers = async () => {
    setIsLoading(true)
    if (userCan("read:containers")) {
      try {
        const data = await apiClient.getContainers()
        setContainers(data || [])
      } catch (error) {
        console.error("Falha ao buscar containers:", error)
      } finally {
        setIsLoading(false)
      }
    } else {
      setContainers([])
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthLoading) return
    if (!isAuthLoading && isLoading) fetchContainers()
  }, [isAuthLoading, userCan, isLoading])

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return { key, direction: current.direction === "asc" ? "desc" : "asc" }
      }
      return { key, direction: "asc" }
    })
  }

  // ✅ Lógica atualizada: Filtro + Ordenação
  const filteredAndSortedContainers = useMemo(() => {
    // 1. Filtragem
    let result = containers.filter((container) => {
      if (!searchQuery) return true

      const query = searchQuery.toLowerCase()
      // Verifica Nome, Imagem ou Status
      return (
        container.name.toLowerCase().includes(query) ||
        container.imageTemplate.image.toLowerCase().includes(query) ||
        container.status.toLowerCase().includes(query)
      )
    })

    // 2. Ordenação (aplica na lista já filtrada)
    if (sortConfig !== null) {
      result.sort((a, b) => {
        let aValue: any
        let bValue: any

        if (sortConfig.key === "image") {
          aValue = a.imageTemplate.image
          bValue = b.imageTemplate.image
        } else {
          aValue = a[sortConfig.key as keyof ContainerType]
          bValue = b[sortConfig.key as keyof ContainerType]
        }

        if (typeof aValue === 'string') aValue = aValue.toLowerCase()
        if (typeof bValue === 'string') bValue = bValue.toLowerCase()

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
        return 0
      })
    }
    return result
  }, [containers, sortConfig, searchQuery]) // Adicionado searchQuery nas dependências

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "RUNNING": return "bg-chart-4"
      case "PAUSED": return "bg-chart-2"
      case "STOPPED": return "bg-destructive"
      default: return "bg-muted"
    }
  }

  // Funções de ação (sem alterações)
  const handleViewDetails = (container: ContainerType) => {
    setSelectedContainer(container)
    setModalOpen(true)
  }

  const handleToggleStatus = async (container: ContainerType) => {
    setIsSubmitting(container.id)
    const action = container.status === "RUNNING" ? "stop" : "start"
    try {
      if (action === "stop") await apiClient.stopContainer(container.id)
      else await apiClient.startContainer(container.id)
      await fetchContainers()
    } catch (error) {
      console.error(`Falha ao ${action} o container:`, error)
    } finally {
      setIsSubmitting(null)
    }
  }

  const handleRestartContainer = async (containerId: string) => {
    setIsSubmitting(containerId)
    try {
      await apiClient.restartContainer(containerId)
      await fetchContainers()
    } catch (error) {
      console.error("Falha ao reiniciar o container:", error)
    } finally {
      setIsSubmitting(null)
    }
  }

  const handleDeleteContainer = async (containerId: string) => {
    if (!window.confirm("Tem certeza que deseja deletar este container?")) return
    setIsSubmitting(containerId)
    try {
      await apiClient.deleteContainer(containerId)
      await fetchContainers()
    } catch (error) {
      console.error("Falha ao deletar o container:", error)
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

  const SortableHead = ({ label, sortKey }: { label: string; sortKey: string }) => (
    <TableHead>
      <Button
        variant="ghost"
        onClick={() => handleSort(sortKey)}
        className="hover:bg-transparent px-0 font-bold flex items-center gap-1"
      >
        {label}
        <ArrowUpDown className="h-4 w-4" />
      </Button>
    </TableHead>
  )

  return (
    <ProtectedLayout title="Containers" description="Gerenciar seus containers Docker e instâncias">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Lista de Containers</CardTitle>
            <CardDescription>Monitorar e gerenciar todos os containers em execução</CardDescription>
          </CardHeader>
          <CardContent>
            {/* ✅ Barra de Pesquisa */}
            <div className="flex items-center mb-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filtrar por nome, imagem ou status..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHead label="Nome" sortKey="name" />
                    <SortableHead label="Imagem" sortKey="image" />
                    <SortableHead label="Status" sortKey="status" />
                    <SortableHead label="Criado em" sortKey="createdAt" />
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <LoadingRow cols={5} />
                  ) : filteredAndSortedContainers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        {searchQuery
                          ? "Nenhum container encontrado para sua busca."
                          : "Nenhum container encontrado."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedContainers.map((container) => (
                      <TableRow key={container.id}>
                        <TableCell className="font-medium">{container.name}</TableCell>
                        <TableCell className="text-sm font-mono">{container.imageTemplate.image}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`${getStatusColor(container.status)} text-white border-0`}
                          >
                            {container.status === "RUNNING" ? "Em Execução" :
                              container.status === "PAUSED" ? "Pausado" : "Parado"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(container.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {userCan("read:container") && (
                              <Button size="sm" variant="ghost" onClick={() => handleViewDetails(container)} disabled={!!isSubmitting}>
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                            {(userCan("containers:start") || userCan("containers:stop")) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleToggleStatus(container)}
                                disabled={
                                  (container.status === "RUNNING" && !userCan("containers:stop")) ||
                                  (container.status !== "RUNNING" && !userCan("containers:start")) ||
                                  !!isSubmitting
                                }
                              >
                                {isSubmitting === container.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : container.status === "RUNNING" ? (
                                  <Pause className="w-4 h-4" />
                                ) : (
                                  <Play className="w-4 h-4" />
                                )}
                              </Button>
                            )}
                            {userCan("containers:restart") && (
                              <Button size="sm" variant="ghost" onClick={() => handleRestartContainer(container.id)} disabled={!!isSubmitting}>
                                {isSubmitting === container.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                              </Button>
                            )}
                            {userCan("delete:container") && (
                              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDeleteContainer(container.id)} disabled={!!isSubmitting}>
                                {isSubmitting === container.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                              </Button>
                            )}
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

        {userCan("create:containers") && (
          <div className="flex justify-end mt-6">
            <Button className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4" />
              Novo Container
            </Button>
          </div>
        )}
      </div>

      {selectedContainer && (
        <ContainerDetailsModal
          container={selectedContainer}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      )}
      <CreateContainerModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onContainerCreated={fetchContainers}
      />
    </ProtectedLayout>
  )
}