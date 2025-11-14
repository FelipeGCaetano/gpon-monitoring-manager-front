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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient } from "@/lib/api-client"
import { ImageTemplate } from "@/lib/types"; // Importar tipo
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface EditImageTemplateModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onTemplateUpdated: () => void
    templateId: string | null
}

const defaultForm = {
    name: "",
    image: "",
    command: "",
    healthcheckTest: "",
    healthcheckInterval: "30s",
    healthcheckTimeout: "10s",
    healthcheckRetries: 3,
}

export function EditImageTemplateModal({
    open,
    onOpenChange,
    onTemplateUpdated,
    templateId,
}: EditImageTemplateModalProps) {
    const [formData, setFormData] = useState(defaultForm)
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // --- Buscar dados do template para preencher ---
    useEffect(() => {
        if (open && templateId) {
            const fetchTemplate = async () => {
                setIsLoading(true)
                try {
                    const data: ImageTemplate = await apiClient.getImageTemplateById(templateId)
                    setFormData({
                        name: data.name,
                        image: data.image,
                        command: data.command || "",
                        healthcheckTest: data.healthcheckTest || "",
                        healthcheckInterval: data.healthcheckInterval || "30s",
                        healthcheckTimeout: data.healthcheckTimeout || "10s",
                        healthcheckRetries: data.healthcheckRetries || 3,
                    })
                } catch (error) {
                    console.error("Falha ao buscar template:", error)
                    toast.error("Falha ao carregar dados do template.")
                    onOpenChange(false) // Fecha o modal se falhar
                } finally {
                    setIsLoading(false)
                }
            }
            fetchTemplate()
        } else {
            setFormData(defaultForm) // Reseta o formulário
        }
    }, [open, templateId, onOpenChange])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: name === 'healthcheckRetries' ? Number(value) : value,
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!templateId) return

        setIsSubmitting(true)
        try {
            const payload = {
                name: formData.name,
                image: formData.image,
                command: formData.command || null,
                healthcheckTest: formData.healthcheckTest || null,
                healthcheckInterval: formData.healthcheckInterval || null,
                healthcheckTimeout: formData.healthcheckTimeout || null,
                healthcheckRetries: formData.healthcheckRetries || null,
            }

            await apiClient.updateImageTemplate(templateId, payload)
            onTemplateUpdated()
            onOpenChange(false)
        } catch (error) {
            console.error("Falha ao atualizar template:", error)
            toast.error("Falha ao atualizar template.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Editar Template de Imagem</DialogTitle>
                    <DialogDescription>
                        Atualize os detalhes do template de imagem.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Tabs defaultValue="main" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="main">Principal</TabsTrigger>
                                <TabsTrigger value="healthcheck">Health Check</TabsTrigger>
                            </TabsList>

                            {/* Aba Principal */}
                            <TabsContent value="main" className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nome do Template</label>
                                    <Input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Ex: GPON Monitoring API"
                                        disabled={isSubmitting}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nome da Imagem Docker</label>
                                    <Input
                                        name="image"
                                        value={formData.image}
                                        onChange={handleChange}
                                        placeholder="Ex: nmultifibra/gpon-api:latest"
                                        disabled={isSubmitting}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Comando (Opcional)</label>
                                    <Input
                                        name="command"
                                        value={formData.command}
                                        onChange={handleChange}
                                        placeholder="Ex: npm run start:prod"
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </TabsContent>

                            {/* Aba Healthcheck */}
                            <TabsContent value="healthcheck" className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Comando de Teste (Opcional)</label>
                                    <Input
                                        name="healthcheckTest"
                                        value={formData.healthcheckTest}
                                        onChange={handleChange}
                                        placeholder="Ex: curl -f http://localhost:3333/health"
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Intervalo</label>
                                        <Input
                                            name="healthcheckInterval"
                                            value={formData.healthcheckInterval}
                                            onChange={handleChange}
                                            placeholder="30s"
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Timeout</label>
                                        <Input
                                            name="healthcheckTimeout"
                                            value={formData.healthcheckTimeout}
                                            onChange={handleChange}
                                            placeholder="10s"
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Retentativas</label>
                                        <Input
                                            name="healthcheckRetries"
                                            type="number"
                                            value={formData.healthcheckRetries}
                                            onChange={handleChange}
                                            placeholder="3"
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                "Salvar Alterações"
                            )}
                        </Button>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}