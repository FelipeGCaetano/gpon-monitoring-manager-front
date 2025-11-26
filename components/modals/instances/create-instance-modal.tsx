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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient } from "@/lib/api-client"
import { Client, EnvDefinition, ImageTemplate, Module, Project } from "@/lib/types"
import { AlertTriangle, Blocks, Container, Globe, Loader2, Lock, PenLine, Plus, X } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  CreateInstanceContainerModal,
  InstanceContainerData,
} from "./create-instance-container-modal"; // Assumindo que este import existe e usa os tipos do CreateContainerModal

// --- Tipos para o formulário de container (necessário para o auxiliar) ---
interface FormEnvVar {
  key: string;
  value: string;
  isRequired: boolean;
  isGlobal: boolean;
}
interface FormPortMap {
  privatePort: number | string;
  publicPort: number | string;
  ip?: string;
}
interface FormNetworkConfig {
  name: string
  ip: string
}

// NOVO: Tipo para a configuração de Domínio a nível de Instância
interface FormInstanceDomainConfig {
  id: string; // Para chaves de lista (tempId)
  domain: string;
  targetContainerName: string; // Nome do container para onde rotear
  targetPort: string; // A porta INTERNA do container (string no formulário, number na API)
  sslEnable: boolean;
}

const createDefaultDomain = (): FormInstanceDomainConfig => ({
  id: crypto.randomUUID(),
  domain: "",
  targetContainerName: "",
  targetPort: "",
  sslEnable: false
});

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
    } as FormEnvVar
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
  const [instanceDomains, setInstanceDomains] = useState<FormInstanceDomainConfig[]>([createDefaultDomain()]) // NOVO: Estado para múltiplos domínios
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
    setInstanceDomains([createDefaultDomain()]) // Resetar domínios
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
    // Também remove qualquer domínio que aponte para este container
    const containerName = containers.find(c => c.tempId === tempId)?.name;
    if (containerName) {
      setInstanceDomains(prev => prev.filter(d => d.targetContainerName !== containerName));
    }

    setContainers((prev) => prev.filter((c) => c.tempId !== tempId))
  }

  // --- Lógica de Domínios de Instância ---
  const handleDomainChange = (id: string, field: keyof FormInstanceDomainConfig, value: string | boolean) => {
    setInstanceDomains(currentDomains => {
      let updatedDomains = currentDomains.map(d => (
        d.id === id ? { ...d, [field]: value } : d
      ));

      return updatedDomains;
    });
  }

  const addDomain = () => setInstanceDomains([...instanceDomains.filter(d => d.domain.trim()), createDefaultDomain()])

  const removeDomain = (id: string) => {
    setInstanceDomains(prev => prev.filter(d => d.id !== id));
  }
  // --- Fim da Lógica de Domínios de Instância ---


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (containers.length === 0) {
      toast.error("Você deve adicionar pelo menos um container à instância.")
      return
    }

    // 1. Validação de containers pendentes (variáveis de ambiente)
    const invalidContainers = containers.filter(c => !validateContainer(c));
    if (invalidContainers.length > 0) {
      toast.error(`Existem configurações pendentes nos seguintes containers: ${invalidContainers.map(c => c.name).join(", ")}. Por favor, edite-os.`);
      return;
    }

    // 2. Validação e Montagem dos Domínios em um Lookup
    const domainsToSubmit = instanceDomains.filter(d => d.domain.trim());
    const domainLookup: Record<string, { domain: string, targetPort: number, sslEnable: boolean }> = {};

    for (const d of domainsToSubmit) {
      if (!d.domain.trim()) continue;

      const targetPortNum = parseInt(d.targetPort, 10);
      if (!d.targetContainerName) {
        toast.error(`O domínio '${d.domain}' deve estar vinculado a um container.`);
        return;
      }
      if (!d.targetPort || isNaN(targetPortNum) || targetPortNum <= 0 || targetPortNum > 65535) {
        toast.error(`A Porta de Destino deve ser um número válido (1-65535) para o domínio '${d.domain}'.`);
        return;
      }
      if (!containers.some(c => c.name === d.targetContainerName)) {
        toast.error(`O container de destino '${d.targetContainerName}' para o domínio '${d.domain}' não existe.`);
        return;
      }

      // Cria o objeto de domínio aninhado (sem containerName) e o armazena no lookup
      domainLookup[d.targetContainerName] = {
        domain: d.domain.trim(),
        targetPort: targetPortNum,
        sslEnable: d.sslEnable,
      };
    }

    setIsSubmitting(true)
    try {
      // 3. Mapeamento dos Containers e Anexação do Domínio
      const finalContainers = containers.map(c => {
        const domainConfig = domainLookup[c.name];

        const containerPayload: any = {
          name: c.name,
          image: c.image,
          envVariables: c.envVariables.map(e => ({ key: e.key, value: e.value })),
          ports: c.ports.map(p => ({
            privatePort: typeof p.privatePort === 'string' ? parseInt(p.privatePort, 10) : p.privatePort,
            publicPort: typeof p.publicPort === 'string' ? parseInt(p.publicPort, 10) : p.publicPort,
            ip: p.ip || undefined
          })).filter(p => p.privatePort && p.publicPort) as any,
          volumes: c.volumes,
          network: c.network.name ? { ...c.network, ip: c.network.ip || undefined } : undefined,
        };

        if (domainConfig) {
          containerPayload.domain = domainConfig; // Anexa o objeto domain ao container
        }

        return containerPayload;
      });

      // 4. Montagem do Payload Final (sem o array 'domains' no nível raiz)
      const payload = {
        name,
        clientId: selectedClientId,
        type: instanceType,
        projectTemplateId: selectedProjectId || null,
        moduleIds: selectedModuleIds,
        containers: finalContainers,
        // domains: REMOVIDO
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


  const renderDomainInputs = () => {
    const availableContainerNames = containers.map(c => c.name);

    return (
      <div className="space-y-4">
        {instanceDomains.map((item, index) => (
          <div key={item.id} className="p-4 border rounded-md space-y-3 relative">
            {/* Botão de Remover */}
            <div className='absolute top-2 right-2'>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeDomain(item.id)}
                disabled={isSubmitting && instanceDomains.length === 1}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-sm font-medium flex items-center gap-1">
                Domínio/Hostname
              </label>
              <Input
                value={item.domain}
                onChange={(e) => handleDomainChange(item.id, 'domain', e.target.value)}
                placeholder="Ex: app.meuservico.com.br"
                disabled={isSubmitting}
                className="pr-10"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Container de Destino <span className="text-destructive">*</span>
                </label>
                <Select
                  value={item.targetContainerName}
                  onValueChange={(value) => handleDomainChange(item.id, 'targetContainerName', value)}
                  disabled={isSubmitting || availableContainerNames.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o container..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableContainerNames.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableContainerNames.length === 0 && (
                  <p className="text-xs text-destructive">Adicione containers na aba Containers.</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  Porta Pública do host <span className="text-destructive">*</span>
                </label>
                <Input
                  type="number"
                  value={item.targetPort}
                  onChange={(e) => handleDomainChange(item.id, 'targetPort', e.target.value)}
                  placeholder="Ex: 80"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 p-3 rounded-md border bg-secondary/30 w-fit">
              <input
                type="checkbox"
                id={`ssl-enable-${item.id}`}
                checked={item.sslEnable}
                onChange={(e) => handleDomainChange(item.id, 'sslEnable', e.target.checked)}
                disabled={isSubmitting}
                className="rounded text-primary focus:ring-primary h-4 w-4 border-gray-300"
              />
              <label htmlFor={`ssl-enable-${item.id}`} className="text-sm font-medium cursor-pointer flex items-center gap-2">
                Habilitar SSL/TLS (HTTPS) <Lock className="w-4 h-4 text-emerald-600" />
              </label>
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addDomain}
          disabled={isSubmitting || containers.length === 0}
          className="gap-2"
        >
          <Globe className="w-4 h-4" /> Adicionar Domínio
        </Button>
      </div>
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Criar Nova Instância GPON</DialogTitle>
            <DialogDescription>
              Preencha os dados, selecione um projeto (opcional) e configure os containers e domínios.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden space-y-4">
            <div className="flex-1 overflow-y-auto p-1 space-y-4">

              <Tabs defaultValue="general" className="space-y-4">
                {/* TabsList com 4 colunas (Geral, Módulos, Containers, Domínios) */}
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="general">Geral</TabsTrigger>
                  <TabsTrigger value="modules">Módulos</TabsTrigger>
                  <TabsTrigger value="containers">Containers</TabsTrigger>
                  <TabsTrigger value="domains">Domínios</TabsTrigger>
                  {/* Aba "Rede" removida daqui */}
                </TabsList>

                <TabsContent value="general" className="space-y-4">
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
                </TabsContent>

                <TabsContent value="modules" className="space-y-4">
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
                </TabsContent>

                <TabsContent value="containers" className="space-y-4">
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
                </TabsContent>

                <TabsContent value="domains" className="space-y-4">
                  {renderDomainInputs()}
                </TabsContent>

              </Tabs>
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