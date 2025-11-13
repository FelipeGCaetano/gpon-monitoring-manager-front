"use client"

import { CreateModuleModal } from "@/components/modals/modules/create-module-modal"; // Importa o novo modal
import ModuleAssignmentModal from "@/components/modals/modules/module-assignment-modal";
import { EditModuleModal } from "@/components/modals/modules/update-module-modal"; // 1. Importar o modal de EDIÇÃO
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/lib/api-client";
import { GponInstance, Module } from "@/lib/types";
import {
  Activity,
  Component,
  Container,
  Edit2,
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

export default function ModulesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // --- Estados dos Modais ---
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false) // 2. Estado para o modal de EDIÇÃO
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null) // 2. Estado para o ID
  const [selectedInstance, setSelectedInstance] = useState<GponInstance | null>(null) // Alterado de 'selectedContainer'

  // --- Estados de Dados da API ---
  const [modulesList, setModulesList] = useState<Module[]>([])
  const [instancesList, setInstancesList] = useState<GponInstance[]>([])
  const [isLoadingModules, setIsLoadingModules] = useState(true)
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true)

  // --- Funções de Busca ---
  const fetchModules = async () => {
    setIsLoadingModules(true)
    try {
      const data = await apiClient.getModules()
      setModulesList(data || [])
    } catch (error) {
      console.error("Falha ao buscar módulos:", error)
      // TODO: Toast de erro
    } finally {
      setIsLoadingModules(false)
    }
  }

  const fetchInstances = async () => {
    setIsLoadingAssignments(true)
    try {
      const data = await apiClient.getInstances() // Instâncias incluem seus módulos
      setInstancesList(data || [])
    } catch (error) {
      console.error("Falha ao buscar instâncias:", error)
      // TODO: Toast de erro
    } finally {
      setIsLoadingAssignments(false)
    }
  }

  // Carrega todos os dados no mount
  useEffect(() => {
    fetchModules()
    fetchInstances()
  }, [])

  // --- Ações da API ---

  const handleDeleteModule = async (moduleId: string) => {
    if (!window.confirm("Tem certeza que deseja deletar este módulo?")) {
      return
    }
    try {
      await apiClient.deleteModule(moduleId)
      await fetchModules() // Recarrega os módulos
      // TODO: Toast de sucesso
    } catch (error) {
      console.error("Falha ao deletar módulo:", error)
      // TODO: Toast de erro
    }
  }

  // Abre o modal de atribuição
  const handleOpenAssignment = (instance: GponInstance) => {
    setSelectedInstance(instance) // Salva a instância selecionada
    setShowAssignmentModal(true)
  }

  // 3. Handler para abrir o modal de EDIÇÃO
  const handleOpenEditModal = (module: Module) => {
    setSelectedModuleId(module.id)
    setIsEditModalOpen(true)
  }

  // Salva a atribuição (chamado pelo modal)
  const handleSaveModuleAssignment = async (
    instanceId: string,
    moduleIds: string[]
  ) => {
    try {
      await apiClient.syncInstanceModules(instanceId, { newModuleIds: moduleIds })
      await fetchInstances() // Recarrega a lista de instâncias
    } catch (error) {
      console.error("Falha ao sincronizar módulos:", error)
      // Lança o erro para o modal poder tratar (mostrar toast, etc)
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
              <h1 className="text-3xl font-bold text-foreground">Módulos & Licenças</h1>
              <p className="text-muted-foreground">Gerenciar implantações de módulos e licenças</p>
            </div>
            <Button className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4" />
              Adicionar Módulo
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
                  <CardTitle>Módulos Disponíveis</CardTitle>
                  <CardDescription>Todos os módulos cadastrados no sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome do Módulo</TableHead>
                          <TableHead>Versão do Módulo</TableHead>
                          <TableHead>Instâncias Atribuídas</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingModules ? (
                          <LoadingRow cols={3} />
                        ) : modulesList.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center">
                              Nenhum módulo encontrado.
                            </TableCell>
                          </TableRow>
                        ) : (
                          modulesList.map((module) => (
                            <TableRow key={module.id}>
                              <TableCell className="font-medium">{module.name}</TableCell>
                              <TableCell className="font-medium">{module.version}</TableCell>
                              <TableCell className="text-sm">{module.instances.length}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {/* 4. Adicionar o botão de Editar Módulo */}
                                  <Button size="sm" variant="ghost" onClick={() => handleOpenEditModal(module)}>
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => handleDeleteModule(module.id)}
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

            {/* Assignments Tab */}
            <TabsContent value="assignments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Atribuições de Módulos (por Instância)</CardTitle>
                  <CardDescription>Gerenciar quais módulos estão licenciados para cada instância GPON</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Instância GPON</TableHead>
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
                              <TableCell className="font-medium">{instance.client.name}</TableCell>
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
                                <Button size="sm" variant="ghost" onClick={() => handleOpenAssignment(instance)}>
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
      </main>

      {/* --- Modais --- */}

      {/* Modal de Atribuição (agora usa dados reais) */}
      <ModuleAssignmentModal
        instance={selectedInstance}
        availableModules={modulesList} // Passa a lista de módulos da API
        isOpen={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        onSave={handleSaveModuleAssignment} // Passa a função de salvar
      />

      {/* Modal de Criação */}
      <CreateModuleModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onModuleCreated={fetchModules} // Recarrega os módulos após criar
      />

      {/* 5. Renderizar o novo modal de EDIÇÃO */}
      <EditModuleModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        moduleId={selectedModuleId}
        onModuleUpdated={fetchModules} // Recarrega os módulos após editar
      />
    </div>
  )
}