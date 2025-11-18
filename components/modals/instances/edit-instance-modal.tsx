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
import { AlertTriangle, Blocks, Container, Loader2, PenLine, Plus, X } from "lucide-react"; // Adicionado AlertTriangle
import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
    CreateInstanceContainerModal,
    InstanceContainerData,
} from "./create-instance-container-modal"

interface EditInstanceModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onInstanceUpdated: () => void
    instanceId: string | null | undefined
    clients: Client[]
    modules: Module[]
    projects: Project[]
}

interface InstanceFormData {
    name: string
    clientId: string
    moduleIds: string[]
    containers: InstanceContainerData[]
    projectTemplateId: string | null
}

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

const containerToContainerData = (container: ContainerType): InstanceContainerData => ({
    tempId: container.id,
    name: container.name,
    image: container.imageTemplate.image,
    envVariables: container.envVariables.map(e => ({
        key: e.key,
        value: e.value,
        isRequired: false,
        isGlobal: false
    })),
    ports: container.portMapping.map(p => ({
        privatePort: p.privatePort,
        publicPort: p.publicPort,
        ip: p.ip
    })),
    volumes: container.volumeMapping.map(v => ({
        name: v.hostVolumeName,
        containerPath: v.containerPath
    })),
    network: container.networkMapping ? {
        name: container.networkMapping.hostNetworkName,
        ip: container.networkMapping.ipAddress || ""
    } : { name: "", ip: "" },
});

// NOVO: Função auxiliar para validar container (Mesma lógica)
const validateContainer = (container: InstanceContainerData): boolean => {
    const hasMissingEnv = container.envVariables.some(
        env => env.isRequired && !env.isGlobal && !env.value
    );
    return !hasMissingEnv;
}

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
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [isContainerModalOpen, setIsContainerModalOpen] = useState(false)
    const [editingContainer, setEditingContainer] = useState<(InstanceContainerData & { tempId: string }) | null>(null)
    const [allImageTemplates, setAllImageTemplates] = useState<ImageTemplate[]>([])
    const [globalEnvs, setGlobalEnvs] = useState<{ key: string, value: string }[]>([])
    const [isLoadingData, setIsLoadingData] = useState(false)

    const selectedProject = projects.find(p => p.id === formData?.projectTemplateId)

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

    useEffect(() => {
        if (isLoading || isLoadingData || !formData) return;

        if (selectedProject && selectedProject.id !== formData.projectTemplateId) {
            const projectContainers = selectedProject.services.map(service =>
                projectServiceToContainerData(service, allImageTemplates, globalEnvs)
            )
            setFormData(prev => prev ? { ...prev, containers: projectContainers, projectTemplateId: selectedProject.id } : null)
        }
        else if (!selectedProject && formData.projectTemplateId) {
            setFormData(prev => prev ? { ...prev, projectTemplateId: null } : null)
        }

    }, [selectedProject, allImageTemplates, globalEnvs, isLoading, isLoadingData, formData?.projectTemplateId]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!instanceId || !formData) return

        if (formData.containers.length === 0) {
            toast.error("Uma instância deve ter pelo menos um container.")
            return
        }

        // NOVO: Validação no Edit Modal
        const invalidContainers = formData.containers.filter(c => !validateContainer(c));
        if (invalidContainers.length > 0) {
            toast.error(`Existem configurações pendentes nos seguintes containers: ${invalidContainers.map(c => c.name).join(", ")}. Por favor, edite-os.`);
            return;
        }

        setIsSubmitting(true)
        try {
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
                moduleIds: formData.moduleIds,
                containers: finalContainers,
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

    const handleOpenAddContainer = () => {
        setEditingContainer(null)
        setIsContainerModalOpen(true)
    }

    const handleOpenEditContainer = (container: InstanceContainerData) => {
        setEditingContainer(container)
        setIsContainerModalOpen(true)
    }

    const handleSaveContainer = (containerData: InstanceContainerData) => {
        const existing = formData?.containers.find(c => c.tempId === containerData.tempId);

        if (existing) {
            setFormData(prev => prev ? ({
                ...prev,
                containers: prev.containers.map(c => c.tempId === containerData.tempId ? containerData : c)
            }) : null)
        } else {
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
                                                    disabled={isSubmitting}
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

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium">Containers</label>
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
                                            formData.containers.map((container, index) => {
                                                // NOVO: Validação visual no Edit
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
                                                            {selectedProject && selectedProject.services.find(s => s.imageTemplate.image === container.image) && (
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
                                                )
                                            })
                                        )}
                                    </div>
                                </div>
                            </div>

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