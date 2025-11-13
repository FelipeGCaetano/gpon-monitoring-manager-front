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

// --- Nova Função de Máscara de Versão ---
const formatVersion = (value: string) => {
    if (!value) return ""

    // Remove tudo que não é dígito ou ponto
    let v = value.replace(/[^\d.]/g, "")

    // Garante que não haja pontos duplicados
    v = v.replace(/\.{2,}/g, ".")

    // Limita ao formato x.x.x (ex: 99.99.99)
    const parts = v.split(".")
    if (parts.length > 3) {
        v = parts.slice(0, 3).join(".")
    }

    // Limita o comprimento (ex: 99.99.99)
    if (v.length > 8) {
        v = v.slice(0, 8)
    }

    return v
}
// ----------------------------------------

interface CreateModuleModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onModuleCreated: () => void // Callback para recarregar a lista
}

// --- Atualizado o Estado Padrão ---
const defaultFormData = {
    name: "",
    version: "", // Novo campo
}

export function CreateModuleModal({
    open,
    onOpenChange,
    onModuleCreated,
}: CreateModuleModalProps) {
    const [formData, setFormData] = useState(defaultFormData)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Reseta o formulário quando o modal é fechado
    useEffect(() => {
        if (!open) {
            setFormData(defaultFormData)
        }
    }, [open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            // --- Atualizado o Payload ---
            // Enviando 'name' e 'version'
            // O backend espera 'version' como opcional, mas vamos enviar
            const payload = {
                name: formData.name,
                version: formData.version || undefined, // Envia undefined se estiver vazio
            }

            await apiClient.createModule(payload)
            // ----------------------------

            // TODO: Adicionar toast de sucesso
            onModuleCreated() // Chama o callback para atualizar a página
            onOpenChange(false) // Fecha o modal
        } catch (error) {
            console.error("Falha ao criar módulo:", error)
            // TODO: Adicionar toast de erro
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Adicionar Novo Módulo</DialogTitle>
                    <DialogDescription>
                        Crie um novo módulo que poderá ser licenciado para instâncias.
                    </DialogDescription>
                </DialogHeader>
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

                    {/* --- Novo Campo de Versão --- */}
                    <div>
                        <label htmlFor="version" className="text-sm font-medium">
                            Versão (Formato: x.x.x) - Opcional
                        </label>
                        <input
                            id="version"
                            name="version"
                            type="text"
                            value={formData.version}
                            onChange={(e) => setFormData(prev => ({ ...prev, version: formatVersion(e.target.value) }))}
                            className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground"
                            placeholder="Ex: 1.0.0"
                            maxLength={8} // Limita o tamanho (ex: 99.99.99)
                            disabled={isSubmitting}
                        />
                    </div>
                    {/* ----------------------------- */}

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            "Criar Módulo"
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}