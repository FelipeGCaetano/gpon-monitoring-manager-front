"use client"

import { ProtectedLayout } from "@/components/layout/protected-layout"
import { CreateModuleModal } from "@/components/modals/modules/create-module-modal"
import ModuleAssignmentModal from "@/components/modals/modules/module-assignment-modal"
import { EditModuleModal } from "@/components/modals/modules/update-module-modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient } from "@/lib/api-client"
import { GponInstance, Module } from "@/lib/types"
import { Edit2, Loader2, Plus, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useAuth } from "../auth-context"

export default function ModulesPage() {
  const { userCan } = useAuth()

  // --- Estados dos Modais ---
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)
  const [selectedInstance, setSelectedInstance] = useState<GponInstance | null>(null)

  // --- Estados de Dados da API ---
  const [modulesList, setModulesList] = useState<Module[]>([])
  const [instancesList, setInstancesList] = useState<GponInstance[]>([])
  const [isLoadingModules, setIsLoadingModules] = useState(true)
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true)

  // --- Funções de Busca ---
  const fetchModules = async () => {
    setIsLoadingModules(true)
    if (userCan("read:modules")) {
      try {
        const data = await apiClient.getModules()
        setModulesList(data || [])
      } catch (error) {
        console.error("Falha ao buscar módulos:", error)
      } finally {
        setIsLoadingModules(false)
      }
    } else {
      setModulesList([])
      setIsLoadingModules(false)
    }
  }

  const fetchInstances = async () => {
    setIsLoadingAssignments(true)
    if (userCan("read:instances")) {
      try {
        const data = await apiClient.getInstances()
        setInstancesList(data || [])
      } catch (error) {
        console.error("Falha ao buscar instâncias:", error)
      } finally {
        setIsLoadingAssignments(false)
      }
    } else {
      setInstancesList([])
      setIsLoadingAssignments(false)
    }
  }

  useEffect(() => {
    fetchModules()
    fetchInstances()
  }, [])

  // --- Ações ---
  const handleDeleteModule = async (moduleId: string) => {
    if (!window.confirm("Tem certeza que deseja deletar este módulo?")) return
    try {
      await apiClient.deleteModule(moduleId)
      await fetchModules()
    } catch (error) {
      console.error("Falha ao deletar módulo:", error)
    }
  }

  const handleOpenAssignment = (instance: GponInstance) => {
    setSelectedInstance(instance)
    setShowAssignmentModal(true)
  }

  const handleOpenEditModal = (module: Module) => {
    setSelectedModuleId(module.id)
    setIsEditModalOpen(true)
  }

  const handleSaveModuleAssignment = async (instanceId: string, moduleIds: string[]) => {
    try {
      await apiClient.syncInstanceModules(instanceId, { newModuleIds: moduleIds })
      await fetchInstances()
    } catch (error) {
      console.error("Falha ao sincronizar módulos:", error)
      throw error
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
    <ProtectedLayout
      title="Módulos & Licenças"
      description="Gerencie implantações e licenças de módulos para instâncias GPON"
    >
      <div className="space-y-6">
        <Tabs defaultValue="modules" className="space-y-4">
          <TabsList>
            <TabsTrigger value="modules">Módulos</TabsTrigger>
            <TabsTrigger value="assignments">Atribuições</TabsTrigger>
          </TabsList>

          {/* Aba de Módulos */}
          <TabsContent value="modules" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Módulos Disponíveis</CardTitle>
                    <CardDescription>Todos os módulos cadastrados no sistema</CardDescription>
                  </div>
                  {userCan("create:modules") && (
                    <Button className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
                      <Plus className="w-4 h-4" />
                      Adicionar Módulo
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome do Módulo</TableHead>
                        <TableHead>Versão</TableHead>
                        <TableHead>Instâncias Atribuídas</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingModules ? (
                        <LoadingRow cols={4} />
                      ) : modulesList.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center">
                            Nenhum módulo encontrado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        modulesList.map((module) => (
                          <TableRow key={module.id}>
                            <TableCell className="font-medium">{module.name}</TableCell>
                            <TableCell>{module.version}</TableCell>
                            <TableCell>{module.instances.length}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {userCan("update:module") && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleOpenEditModal(module)}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                )}
                                {userCan("delete:module") && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => handleDeleteModule(module.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
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
          </TabsContent>

          {/* Aba de Atribuições */}
          <TabsContent value="assignments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Atribuições de Módulos (por Instância)</CardTitle>
                <CardDescription>Gerencie quais módulos estão atribuídos a cada instância GPON</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Instância</TableHead>
                        <TableHead>Módulos Atribuídos</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingAssignments ? (
                        <LoadingRow cols={3} />
                      ) : instancesList.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="h-24 text-center">
                            Nenhuma instância encontrada.
                          </TableCell>
                        </TableRow>
                      ) : (
                        instancesList.map((instance) => (
                          <TableRow key={instance.id}>
                            <TableCell className="font-medium">{instance.name}</TableCell>
                            <TableCell>
                              <div className="flex gap-1 flex-wrap">
                                {instance.modules.length > 0 ? (
                                  instance.modules.map((mod) => (
                                    <Badge key={mod.id} variant="secondary" className="text-xs">
                                      {mod.name}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-xs text-muted-foreground">Nenhum</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenAssignment(instance)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
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

      {/* --- Modais --- */}
      <ModuleAssignmentModal
        instance={selectedInstance}
        availableModules={modulesList}
        isOpen={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        onSave={handleSaveModuleAssignment}
      />

      <CreateModuleModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onModuleCreated={fetchModules}
      />

      <EditModuleModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        moduleId={selectedModuleId}
        onModuleUpdated={fetchModules}
      />
    </ProtectedLayout>
  )
}
