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

// 1. Define todos os valores opcionais como string vazia inicialmente
const defaultForm = {
    name: "",
    image: "",
    command: "",
    dataPath: "",
    defaultPort: "", // Alterado de 0 para "" para ser opcional
    healthcheckTest: "",
    healthcheckInterval: "", // Alterado de "30s" para ""
    healthcheckTimeout: "",  // Alterado de "10s" para ""
    healthcheckRetries: "",  // Alterado de 3 para ""
}

export function CreateImageTemplateModal({
    open,
    onOpenChange,
    onTemplateCreated,
}: CreateImageTemplateModalProps) {
    const [formData, setFormData] = useState(defaultForm)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // 2. Removemos a conversão forçada para Number aqui.
    // Mantemos como string no estado para permitir que o campo fique vazio ("").
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            // 3. Construção dinâmica do payload.
            // Iniciamos apenas com os obrigatórios.
            const payload: any = {
                name: formData.name,
                image: formData.image,
            }

            // Adiciona propriedades opcionais SOMENTE se tiverem valor preenchido
            if (formData.dataPath) payload.dataPath = formData.dataPath;
            if (formData.command) payload.command = formData.command;
            if (formData.healthcheckTest) payload.healthcheckTest = formData.healthcheckTest;
            if (formData.healthcheckInterval) payload.healthcheckInterval = formData.healthcheckInterval;
            if (formData.healthcheckTimeout) payload.healthcheckTimeout = formData.healthcheckTimeout;

            // Para números, verificamos se existe E convertemos
            if (formData.defaultPort) payload.defaultPort = Number(formData.defaultPort);
            if (formData.healthcheckRetries) payload.healthcheckRetries = Number(formData.healthcheckRetries);

            await apiClient.createImageTemplate(payload)
            onTemplateCreated()
            onOpenChange(false)
            setFormData(defaultForm) // Limpa o formulário ao fechar
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
                                <label className="text-sm font-medium">Porta padrão (Opcional)</label>
                                <Input
                                    name="defaultPort"
                                    type="number" // Importante para UX
                                    value={formData.defaultPort}
                                    onChange={handleChange}
                                    placeholder="Ex: 3306"
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Caminho de dados (Opcional)</label>
                                <Input
                                    name="dataPath"
                                    value={formData.dataPath}
                                    onChange={handleChange}
                                    placeholder="Ex: /var/lib/mysql"
                                    disabled={isSubmitting}
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
                                        placeholder="Ex: 30s"
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Timeout</label>
                                    <Input
                                        name="healthcheckTimeout"
                                        value={formData.healthcheckTimeout}
                                        onChange={handleChange}
                                        placeholder="Ex: 10s"
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Retentativas</label>
                                    <Input
                                        name="healthcheckRetries"
                                        type="number" // Importante para UX
                                        value={formData.healthcheckRetries}
                                        onChange={handleChange}
                                        placeholder="Ex: 3"
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