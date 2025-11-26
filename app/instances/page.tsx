"use client"

import { ProtectedLayout } from "@/components/layout/protected-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Blocks,
  Box,
  Edit2,
  Eye,
  Layers,
  Loader2,
  Plus,
  Trash2
} from "lucide-react"
import { useEffect, useState } from "react"
// TableCell/Row removidos pois não são mais usados
import { CreateInstanceModal } from "@/components/modals/instances/create-instance-modal"
import { EditInstanceModal } from "@/components/modals/instances/edit-instance-modal"
import { GponInstanceDetailsModal } from "@/components/modals/instances/gpon-instance-details-modal"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { apiClient } from "@/lib/api-client"
// 2. Importar o tipo Project
import type { Client, GponInstance as Instance, Module, Project } from "@/lib/types"
import { toast } from "sonner"
import { useAuth } from "../auth-context"

// Helper para formatar data
const formatDate = (dateString: Date | string) => {
  if (!dateString) return "N/A"
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

// Funções de Cores
const getStatusColor = (status: string) => {
  switch (status) {
    case "RUNNING": return "bg-chart-4"
    case "PAUSED": return "bg-chart-2"
    default: return "bg-muted"
  }
}
const getTypeColor = (type: string) => {
  switch (type) {
    case "PRODUCTION": return "bg-chart-4"
    case "BACKUP": return "bg-chart-2"
    case "TESTING": return "bg-chart-3"
    case "MONITORING": return "bg-accent"
    default: return "bg-secondary"
  }
}
const getTypeName = (type: string) => {
  switch (type) {
    case "PRODUCTION": return "Produção"
    case "BACKUP": return "Backup"
    case "TESTING": return "Testes"
    case "MONITORING": return "Monitoramento"
    default: return type
  }
}
// --- Fim das Funções de Cor ---

export default function InstancesPage() {
  const { userCan, isAuthLoading } = useAuth()

  // --- Estados dos Modais ---
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null)
  const [instanceDetailsOpen, setInstanceDetailsOpen] = useState(false)
  const [createInstanceOpen, setCreateInstanceOpen] = useState(false)
  const [editingInstanceOpen, setEditingInstanceOpen] = useState(false)
  const [editingInstanceId, setEditingInstanceId] = useState<string | null | undefined>()

  // --- Estados de Dados da API ---
  const [clients, setClients] = useState<Client[]>([])
  const [instances, setInstances] = useState<Instance[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [projects, setProjects] = useState<Project[]>([]) // 3. Adicionar estado de Projetos
  const [isLoading, setIsLoading] = useState(true)
  const [groupedInstances, setGroupedInstances] = useState<Record<string, Instance[]>>({})
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null)

  // --- Funções de busca de dados ---
  const fetchPageData = async () => {
    setIsLoading(true)
    try {
      if (userCan("read:instances")) {
        // 4. Adicionar apiClient.getProjects()
        const [instancesData, modulesData, clientsData, projectsData] = await Promise.all([
          apiClient.getInstances(),
          userCan("read:modules") ? apiClient.getModules() : Promise.resolve([]),
          userCan("read:clients") ? apiClient.getClients() : Promise.resolve([]),
          userCan("read:projects") ? apiClient.getProjects() : Promise.resolve([]), // Busca projetos
        ])
        setInstances(instancesData || [])
        setModules(modulesData || [])
        setClients(clientsData || [])
        setProjects(projectsData || []) // Salva projetos
      } else {
        setInstances([])
        setModules([])
        setClients([])
        setProjects([])
      }
    } catch (error) {
      console.error("Falha ao buscar dados da página:", error)
      toast.error("Falha ao buscar dados da página.")
    } finally {
      setIsLoading(false)
    }
  }

  // useEffect para buscar dados (corrigido)
  useEffect(() => {
    if (isAuthLoading) {
      return;
    }
    if (!isAuthLoading && isLoading) {
      fetchPageData();
    }
  }, [isAuthLoading, userCan, isLoading])

  // useEffect para agrupar instâncias (sem alteração)
  useEffect(() => {
    if (isLoading || instances.length === 0) {
      setGroupedInstances({})
      return
    }
    const groups = instances.reduce((acc, instance) => {
      const clientName = instance.client?.name || "Cliente Desconhecido"
      if (!acc[clientName]) {
        acc[clientName] = []
      }
      acc[clientName].push(instance)
      return acc
    }, {} as Record<string, Instance[]>)

    setGroupedInstances(groups)
  }, [instances, isLoading])

  // --- Ações ---
  const handleEditInstance = (instance: Instance) => {
    setEditingInstanceId(instance.id)
    setEditingInstanceOpen(true)
  }

  const handleViewInstanceDetails = (instance: Instance) => {
    setSelectedInstance(instance)
    setInstanceDetailsOpen(true)
  }

  const handleDeleteInstance = async (instanceId: string) => {
    if (!window.confirm("Tem certeza que deseja deletar esta instância? Esta ação é irreversível e deletará todos os containers associados.")) {
      return
    }

    setIsSubmitting(instanceId)
    try {
      await apiClient.deleteInstance(instanceId)
      toast.success("Instância deletada com sucesso!")
      await fetchPageData()
    } catch (error) {
      toast.error("Falha ao deletar instância.")
    } finally {
      setIsSubmitting(null)
    }
  }

  return (
    <ProtectedLayout
      title="Instâncias GPON"
      description="Gerencie suas instâncias e módulos atribuídos"
    >
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : !userCan("read:instances") ? (
          <Card>
            <CardContent className="p-10 text-center text-destructive">
              Você não tem permissão para visualizar as instâncias.
            </CardContent>
          </Card>
        ) : Object.keys(groupedInstances).length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center text-muted-foreground">
              Nenhuma instância encontrada.
            </CardContent>
          </Card>
        ) : (
          <Accordion type="multiple" className="w-full space-y-4">
            {Object.entries(groupedInstances).map(([clientName, clientInstances]) => (
              <AccordionItem
                value={clientName}
                key={clientName}
                className="border border-border rounded-lg shadow-sm bg-card"
              >
                <AccordionTrigger className="px-6 py-4 text-lg font-medium hover:no-underline">
                  {clientName}
                  <Badge variant="secondary" className="ml-3">
                    {clientInstances.length} Instância(s)
                  </Badge>
                </AccordionTrigger>

                <AccordionContent className="border-t border-border p-0">
                  <div className="flex flex-col">
                    {clientInstances.map((instance) => (
                      <div
                        key={instance.id}
                        className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 p-4 border-b border-border last:border-b-0"
                      >
                        {/* Coluna 1: Data e Nome */}
                        <div className="flex-1 min-w-[200px]">
                          {/* 5. Exibir Nome da Instância */}
                          <p className="font-medium text-foreground">{instance.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Criado em: {formatDate(instance.createdAt)}
                          </p>
                        </div>

                        {/* Coluna 2: Badges de Info */}
                        <div className="flex flex-wrap gap-2">
                          {/* 6. Badge de Projeto Adicionada */}
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1.5"
                          >
                            <Blocks className="w-3 h-3 text-muted-foreground" />
                            {instance.projectTemplate?.name || "Manual"}
                          </Badge>
                          <Badge variant="secondary" className="flex items-center gap-1.5">
                            <Layers className="w-3 h-3" />
                            {instance.modules.length} Módulo(s)
                          </Badge>
                          <Badge variant="secondary" className="flex items-center gap-1.5">
                            <Box className="w-3 h-3" />
                            {instance.containers.length} Container(s)
                          </Badge>
                          <Badge variant="secondary" className="flex items-center gap-1.5">
                            <Box className="w-3 h-3" />
                            {instance.domains.length} Dominios(s)
                          </Badge>                          
                        </div>

                        {/* Coluna 3: Ações (com permissões) */}
                        <div className="flex items-center justify-end gap-2">
                          {userCan("read:instance") && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewInstanceDetails(instance)}
                              disabled={!!isSubmitting}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                          {userCan("update:instance") && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditInstance(instance)}
                              disabled={!!isSubmitting}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          )}
                          {userCan("delete:instance") && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteInstance(instance.id)}
                              disabled={!!isSubmitting}
                            >
                              {isSubmitting === instance.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}

        {userCan("create:instances") && (
          <div className="flex justify-end">
            <Button className="gap-2" onClick={() => setCreateInstanceOpen(true)} disabled={isLoading}>
              <Plus className="w-4 h-4" />
              Criar Instância
            </Button>
          </div>
        )}
      </div>

      {/* --- Modais --- */}
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
        modules={modules}
        projects={projects} // 7. Passar projetos para o modal
        onInstanceCreated={async () => {
          await fetchPageData()
          toast.success("Instância criada com sucesso!")
        }}
      />

      <EditInstanceModal
        open={editingInstanceOpen}
        onOpenChange={setEditingInstanceOpen}
        instanceId={editingInstanceId}
        clients={clients}
        modules={modules}
        projects={projects} // 7. Passar projetos para o modal
        onInstanceUpdated={async () => {
          await fetchPageData()
          toast.success("Instância atualizada com sucesso!")
        }}
      />
    </ProtectedLayout>
  )
}