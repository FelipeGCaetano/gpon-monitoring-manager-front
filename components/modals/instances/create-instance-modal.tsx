"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient } from "@/lib/api-client"
import { Client, EnvDefinition, ImageTemplate, Module, Project } from "@/lib/types"; // 2. Importar Project e ImageTemplate
import { Blocks, Container, Loader2, PenLine, Plus, X } from "lucide-react"; // 1. Importar PenLine
import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  CreateInstanceContainerModal,
  InstanceContainerData,
} from "./create-instance-container-modal"

interface CreateInstanceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInstanceCreated: () => void
  clients: Client[]
  modules: Module[]
  projects: Project[]
}

// 3. Helper para converter Serviço de Projeto em ContainerData (MAIS COMPLETO)
const projectServiceToContainerData = (
  service: any,
  allTemplates: ImageTemplate[],
  globalEnvs: { key: string, value: string }[]
): InstanceContainerData => {
  const template = allTemplates.find(t => t.id === service.imageTemplateId);
  const containerName = template?.name.toLowerCase().replace(/\s/g, '-') || `service-${service.startOrder}`;

  const globalEnvMap = new Map(globalEnvs.map(env => [env.key, env.value]));

  // Pré-popula as envs (com globais e CONTAINER_NAME)
  const envVariables = template?.envDefinitions.map((def: EnvDefinition) => {
    const isGlobal = globalEnvMap.has(def.key);
    let value = "";
    if (isGlobal) {
      value = globalEnvMap.get(def.key)!;
    } else if (def.key === "CONTAINER_NAME") {
      value = containerName;
    }
    return {
      key: def.key,
      value: value,
      isRequired: def.isRequired,
      isGlobal: isGlobal
    }
  }) || []

  return {
    tempId: crypto.randomUUID(),
    name: containerName,
    image: template?.image || "imagem-nao-encontrada",
    envVariables,
    ports: [], // Portas e volumes começam vazios para o usuário configurar
    volumes: [],
    network: { name: "", ip: "" }
  }
}

