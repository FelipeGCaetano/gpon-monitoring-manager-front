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
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface CreateImageTemplateModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onTemplateCreated: () => void
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

export function CreateImageTemplateModal({
    open,
    onOpenChange,
    onTemplateCreated,
}: CreateImageTemplateModalProps) {
    const [formData, setFormData] = useState(defaultForm)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: name === 'healthcheckRetries' ? Number(value) : value,
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            // Prepara o payload, enviando 'null' para campos de healthcheck opcionais se vazios
            const payload = {
                name: formData.name,
                image: formData.image,
                command: formData.command || null,
                healthcheckTest: formData.healthcheckTest || null,
                healthcheckInterval: formData.healthcheckInterval || null,
                healthcheckTimeout: formData.healthcheckTimeout || null,
                healthcheckRetries: formData.healthcheckRetries || null,
            }

            await apiClient.createImageTemplate(payload)
            onTemplateCreated()
            onOpenChange(false)
        } catch (error) {
            console.error("Falha ao criar template:", error)
            toast.error("Falha ao criar template.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Novo Template de Imagem</DialogTitle>
                    <DialogDescription>
                        Defina um novo template de imagem para ser usado na criação de containers.
                    </DialogDescription>
                </DialogHeader>

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
                            "Criar Template"
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}