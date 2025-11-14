"use client"

import { ProtectedLayout } from "@/components/layout/protected-layout"
import ContainerDetailsModal from "@/components/modals/containers/container-details-modal"
import { CreateContainerModal } from "@/components/modals/containers/create-container-model"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { apiClient } from "@/lib/api-client"
import { Container as ContainerType } from "@/lib/types"
import { Eye, Loader2, Pause, Play, Plus, RefreshCw, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useAuth } from "../auth-context"

const formatDate = (dateString: Date | string) => {
  if (!dateString) return "N/A"
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export default function ContainersPage() {
  const { userCan } = useAuth()

  const [containers, setContainers] = useState<ContainerType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null)

  const [selectedContainer, setSelectedContainer] = useState<ContainerType | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // --- Funções da API ---
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
    fetchContainers()
  }, [])

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
    if (!window.confirm("Tem certeza que deseja deletar este container? Esta ação é irreversível.")) return
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

  // ✅ Aqui começa o layout protegido
  return (
    <ProtectedLayout title="Containers" description="Gerenciar seus containers Docker e instâncias">
      <div className="space-y-6">
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
                            {userCan("read:container") && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewDetails(container)}
                                disabled={!!isSubmitting}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                            {(userCan("containers:start") || userCan("containers:stop")) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                // Desabilita se a ação específica não for permitida
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
                            )}
                            {userCan("delete:container") && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteContainer(container.id)}
                              disabled={!!isSubmitting}
                            >
                              {isSubmitting === container.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
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

      {/* Modais */}
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
