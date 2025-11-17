"use client"

import { useAuth } from "@/app/auth-context"
import { ProtectedLayout } from "@/components/layout/protected-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"; // Importar Checkbox
import { Input } from "@/components/ui/input"
import { apiClient } from "@/lib/api-client"
import type { EnvDefinition, ImageTemplate } from "@/lib/types"
import { Loader2, Plus, Save, Trash2 } from "lucide-react"
import { useParams, useRouter } from "next/navigation"; // Importar hooks
import { useEffect, useState } from "react"
import { toast } from "sonner"

// Interface local para gerenciar o estado do formulário (com IDs temporários)
interface EnvFormRow extends EnvDefinition {
    tempId: string // Para a key do React
    isNew?: boolean
}

export default function EnvDefinitionsPage() {
    const { userCan, isAuthLoading } = useAuth()
    const router = useRouter()
    const params = useParams() // Hook para ler o [id] da URL
    const templateId = params.id as string

    // --- Estados ---
    const [template, setTemplate] = useState<ImageTemplate | null>(null)
    const [envDefinitions, setEnvDefinitions] = useState<EnvFormRow[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // --- Buscar dados ---
    const fetchEnvDefinitions = async () => {
        if (!templateId) return
        setIsLoading(true)
        try {
            // Busca o Template (para o título) e as Definições
            const [templateData, envsData] = await Promise.all([
                apiClient.getImageTemplateById(templateId),
                apiClient.getEnvDefinitions(templateId)
            ])

            setTemplate(templateData)
            setEnvDefinitions(
                (envsData || []).map((env: EnvDefinition) => ({
                    ...env,
                    tempId: env.id, // ID real do banco
                    isNew: false,
                }))
            )
        } catch (error) {
            console.error("Falha ao buscar definições:", error)
            toast.error("Falha ao buscar definições de ambiente.")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (isAuthLoading) {
            return;
        }
        if (!isAuthLoading && isLoading) {
            fetchEnvDefinitions();
        }
    }, [isAuthLoading, userCan, isLoading])

    // --- Handlers ---
    const handleAddRow = () => {
        if (!userCan("create:containers:images:envs")) return
        setEnvDefinitions(prev => [
            ...prev,
            {
                id: "", // Vazio pois ainda não existe no DB
                tempId: crypto.randomUUID(),
                key: "",
                isRequired: false,
                templateId: templateId,
                template: template!, // Apenas para tipo
                isNew: true,
            },
        ])
    }

    const handleRowChange = (tempId: string, field: "key" | "isRequired", value: string | boolean) => {
        setEnvDefinitions(prev =>
            prev.map(row => (row.tempId === tempId ? { ...row, [field]: value } : row))
        )
    }

    const handleSaveRow = async (row: EnvFormRow) => {
        setIsSubmitting(true)
        try {
            const payload = { key: row.key, isRequired: row.isRequired }
            if (row.isNew) {
                // Criar
                await apiClient.createEnvDefinitions(templateId, payload)
                toast.success(`Variável "${row.key}" criada.`)
            } else {
                // Atualizar
                await apiClient.updateEnvDefinition(templateId, row.id, payload)
                toast.success(`Variável "${row.key}" atualizada.`)
            }
            await fetchEnvDefinitions() // Recarrega tudo
        } catch (error) {
            toast.error("Falha ao salvar variável.")
            console.error("Falha ao salvar variável:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteRow = async (row: EnvFormRow) => {
        if (!window.confirm(`Tem certeza que deseja deletar a variável "${row.key}"?`)) return

        // Se for 'isNew', apenas remove do estado local
        if (row.isNew) {
            setEnvDefinitions(prev => prev.filter(r => r.tempId !== row.tempId))
            return
        }

        setIsSubmitting(true)
        try {
            await apiClient.deleteEnvDefinition(templateId, row.id)
            toast.success(`Variável "${row.key}" deletada.`)
            await fetchEnvDefinitions() // Recarrega
        } catch (error) {
            toast.error("Falha ao deletar variável.")
            console.error("Falha ao deletar variável:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <ProtectedLayout
            title={template ? `Envs: ${template.name}` : "Carregando..."}
            description={template ? `Definições de ambiente para ${template.image}` : " "}
        >
            <Card>
                <CardHeader>
                    <CardTitle>Definições de Ambiente</CardTitle>
                    <CardDescription>
                        Defina quais variáveis de ambiente são esperadas por este template de imagem.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-40">
                            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : !userCan("read:containers:images:envs") ? (
                        <div className="text-center text-destructive py-10">
                            Você não tem permissão para ver esta página.
                        </div>
                    ) : (
                        <>
                            {/* Header da "Tabela" */}
                            <div className="flex items-center gap-4 px-4 py-2">
                                <label className="flex-1 text-sm font-medium text-muted-foreground">Chave (KEY)</label>
                                <label className="w-32 text-sm font-medium text-muted-foreground">Obrigatório?</label>
                                <label className="w-24 text-sm font-medium text-muted-foreground text-right">Ações</label>
                            </div>

                            {/* Linhas da "Tabela" */}
                            <div className="flex flex-col gap-3">
                                {envDefinitions.map((row) => (
                                    <div key={row.tempId} className="flex items-center gap-4 p-4 rounded-lg bg-secondary">
                                        <Input
                                            placeholder="EXEMPLO_VAR"
                                            value={row.key}
                                            onChange={(e) => handleRowChange(row.tempId, 'key', e.target.value)}
                                            disabled={isSubmitting || !userCan("update:containers:images:envs")}
                                            className="flex-1"
                                        />
                                        <div className="w-32 flex items-center gap-2">
                                            <Checkbox
                                                id={`req-${row.tempId}`}
                                                checked={row.isRequired}
                                                onCheckedChange={(checked) => handleRowChange(row.tempId, 'isRequired', !!checked)}
                                                disabled={isSubmitting || !userCan("update:containers:images:envs")}
                                            />
                                            <label htmlFor={`req-${row.tempId}`} className="text-sm">Obrigatório</label>
                                        </div>
                                        <div className="w-24 flex justify-end gap-2">
                                            {/* Salva/Cria a linha */}
                                            {userCan("create:containers:images:envs") && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleSaveRow(row)}
                                                    disabled={isSubmitting || !row.key}
                                                >
                                                    <Save className="w-4 h-4" />
                                                </Button>
                                            )}
                                            {/* Deleta a linha */}
                                            {userCan("delete:containers:images:envs") && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => handleDeleteRow(row)}
                                                    disabled={isSubmitting}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Botão Adicionar Linha */}
                            {userCan("create:containers:images:envs") && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="gap-2 mt-4"
                                    onClick={handleAddRow}
                                    disabled={isSubmitting}
                                >
                                    <Plus className="w-4 h-4" />
                                    Adicionar Variável
                                </Button>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </ProtectedLayout>
    )
}