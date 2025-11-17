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
import { Client, Container as ContainerType, EnvDefinition, ImageTemplate, Module, Project } from "@/lib/types"
import { Blocks, Container, Loader2, PenLine, Plus, X } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
    CreateInstanceContainerModal,
    InstanceContainerData,
} from "./create-instance-container-modal"; // Reutiliza o sub-modal

interface EditInstanceModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onInstanceUpdated: () => void
    instanceId: string | null | undefined
    clients: Client[]
    modules: Module[]
    projects: Project[]
}

// Interface para o formulário
interface InstanceFormData {
    name: string
    clientId: string
    moduleIds: string[]
    containers: InstanceContainerData[] // Usamos o tipo do payload
    projectTemplateId: string | null
}

// Helper para converter Serviço de Projeto em ContainerData (Igual ao do Create)
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

// Helper para converter Container (do DB) para InstanceContainerData (do Formulário)
const containerToContainerData = (container: ContainerType): InstanceContainerData => ({
    tempId: container.id, // Usa o ID real do container como tempId inicial
    name: container.name,
    image: container.imageTemplate.image,
    // Precisamos garantir que o tipo corresponde ao Omit<FormEnvVar, ...>
    envVariables: container.envVariables.map(e => ({
        key: e.key,
        value: e.value,
        isRequired: false, // Info perdida, mas podemos buscar do template
        isGlobal: false // Info perdida
    })),
    ports: container.portMapping.map(p => ({
        privatePort: p.privatePort,
        publicPort: p.publicPort,
        ip: p.ip
    })),
    volumes: container.volumeMapping.map(v => ({
        name: v.hostVolumeName, // Ajuste do nome do campo
        containerPath: v.containerPath
    })),
    network: container.networkMapping ? {
        name: container.networkMapping.hostNetworkName, // Ajuste do nome do campo
        ip: container.networkMapping.ipAddress || ""
    } : { name: "", ip: "" },
});

