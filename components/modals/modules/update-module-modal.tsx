"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { apiClient } from "@/lib/api-client"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

// --- Função de Máscara de Versão (Reutilizada) ---
const formatVersion = (value: string) => {
    if (!value) return ""
    let v = value.replace(/[^\d.]/g, "")
    v = v.replace(/\.{2,}/g, ".")
    const parts = v.split(".")
    if (parts.length > 3) {
        v = parts.slice(0, 3).join(".")
    }
    if (v.length > 8) {
        v = v.slice(0, 8)
    }
    return v
}
// ----------------------------------------

interface EditModuleModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onModuleUpdated: () => void // Callback para recarregar a lista
    moduleId: string | null // ID do módulo a ser editado
}

// Interface para o formulário
interface ModuleFormData {
    name: string
    version: string
}

export function EditModuleModal({
    open,
    onOpenChange,
    onModuleUpdated,
    moduleId,
}: EditModuleModalProps) {
    const [formData, setFormData] = useState<ModuleFormData>({
        name: "",
        version: "",
    })
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Busca os dados do módulo quando o modal é aberto
    useEffect(() => {
        if (open && moduleId) {
            const fetchModuleData = async () => {
                setIsLoading(true)
                try {
                    // Busca os dados completos do módulo (incluindo a versão)
                    const moduleData = await apiClient.getModuleById(moduleId)
                    if (moduleData) {
                        setFormData({
                            name: moduleData.name,
                            version: formatVersion(moduleData.version || ""), // Formata a versão
                        })
                    }
                } catch (error) {
                    toast.error("Falha ao carregar dados do módulo.")
                } finally {
                    setIsLoading(false)
                }
            }
            fetchModuleData()
        }
    }, [open, moduleId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!moduleId) return

        setIsSubmitting(true)
        try {
            const payload = {
                name: formData.name,
                version: formData.version || undefined,
            }

            // Chama a rota de UPDATE
            await apiClient.updateModule(moduleId, payload)
            toast.success("Módulo atualizado com sucesso!")
            onModuleUpdated() // Chama o callback para atualizar a página
            onOpenChange(false) // Fecha o modal
        } catch (error) {
            toast.error("Falha ao atualizar módulo.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Editar Módulo</DialogTitle>
                    <DialogDescription>
                        Altere os dados do módulo selecionado.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="text-sm font-medium">
                                Nome do Módulo
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground"
                                placeholder="Ex: Módulo ACS"
                                disabled={isSubmitting}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="version" className="text-sm font-medium">
                                Versão (Formato: x.x.x)
                            </label>
                            <input
                                id="version"
                                name="version"
                                type="text"
                                value={formData.version}
                                onChange={(e) => setFormData(prev => ({ ...prev, version: formatVersion(e.target.value) }))}
                                className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground"
                                placeholder="Ex: 1.0.0"
                                maxLength={8}
                                disabled={isSubmitting}
                                required
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={isSubmitting || isLoading}>
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