"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient } from "@/lib/api-client"
import { Client, Container as ContainerType, GponInstance as Instance, Module } from "@/lib/types"; // Importando tipos
import { Container, Loader2 } from "lucide-react"; // Importando ícones
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface EditInstanceModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onInstanceUpdated: () => void
    instanceId: string | null | undefined // ID da instância a ser editada
    clients: Client[] // Lista de clientes para o dropdown
    modules: Module[] // Lista de todos os módulos disponíveis
}

// Interface para o formulário
interface InstanceFormData {
    clientId: string
    moduleIds: string[]
    containers: ContainerType[]
}

export function EditInstanceModal({
    open,
    onOpenChange,
    onInstanceUpdated,
    instanceId,
    clients,
    modules,
}: EditInstanceModalProps) {
    const [formData, setFormData] = useState<InstanceFormData | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Busca os dados da instância quando o modal é aberto com um ID
    useEffect(() => {
        if (open && instanceId) {
            const fetchInstanceData = async () => {
                setIsLoading(true)
                try {
                    // A rota GET /api/instances/:id retorna o objeto completo
                    const instanceData: Instance = await apiClient.getInstanceById(instanceId)
                    if (instanceData) {
                        setFormData({
                            clientId: instanceData.clientId,
                            moduleIds: instanceData.modules.map((m) => m.id), // Extrai os IDs dos módulos
                            containers: instanceData.containers || [], // Armazena os containers
                        })
                    }
                } catch (error) {
                    toast.error("Falha ao carregar dados da instância.")
                } finally {
                    setIsLoading(false)
                }
            }
            fetchInstanceData()
        } else if (!open) {
            setFormData(null) // Limpa os dados quando o modal fecha
        }
    }, [open, instanceId])

    // Handler para salvar
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!instanceId || !formData) return

        setIsSubmitting(true)
        try {
            // O schema de update (CreateOrUpdateInstanceSchema) espera o payload completo
            const payload = {
                clientId: formData.clientId,
                moduleIds: formData.moduleIds,
                // Reenviamos os dados dos containers, pois o schema de update os espera
                // O backend (instance.service.ts) não tem uma rota de "edição",
                // ele usa a mesma rota de "create" que espera os containers.
                // Se o seu backend TIVER uma rota de update mais simples, isso pode ser ajustado.
                containers: formData.containers.map(c => ({
                    name: c.name,
                    image: c.imageTemplate.image,
                    ports: c.portMapping.map(p => ({ ip: p.ip, privatePort: p.privatePort, publicPort: p.publicPort })),
                    envVariables: c.envVariables.map(e => ({ key: e.key, value: e.value })),
                    volumes: c.volumeMapping.map(v => ({ name: v.hostVolumeName, containerPath: v.containerPath })),
                    network: c.networkMapping ? { name: c.networkMapping.hostNetworkName, ip: c.networkMapping.ipAddress } : undefined,
                    instanceId: c.gponInstanceId
                }))
            }

            await apiClient.updateInstance(instanceId, payload)
            toast.success("Instância atualizada com sucesso!")
            onInstanceUpdated() // Chama o callback para atualizar a página
            onOpenChange(false) // Fecha o modal
        } catch (error) {
            toast.error("Falha ao atualizar instância.")
        } finally {
            setIsSubmitting(false)
        }
    }

    // Handlers do formulário
    const handleFieldChange = (field: keyof InstanceFormData, value: string) => {
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

    return (
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
                        {/* Wrapper de Scroll para o conteúdo */}
                        <div className="flex-1 overflow-y-auto p-1 space-y-4">

                            {/* 1. Informações Gerais */}
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

                            {/* 2. Módulos Licenciados */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Módulos Licenciados</label>
                                {modules.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        Nenhum módulo cadastrado no sistema.
                                    </p>
                                ) : (
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
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    {module.name}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 3. Containers (Somente Leitura) */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">Containers</label>
                                    <span className="text-xs text-muted-foreground">
                                        Para editar containers, vá para a página de Containers.
                                    </span>
                                </div>
                                <div className="p-4 border rounded-md max-h-48 overflow-y-auto space-y-2">
                                    {formData.containers.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                            Nenhum container adicionado a esta instância.
                                        </p>
                                    ) : (
                                        formData.containers.map((container, index) => (
                                            <div key={index} className="flex items-center justify-between p-2 rounded bg-secondary opacity-70">
                                                <div className="flex items-center gap-2">
                                                    <Container className="w-4 h-4 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-sm font-medium">{container.name}</p>
                                                        <p className="text-xs text-muted-foreground font-mono">{container.imageTemplate.image}</p>
                                                    </div>
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
    )
}