export function EditInstanceModal({
    open,
    onOpenChange,
    onInstanceUpdated,
    instanceId,
    clients,
    modules,
    projects,
}: EditInstanceModalProps) {
    const [formData, setFormData] = useState<InstanceFormData | null>(null)
    const [isLoading, setIsLoading] = useState(true) // Loading da instância
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Estados do sub-modal
    const [isContainerModalOpen, setIsContainerModalOpen] = useState(false)
    const [editingContainer, setEditingContainer] = useState<(InstanceContainerData & { tempId: string }) | null>(null)
    const [allImageTemplates, setAllImageTemplates] = useState<ImageTemplate[]>([])
    const [globalEnvs, setGlobalEnvs] = useState<{ key: string, value: string }[]>([])
    const [isLoadingData, setIsLoadingData] = useState(false) // Loading do sub-modal
    const [containers, setContainers] = useState<InstanceContainerData[]>([])

    const selectedProject = projects.find(p => p.id === formData?.projectTemplateId)

    // Carrega dados da instância E todos os templates/settings
    useEffect(() => {
        if (open && instanceId) {
            const fetchAllData = async () => {
                setIsLoading(true)
                setIsLoadingData(true)
                try {
                    const [instanceData, templatesData, settingsData] = await Promise.all([
                        apiClient.getInstanceById(instanceId),
                        apiClient.getImageTemplates(),
                        apiClient.getSettings(),
                    ])

                    setAllImageTemplates(templatesData || [])
                    setGlobalEnvs(settingsData?.globalEnv || [])

                    if (instanceData) {
                        setFormData({
                            name: instanceData.name,
                            clientId: instanceData.clientId,
                            moduleIds: instanceData.modules.map((m: any) => m.id),
                            containers: (instanceData.containers || []).map(containerToContainerData),
                            projectTemplateId: instanceData.projectTemplateId || null,
                        })
                    }
                } catch (error) {
                    console.error("Falha ao buscar dados da instância:", error)
                    toast.error("Falha ao buscar dados da instância.")
                    onOpenChange(false)
                } finally {
                    setIsLoading(false)
                    setIsLoadingData(false)
                }
            }
            fetchAllData()
        } else if (!open) {
            setFormData(null)
        }
    }, [open, instanceId])

    // Efeito para Modo Projeto (Edição)
    // Auto-preenche se o usuário MUDAR para um projeto
    useEffect(() => {
        if (isLoading || isLoadingData || !formData) return;

        // Só auto-preenche se o ID do projeto MUDOU
        if (selectedProject && selectedProject.id !== formData.projectTemplateId) {
            const projectContainers = selectedProject.services.map(service =>
                projectServiceToContainerData(service, allImageTemplates, globalEnvs)
            )
            setFormData(prev => prev ? { ...prev, containers: projectContainers, projectTemplateId: selectedProject.id } : null)
        }
        // Se o usuário selecionar "Nenhum", limpamos o projectTemplateId mas mantemos os containers
        else if (!selectedProject && formData.projectTemplateId) {
            setFormData(prev => prev ? { ...prev, projectTemplateId: null } : null)
        }

    }, [selectedProject, allImageTemplates, globalEnvs, isLoading, isLoadingData, formData?.projectTemplateId]);


    // Handler para salvar
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!instanceId || !formData) return

        if (formData.containers.length === 0) {
            toast.error("Uma instância deve ter pelo menos um container.")
            return
        }

        setIsSubmitting(true)
        try {
            // Mapeia os containers do formulário para o payload da API
            const finalContainers = formData.containers.map(c => ({
                name: c.name,
                image: c.image,
                envVariables: c.envVariables.map(e => ({ key: e.key, value: e.value })),
                ports: c.ports.map(p => ({ ...p, ip: p.ip || undefined })),
                volumes: c.volumes,
                network: c.network.name ? { ...c.network, ip: c.network.ip || undefined } : undefined,
            }))

            const payload = {
                name: formData.name,
                clientId: formData.clientId,
                projectTemplateId: formData.projectTemplateId || null,
                moduleIds: formData.moduleIds, // Módulos manuais
                containers: finalContainers, // Containers (do projeto ou manuais)
            }

            await apiClient.updateInstance(instanceId, payload as any)

            toast.success("Instância atualizada com sucesso.")
            onInstanceUpdated()
            onOpenChange(false)
        } catch (error: any) {
            console.error("Falha ao atualizar instância:", error)
            toast.error(error.message || "Falha ao atualizar instância.")
        } finally {
            setIsSubmitting(false)
        }
    }

    // Handlers do formulário
    const handleFieldChange = (field: keyof InstanceFormData, value: string | null) => {
        setFormData((prev) => (prev ? { ...prev, [field]: value } : null))
    }

    const handleModuleToggle = (moduleId: string) => {
        setFormData((prev) => {
            if (!prev) return null
            const newModuleIds = prev.moduleIds.includes(moduleId)
                ? prev.moduleIds.filter((id) => id !== moduleId)
                : [...prev.moduleIds, moduleId]
            return { ...prev, moduleIds: newModuleIds }
        })
    }

    // Handlers do Sub-modal
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
        const existing = formData?.containers.find(c => c.tempId === containerData.tempId);

        if (existing) {
            // Atualiza o container existente na lista
            setFormData(prev => prev ? ({
                ...prev,
                containers: prev.containers.map(c => c.tempId === containerData.tempId ? containerData : c)
            }) : null)
        } else {
            // Adiciona um novo container
            setFormData(prev => prev ? ({
                ...prev,
                containers: [...prev.containers, containerData]
            }) : null)
        }
        setEditingContainer(null)
        setIsContainerModalOpen(false)
    }

    const handleRemoveContainer = (tempId: string) => {
        setFormData(prev => prev ? ({
            ...prev,
            containers: prev.containers.filter((c) => c.tempId !== tempId)
        }) : null)
    }

    // Define quais templates o sub-modal pode ver
    const allowedTemplates = selectedProject
        ? selectedProject.services.map(s => s.imageTemplate)
        : allImageTemplates;


    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Editar Instância GPON</DialogTitle>
                        <DialogDescription>
                            Altere os dados da instância selecionada.
                        </DialogDescription>
                    </DialogHeader>

                    {isLoading || !formData ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden space-y-4">
                            <div className="flex-1 overflow-y-auto p-1 space-y-4">

                                {/* 1. Informações Gerais */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nome da Instância</label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => handleFieldChange("name", e.target.value)}
                                        placeholder="Ex: Instância SP-Capital-01"
                                        disabled={isSubmitting}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Cliente</label>
                                        <Select
                                            value={formData.clientId}
                                            onValueChange={(value) => handleFieldChange("clientId", value)}
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

                                {/* Seletor de Projeto */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Projeto</label>
                                    <Select
                                        value={formData.projectTemplateId || "--none--"}
                                        onValueChange={(value) => handleFieldChange("projectTemplateId", value === "--none--" ? null : value)}
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

                                {/* Módulos (Sempre manual) */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        Módulos Licenciados
                                    </label>
                                    <div className="p-4 border rounded-md max-h-40 overflow-y-auto space-y-3">
                                        {modules.map((module) => (
                                            <div key={module.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`edit-mod-${module.id}`}
                                                    checked={formData.moduleIds.includes(module.id)}
                                                    onCheckedChange={() => handleModuleToggle(module.id)}
                                                    disabled={isSubmitting} // Sempre editável
                                                />
                                                <label
                                                    htmlFor={`edit-mod-${module.id}`}
                                                    className="text-sm font-medium"
                                                >
                                                    {module.name}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Containers */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium">Containers</label>
                                        {/* Botão de Adicionar (só em modo manual) */}
                                        {!selectedProject && (
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
                                        {formData.containers.length === 0 ? (
                                            <p className="text-sm text-muted-foreground text-center py-4">
                                                Nenhum container nesta instância.
                                            </p>
                                        ) : (
                                            formData.containers.map((container, index) => (
                                                <div key={container.tempId} className="flex items-center justify-between p-2 rounded bg-secondary">
                                                    <div className="flex items-center gap-2">
                                                        <Container className="w-4 h-4 text-muted-foreground" />
                                                        <div>
                                                            <p className="text-sm font-medium">{container.name}</p>
                                                            <p className="text-xs text-muted-foreground font-mono">{container.image}</p>
                                                        </div>
                                                        {selectedProject && selectedProject.services.find(s => s.imageTemplate.image === container.image) && (
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
                                                        {!selectedProject && (
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
                                <Button type="submit" className="w-full" disabled={isSubmitting || isLoading}>
                                    {isSubmitting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        "Salvar Alterações"
                                    )}
                                </Button>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Renderiza o Sub-Modal (Passando os templates permitidos) */}
            <CreateInstanceContainerModal
                open={isContainerModalOpen}
                onOpenChange={setIsContainerModalOpen}
                onSave={handleSaveContainer}
                // Passa a lista de templates (filtrada ou completa) e as envs
                imageTemplates={allowedTemplates}
                globalEnvs={globalEnvs}
                containerToEdit={editingContainer}
            />
        </>
    )
}