export function CreateInstanceModal({
  open,
  onOpenChange,
  onInstanceCreated,
  clients,
  modules,
  projects,
}: CreateInstanceModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true) // Para templates/settings

  // --- Estados do Formulário ---
  const [name, setName] = useState("")
  const [selectedClientId, setSelectedClientId] = useState("")
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([])
  const [containers, setContainers] = useState<InstanceContainerData[]>([])
  const [instanceType, setInstanceType] = useState<string>("PRODUCTION")
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")

  // --- 4. Estados para o Sub-Modal ---
  const [isContainerModalOpen, setIsContainerModalOpen] = useState(false)
  const [editingContainer, setEditingContainer] = useState<(InstanceContainerData & { tempId: string }) | null>(null)
  const [allImageTemplates, setAllImageTemplates] = useState<ImageTemplate[]>([])
  const [globalEnvs, setGlobalEnvs] = useState<{ key: string, value: string }[]>([])

  const selectedProject = projects.find(p => p.id === selectedProjectId)

  // --- Carregar dados para os Sub-modais (Templates e Settings) ---
  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        setIsLoadingData(true)
        try {
          const [templatesData, settingsData] = await Promise.all([
            apiClient.getImageTemplates(),
            apiClient.getSettings(),
          ])
          setAllImageTemplates(templatesData || [])
          setGlobalEnvs(settingsData?.globalEnv || [])
        } catch (error) {
          toast.error("Falha ao carregar dados de configuração.")
        } finally {
          setIsLoadingData(false)
        }
      }
      fetchData()
    }
  }, [open])

  // --- 5. Efeito para MODO PROJETO ---
  useEffect(() => {
    // Não roda se os templates ainda não carregaram
    if (isLoadingData) return;

    if (selectedProject) {
      // MODO PROJETO: Preenche os containers
      const projectContainers = selectedProject.services.map(service =>
        projectServiceToContainerData(service, allImageTemplates, globalEnvs) // Passa envs globais
      )
      setContainers(projectContainers)
    } else {
      // MODO MANUAL: Limpa os containers
      setContainers([])
    }
    // Módulos são sempre manuais, então limpamos
    setSelectedModuleIds([])
  }, [selectedProjectId, selectedProject, allImageTemplates, globalEnvs, isLoadingData]) // Depende dos dados carregados

  // --- Função para resetar o formulário ---
  const resetForm = () => {
    setName("")
    setSelectedClientId("")
    setSelectedModuleIds([])
    setContainers([])
    setInstanceType("PRODUCTION")
    setSelectedProjectId("")
    setIsSubmitting(false)
  }

  const handleCloseModal = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm()
    }
    onOpenChange(isOpen)
  }

  // --- Handlers de Módulos e Containers ---
  const handleModuleToggle = (moduleId: string) => {
    setSelectedModuleIds((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    )
  }

  // 6. Handlers para o sub-modal (Criar e Editar)
  const handleOpenAddContainer = () => {
    setEditingContainer(null) // Modo Criação
    setIsContainerModalOpen(true)
  }

  const handleOpenEditContainer = (container: InstanceContainerData) => {
    setEditingContainer(container) // Modo Edição
    setIsContainerModalOpen(true)
  }

  const handleSaveContainer = (containerData: InstanceContainerData) => {
    // Verifica se é uma edição (pelo tempId) ou adição
    const existing = containers.find(c => c.tempId === containerData.tempId);

    if (existing) {
      // Atualiza o container existente na lista
      setContainers(prev =>
        prev.map(c => c.tempId === containerData.tempId ? containerData : c)
      )
    } else {
      // Adiciona um novo container
      setContainers(prev => [...prev, containerData])
    }
    setEditingContainer(null)
    setIsContainerModalOpen(false)
  }

  const handleRemoveContainer = (tempId: string) => {
    setContainers((prev) => prev.filter((c) => c.tempId !== tempId))
  }

  // --- Handler de Submissão Principal ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (containers.length === 0) {
      toast.error("Você deve adicionar pelo menos um container à instância.")
      return
    }

    setIsSubmitting(true)
    try {
      // Mapeia os containers do formulário para o payload da API
      const finalContainers = containers.map(c => ({
        name: c.name,
        image: c.image,
        envVariables: c.envVariables.map(e => ({ key: e.key, value: e.value })),
        ports: c.ports.map(p => ({ ...p, ip: p.ip || undefined })), // Garante que IP é opcional
        volumes: c.volumes,
        network: c.network.name ? { ...c.network, ip: c.network.ip || undefined } : undefined,
      }))

      const payload = {
        name,
        clientId: selectedClientId,
        type: instanceType,
        projectTemplateId: selectedProjectId || null,
        moduleIds: selectedModuleIds,
        containers: finalContainers, // Envia os containers configurados
      }

      await apiClient.createInstance(payload as any) // 'as any' para simplificar
      onInstanceCreated()
      handleCloseModal(false)
    } catch (error: any) {
      console.error("Falha ao criar instância:", error)
      toast.error(error.message || "Falha ao criar instância.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Define quais templates o sub-modal pode ver
  const allowedTemplates = selectedProject
  ? selectedProject.services.map(s => s.imageTemplate) // Apenas templates do projeto
  : allImageTemplates; // Todos os templates

  return (
    <>
      <Dialog open={open} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Criar Nova Instância GPON</DialogTitle>
            <DialogDescription>
              Preencha os dados, selecione um projeto (opcional) e configure os containers.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden space-y-4">
            <div className="flex-1 overflow-y-auto p-1 space-y-4">

              {/* 1. Informações Gerais */}
              {/* ... (Nome, Cliente, Tipo) ... */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome da Instância</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Instância SP-Capital-01"
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cliente</label>
                  <Select
                    value={selectedClientId}
                    onValueChange={setSelectedClientId}
                    required
                    disabled={isSubmitting || clients.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 2. Seletor de Projeto */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Projeto (Recomendado)</label>
                <Select
                  value={selectedProjectId}
                  onValueChange={(value) => setSelectedProjectId(value === "--none--" ? "" : value)}
                  disabled={isSubmitting || projects.length === 0 || isLoadingData}
                >
                  <SelectTrigger>
                    {isLoadingData ? <Loader2 className="w-4 h-4 animate-spin" /> : <SelectValue placeholder="Selecione um projeto (ou configure manualmente)..." />}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="--none--">Nenhum (Configuração Manual)</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 3. Módulos (Sempre manual) */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Módulos Licenciados
                </label>
                {modules.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum módulo cadastrado no sistema.
                  </p>
                ) : (
                  <div className="p-4 border rounded-md max-h-40 overflow-y-auto space-y-3">
                    {modules.map((module) => (
                      <div key={module.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`mod-${module.id}`}
                          checked={selectedModuleIds.includes(module.id)}
                          onCheckedChange={() => handleModuleToggle(module.id)}
                          disabled={isSubmitting} // Sempre editável
                        />
                        <label
                          htmlFor={`mod-${module.id}`}
                          className="text-sm font-medium"
                        >
                          {module.name}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Containers (com botão de Edição) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Containers</label>
                  {/* Botão de Adicionar só aparece no modo manual */}
                  {!selectedProjectId && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={handleOpenAddContainer}
                      disabled={isSubmitting || isLoadingData}
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar Container
                    </Button>
                  )}
                </div>
                <div className="p-4 border rounded-md max-h-48 overflow-y-auto space-y-2">
                  {containers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {selectedProjectId ? "Este projeto não possui containers pré-definidos." : "Nenhum container adicionado."}
                    </p>
                  ) : (
                    containers.map((container, index) => (
                      <div key={container.tempId} className="flex items-center justify-between p-2 rounded bg-secondary">
                        <div className="flex items-center gap-2">
                          <Container className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{container.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{container.image}</p>
                          </div>
                          {selectedProject && (
                            <Badge variant="outline" className="gap-1.5 ml-2">
                              <Blocks className="w-3 h-3" />
                              {selectedProject.name}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {/* Botão de Editar */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditContainer(container)}
                            disabled={isSubmitting || isLoadingData}
                          >
                            <PenLine className="w-4 h-4" />
                          </Button>
                          {/* Botão de Remover (só em modo manual) */}
                          {!selectedProjectId && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveContainer(container.tempId)}
                              disabled={isSubmitting}
                              className="text-destructive hover:text-destructive"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Botão de Submissão */}
            <div className="mt-auto pt-6 border-t border-border">
              <Button type="submit" className="w-full" disabled={isSubmitting || isLoadingData || !selectedClientId || !name}>
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Criar Instância"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Renderiza o Sub-Modal */}
      <CreateInstanceContainerModal
        open={isContainerModalOpen}
        onOpenChange={setIsContainerModalOpen}
        onSave={handleSaveContainer}
        // Passa a lista de templates (filtrada ou completa) e as envs
        imageTemplates={allowedTemplates}
        globalEnvs={globalEnvs}
        // Passa o container para edição
        containerToEdit={editingContainer}
      />
    </>
  )
}