"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { apiClient } from "@/lib/api-client"
import type { ImageTemplate, Project, ProjectService } from "@/lib/types"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

// Interface local para o formulário
interface FormService {
    tempId: string
    imageTemplateId: string
    role: "MAIN" | "DEPENDENCY"
    startOrder: number
}

// Tipo para o payload que a API espera
type ProjectPayload = {
    name: string
    description: string
    services: {
        imageTemplateId: string
        role: "MAIN" | "DEPENDENCY"
        startOrder: number
    }[]
}

interface ProjectFormModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: () => void
    projectToEdit: Project | null // Se for null, é "Criar"
}

// Helper para ID temporário
const randomUUID = (): string => crypto.randomUUID()

// Função para criar um item de serviço vazio
const createDefaultService = (): FormService => ({
    tempId: randomUUID(),
    imageTemplateId: "",
    role: "DEPENDENCY",
    startOrder: 0,
})

export function ProjectFormModal({
    open,
    onOpenChange,
    onSave,
    projectToEdit,
}: ProjectFormModalProps) {
    // --- Estados ---
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [services, setServices] = useState<FormService[]>([createDefaultService()])
    const [imageTemplates, setImageTemplates] = useState<ImageTemplate[]>([])

    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // --- Carregar dados (Templates) e Preencher formulário (se Edição) ---
    useEffect(() => {
        if (open) {
            const fetchData = async () => {
                setIsLoading(true)
                try {
                    // 1. Buscar todos os templates de imagem disponíveis
                    const templatesData = await apiClient.getImageTemplates()
                    setImageTemplates(templatesData || [])

                    // 2. Se for edição, preencher o formulário
                    if (projectToEdit) {
                        setName(projectToEdit.name)
                        setDescription(projectToEdit.description)
                        // Mapeia os serviços do projeto para o estado do formulário
                        const servicesToEdit = projectToEdit.services.map((service: ProjectService) => ({
                            tempId: service.id, // Usa o ID real do BD como ID temporário
                            imageTemplateId: service.imageTemplateId,
                            role: service.role,
                            startOrder: service.startOrder,
                        }))
                        setServices(servicesToEdit.length > 0 ? servicesToEdit : [createDefaultService()])
                    } else {
                        // Se for criação, resetar
                        setName("")
                        setDescription("")
                        setServices([createDefaultService()])
                    }
                } catch (error) {
                    toast.error("Falha ao carregar dados do modal.")
                    console.error(error)
                } finally {
                    setIsLoading(false)
                }
            }
            fetchData()
        }
    }, [open, projectToEdit])

    // --- Handlers dos Serviços Dinâmicos ---
    const handleServiceChange = (tempId: string, field: keyof FormService, value: string | number) => {
        setServices(currentServices =>
            currentServices.map(s =>
                s.tempId === tempId ? { ...s, [field]: value } : s
            )
        )
    }

    const addService = () => {
        setServices(prev => [...prev, createDefaultService()])
    }

    const removeService = (tempId: string) => {
        if (services.length > 1) {
            setServices(prev => prev.filter(s => s.tempId !== tempId))
        }
    }

    // --- Handler de Submissão Principal ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        // Validar se todos os serviços têm um template selecionado
        if (services.some(s => !s.imageTemplateId)) {
            toast.error("Por favor, selecione um template de imagem para cada serviço.")
            setIsSubmitting(false)
            return
        }

        // Montar o payload
        const servicesPayload = services.map(s => ({
            imageTemplateId: s.imageTemplateId,
            role: s.role,
            startOrder: Number(s.startOrder) || 0,
        }))

        const payload: ProjectPayload = {
            name,
            description,
            services: servicesPayload,
        }

        try {
            if (projectToEdit) {
                // Modo de Atualização
                await apiClient.updateProject(projectToEdit.id, payload)
            } else {
                // Modo de Criação
                await apiClient.createProject(payload)
            }
            onSave() // Chama o callback (que recarrega e dá toast)
            onOpenChange(false) // Fecha o modal
        } catch (error) {
            toast.error(projectToEdit ? "Falha ao atualizar projeto." : "Falha ao criar projeto.")
            console.error(error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>
                        {projectToEdit ? "Editar Projeto" : "Criar Novo Projeto"}
                    </DialogTitle>
                    <DialogDescription>
                        {projectToEdit ? "Atualize os detalhes deste projeto." : "Defina os serviços e a ordem de inicialização de um projeto."}
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden space-y-4">
                        {/* Wrapper de Scroll */}
                        <div className="flex-1 overflow-y-auto p-1 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Nome do Projeto</label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ex: Stack GPON Monitoring"
                                    disabled={isSubmitting}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Descrição</label>
                                <Textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Descreva o propósito deste projeto..."
                                    disabled={isSubmitting}
                                />
                            </div>

                            <hr className="border-border my-4" />

                            {/* Lista Dinâmica de Serviços */}
                            <div className="space-y-3">
                                <label className="text-lg font-semibold">Serviços do Projeto</label>

                                {services.map((service, index) => (
                                    <div
                                        key={service.tempId}
                                        className="grid grid-cols-12 gap-4 p-4 rounded-lg bg-secondary border border-border"
                                    >
                                        {/* CAMPO 1: Template de Imagem (5 colunas - ~41%) */}
                                        <div className="col-span-12 md:col-span-5 space-y-2">
                                            <label className="text-xs font-medium">Template de Imagem</label>
                                            <Select
                                                value={service.imageTemplateId}
                                                onValueChange={(value) => handleServiceChange(service.tempId, 'imageTemplateId', value)}
                                                disabled={isSubmitting}
                                                required
                                            >
                                                {/* h-10 força a mesma altura do input e botão */}
                                                <SelectTrigger className="w-full h-10">
                                                    <SelectValue placeholder="Selecione..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {imageTemplates.map(t => (
                                                        <SelectItem key={t.id} value={t.id}>{t.name} ({t.image})</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* CAMPO 2: Função (3 colunas - ~25%) */}
                                        <div className="col-span-6 md:col-span-3 space-y-2">
                                            <label className="text-xs font-medium">Função</label>
                                            <Select
                                                value={service.role}
                                                onValueChange={(value) => handleServiceChange(service.tempId, 'role', value)}
                                                disabled={isSubmitting}
                                            >
                                                <SelectTrigger className="w-full h-10">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="MAIN">MAIN</SelectItem>
                                                    <SelectItem value="DEPENDENCY">DEPENDENCY</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* CAMPO 3: Ordem (3 colunas - ~25%) - Aumentado para desgrudar do botão */}
                                        <div className="col-span-4 md:col-span-2 space-y-2">
                                            <label className="text-xs font-medium">Ordem</label>
                                            <Input
                                                type="number"
                                                min="0"
                                                className="w-full h-10"
                                                value={service.startOrder}
                                                onChange={(e) => handleServiceChange(service.tempId, 'startOrder', Number(e.target.value))}
                                                disabled={isSubmitting}
                                            />
                                        </div>

                                        {/* BOTÃO: Remover (1 coluna - ~8%) */}
                                        <div className="col-span-2 md:col-span-2 space-y-2">
                                            {/* Truque: Label invisível para ocupar o espaço e empurrar o botão para baixo, alinhando com os inputs */}
                                            <label className="text-xs font-medium opacity-0 select-none">Del</label>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                onClick={() => removeService(service.tempId)}
                                                disabled={isSubmitting || services.length <= 1}
                                                className="w-full h-10" // Mesma altura dos inputs
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                    onClick={addService}
                                    disabled={isSubmitting}
                                >
                                    <Plus className="w-4 h-4" />
                                    Adicionar Serviço
                                </Button>
                            </div>
                        </div>

                        {/* Botão de Submissão */}
                        <div className="mt-auto pt-6 border-t border-border">
                            <Button type="submit" className="w-full" disabled={isSubmitting || isLoading}>
                                {isSubmitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    projectToEdit ? "Salvar Alterações" : "Criar Projeto"
                                )}
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}