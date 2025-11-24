"use client"

import { ProtectedLayout } from "@/components/layout/protected-layout"
import { CreateImageTemplateModal } from "@/components/modals/image-templates/create-image-template-modal"
import { EditImageTemplateModal } from "@/components/modals/image-templates/edit-image-template-modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// Importar Input
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { apiClient } from "@/lib/api-client"
import type { ImageTemplate } from "@/lib/types"
// Importar ícones Search e ArrowUpDown
import { ArrowUpDown, Edit2, Loader2, Plus, Search, SlidersHorizontal, Trash2 } from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { useAuth } from "../auth-context"

// Tipo auxiliar para ordenação
type SortConfig = {
    key: string
    direction: "asc" | "desc"
} | null

export default function ImageTemplatesPage() {
    const { userCan, isAuthLoading } = useAuth()

    // --- Estados ---
    const [templates, setTemplates] = useState<ImageTemplate[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState<string | null>(null)

    // ✅ Estados de Busca e Ordenação
    const [searchQuery, setSearchQuery] = useState("")
    const [sortConfig, setSortConfig] = useState<SortConfig>(null)

    // --- Estados dos Modais ---
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)

    // --- Buscar dados ---
    const fetchTemplates = async () => {
        setIsLoading(true)
        try {
            if (userCan("read:containers:images")) {
                const data = await apiClient.getImageTemplates()
                setTemplates(data || [])
            }
        } catch (error) {
            console.error("Falha ao buscar templates:", error)
            toast.error("Falha ao buscar templates de imagem.")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (isAuthLoading) return
        if (!isAuthLoading && isLoading) fetchTemplates()
    }, [isAuthLoading, userCan, isLoading])

    // --- Lógica de Ordenação e Filtro ---
    const handleSort = (key: string) => {
        setSortConfig((current) => {
            if (current?.key === key) {
                return { key, direction: current.direction === "asc" ? "desc" : "asc" }
            }
            return { key, direction: "asc" }
        })
    }

    const filteredAndSortedTemplates = useMemo(() => {
        // 1. Filtragem
        let result = templates.filter((template) => {
            if (!searchQuery) return true
            const query = searchQuery.toLowerCase()

            return (
                template.name.toLowerCase().includes(query) ||
                template.image.toLowerCase().includes(query) ||
                (template.command && template.command.toLowerCase().includes(query))
            )
        })

        // 2. Ordenação
        if (sortConfig !== null) {
            result.sort((a, b) => {
                let aValue: any
                let bValue: any

                // Tratamento especial para contagem de arrays
                if (sortConfig.key === "containers") {
                    aValue = a.containers?.length || 0
                    bValue = b.containers?.length || 0
                } else {
                    // Campos normais
                    aValue = a[sortConfig.key as keyof ImageTemplate]
                    bValue = b[sortConfig.key as keyof ImageTemplate]
                }

                // Normalização string
                if (typeof aValue === 'string') aValue = aValue.toLowerCase()
                if (typeof bValue === 'string') bValue = bValue.toLowerCase()

                // Tratar nulos/undefined como string vazia para ordenação
                if (!aValue) aValue = ""
                if (!bValue) bValue = ""

                if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
                if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
                return 0
            })
        }
        return result
    }, [templates, sortConfig, searchQuery])

    // --- Handlers ---
    const handleEdit = (template: ImageTemplate) => {
        setEditingTemplateId(template.id)
        setIsEditModalOpen(true)
    }

    const handleDelete = async (templateId: string) => {
        if (window.confirm("Tem certeza que deseja deletar este template?")) {
            setIsSubmitting(templateId)
            try {
                await apiClient.deleteImageTemplate(templateId)
                toast.success("Template deletado com sucesso.")
                await fetchTemplates()
            } catch (error) {
                toast.error("Falha ao deletar template.")
                console.error("Falha ao deletar template:", error)
            } finally {
                setIsSubmitting(null)
            }
        }
    }

    // Componente auxiliar de Header Ordenável
    const SortableHead = ({ label, sortKey }: { label: string; sortKey: string }) => (
        <TableHead>
            <Button
                variant="ghost"
                onClick={() => handleSort(sortKey)}
                className="hover:bg-transparent px-0 font-bold flex items-center gap-1"
            >
                {label}
                <ArrowUpDown className="h-4 w-4" />
            </Button>
        </TableHead>
    )

    return (
        <ProtectedLayout
            title="Templates de Imagem"
            description="Gerencie os templates de imagem para criação de containers"
        >
            <Card>
                <CardHeader>
                    <CardTitle>Templates Disponíveis</CardTitle>
                    <CardDescription>
                        Lista de todos os templates de imagem do Docker cadastrados.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* ✅ Barra de Pesquisa */}
                    <div className="flex items-center mb-4">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nome, imagem ou comando..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <SortableHead label="Nome" sortKey="name" />
                                    <SortableHead label="Imagem Docker" sortKey="image" />
                                    <SortableHead label="Comando Padrão" sortKey="command" />
                                    <SortableHead label="Em Uso" sortKey="containers" />
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                ) : !userCan("read:containers:images") ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-destructive">
                                            Você não tem permissão para ver os templates.
                                        </TableCell>
                                    </TableRow>
                                ) : filteredAndSortedTemplates.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            {searchQuery
                                                ? "Nenhum template encontrado para sua busca."
                                                : "Nenhum template de imagem encontrado."}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredAndSortedTemplates.map((template) => (
                                        <TableRow key={template.id}>
                                            <TableCell className="font-medium">{template.name}</TableCell>
                                            <TableCell className="font-mono text-sm">{template.image}</TableCell>
                                            <TableCell className="font-mono text-xs">{template.command || "N/A"}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{template.containers?.length || 0} container(s)</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {userCan("read:containers:images:envs") && (
                                                        <Button asChild size="sm" variant="outline" className="gap-1">
                                                            <Link href={`/image-templates/${template.id}/env-definitions`}>
                                                                <SlidersHorizontal className="w-3 h-3" />
                                                                Envs
                                                            </Link>
                                                        </Button>
                                                    )}
                                                    {userCan("update:containers:image") && (
                                                        <Button size="sm" variant="ghost" onClick={() => handleEdit(template)} disabled={!!isSubmitting}>
                                                            <Edit2 className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                    {userCan("delete:containers:image") && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-destructive hover:text-destructive"
                                                            onClick={() => handleDelete(template.id)}
                                                            disabled={!!isSubmitting}
                                                        >
                                                            {isSubmitting === template.id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="w-4 h-4" />
                                                            )}
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end mt-6">
                {userCan("create:containers:images") && (
                    <Button className="gap-2 mt-4" onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="w-4 h-4" />
                        Novo Template
                    </Button>
                )}
            </div>

            {/* --- Modais --- */}
            <CreateImageTemplateModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
                onTemplateCreated={() => {
                    fetchTemplates()
                    toast.success("Template criado com sucesso!")
                }}
            />

            <EditImageTemplateModal
                open={isEditModalOpen}
                onOpenChange={setIsEditModalOpen}
                templateId={editingTemplateId}
                onTemplateUpdated={() => {
                    fetchTemplates()
                    toast.success("Template atualizado com sucesso!")
                }}
            />

        </ProtectedLayout>
    )
}