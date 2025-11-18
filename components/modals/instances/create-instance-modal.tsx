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
import { Client, EnvDefinition, ImageTemplate, Module, Project } from "@/lib/types"
import { AlertTriangle, Blocks, Container, Loader2, PenLine, Plus, X } from "lucide-react"; // Adicionado AlertTriangle
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

// Helper para converter Serviço de Projeto em ContainerData
const projectServiceToContainerData = (
  service: any,
  allTemplates: ImageTemplate[],
  globalEnvs: { key: string, value: string }[]
): InstanceContainerData => {
  const template = allTemplates.find(t => t.id === service.imageTemplateId);
  const containerName = template?.name.toLowerCase().replace(/\s/g, '-') || `service-${service.startOrder}`;

  const globalEnvMap = new Map(globalEnvs.map(env => [env.key, env.value]));

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
    ports: [],
    volumes: [],
    network: { name: "", ip: "" }
  }
}

// NOVO: Função auxiliar para validar um container individualmente
const validateContainer = (container: InstanceContainerData): boolean => {
  // Verifica se existe alguma env obrigatória, não global, que esteja vazia
  const hasMissingEnv = container.envVariables.some(
    env => env.isRequired && !env.isGlobal && !env.value
  );

  // Se tiver env faltando, retorna false (inválido). Se não tiver, retorna true (válido).
  return !hasMissingEnv;
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
  const [isLoadingData, setIsLoadingData] = useState(true)

  const [name, setName] = useState("")
  const [selectedClientId, setSelectedClientId] = useState("")
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([])
  const [containers, setContainers] = useState<InstanceContainerData[]>([])
  const [instanceType, setInstanceType] = useState<string>("PRODUCTION")
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")

  const [isContainerModalOpen, setIsContainerModalOpen] = useState(false)
  const [editingContainer, setEditingContainer] = useState<(InstanceContainerData & { tempId: string }) | null>(null)
  const [allImageTemplates, setAllImageTemplates] = useState<ImageTemplate[]>([])
  const [globalEnvs, setGlobalEnvs] = useState<{ key: string, value: string }[]>([])

  const selectedProject = projects.find(p => p.id === selectedProjectId)

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

  useEffect(() => {
    if (isLoadingData) return;

    if (selectedProject) {
      const projectContainers = selectedProject.services.map(service =>
        projectServiceToContainerData(service, allImageTemplates, globalEnvs)
      )
      setContainers(projectContainers)
    } else {
      setContainers([])
    }
    setSelectedModuleIds([])
  }, [selectedProjectId, selectedProject, allImageTemplates, globalEnvs, isLoadingData])

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

  const handleModuleToggle = (moduleId: string) => {
    setSelectedModuleIds((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    )
  }

  const handleOpenAddContainer = () => {
    setEditingContainer(null)
    setIsContainerModalOpen(true)
  }

  const handleOpenEditContainer = (container: InstanceContainerData) => {
    setEditingContainer(container)
    setIsContainerModalOpen(true)
  }

  const handleSaveContainer = (containerData: InstanceContainerData) => {
    const existing = containers.find(c => c.tempId === containerData.tempId);
    if (existing) {
      setContainers(prev =>
        prev.map(c => c.tempId === containerData.tempId ? containerData : c)
      )
    } else {
      setContainers(prev => [...prev, containerData])
    }
    setEditingContainer(null)
    setIsContainerModalOpen(false)
  }

  const handleRemoveContainer = (tempId: string) => {
    setContainers((prev) => prev.filter((c) => c.tempId !== tempId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (containers.length === 0) {
      toast.error("Você deve adicionar pelo menos um container à instância.")
      return
    }

    // NOVO: Validação de containers pendentes
    const invalidContainers = containers.filter(c => !validateContainer(c));
    if (invalidContainers.length > 0) {
      toast.error(`Existem configurações pendentes nos seguintes containers: ${invalidContainers.map(c => c.name).join(", ")}. Por favor, edite-os.`);
      return;
    }

    setIsSubmitting(true)
    try {
      const finalContainers = containers.map(c => ({
        name: c.name,
        image: c.image,
        envVariables: c.envVariables.map(e => ({ key: e.key, value: e.value })),
        ports: c.ports.map(p => ({ ...p, ip: p.ip || undefined })),
        volumes: c.volumes,
        network: c.network.name ? { ...c.network, ip: c.network.ip || undefined } : undefined,
      }))

      const payload = {
        name,
        clientId: selectedClientId,
        type: instanceType,
        projectTemplateId: selectedProjectId || null,
        moduleIds: selectedModuleIds,
        containers: finalContainers,
      }

      await apiClient.createInstance(payload as any)
      onInstanceCreated()
      handleCloseModal(false)
    } catch (error: any) {
      console.error("Falha ao criar instância:", error)
      toast.error(error.message || "Falha ao criar instância.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const allowedTemplates = selectedProject
    ? selectedProject.services.map(s => s.imageTemplate)
    : allImageTemplates;

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
                          disabled={isSubmitting}
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

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Containers</label>
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
                    containers.map((container, index) => {
                      // NOVO: Verifica validade para exibir alerta visual
                      const isValid = validateContainer(container);

                      return (
                        <div key={container.tempId} className={`flex items-center justify-between p-2 rounded ${isValid ? 'bg-secondary' : 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800'}`}>
                          <div className="flex items-center gap-2">
                            {isValid ? (
                              <Container className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                            )}

                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">{container.name}</p>
                                {!isValid && <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-500 bg-amber-100 dark:bg-amber-900 px-1.5 rounded">Pendente</span>}
                              </div>
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
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditContainer(container)}
                              disabled={isSubmitting || isLoadingData}
                            >
                              <PenLine className="w-4 h-4" />
                            </Button>
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
                      )
                    })
                  )}
                </div>
              </div>
            </div>

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

      <CreateInstanceContainerModal
        open={isContainerModalOpen}
        onOpenChange={setIsContainerModalOpen}
        onSave={handleSaveContainer}
        imageTemplates={allowedTemplates}
        globalEnvs={globalEnvs}
        containerToEdit={editingContainer}
      />
    </>
  )
}