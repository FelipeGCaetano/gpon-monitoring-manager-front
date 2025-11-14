"use client"

import { ProtectedLayout } from "@/components/layout/protected-layout"
import { CreateImageTemplateModal } from "@/components/modals/image-templates/create-image-template-modal"
import { EditImageTemplateModal } from "@/components/modals/image-templates/edit-image-template-modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { apiClient } from "@/lib/api-client"
import type { ImageTemplate } from "@/lib/types"
import { Edit2, Loader2, Plus, SlidersHorizontal, Trash2 } from "lucide-react"
import Link from "next/link"; // Importar Link para o botão de "Envs"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useAuth } from "../auth-context"

export default function ImageTemplatesPage() {
    const { userCan } = useAuth()

    // --- Estados ---
    const [templates, setTemplates] = useState<ImageTemplate[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState<string | null>(null)

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
        fetchTemplates()
    }, [])

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
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Imagem Docker</TableHead>
                                    <TableHead>Comando Padrão</TableHead>
                                    <TableHead>Em Uso</TableHead>
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
                                ) : templates.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            Nenhum template de imagem encontrado.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    templates.map((template) => (
                                        <TableRow key={template.id}>
                                            <TableCell className="font-medium">{template.name}</TableCell>
                                            <TableCell className="font-mono text-sm">{template.image}</TableCell>
                                            <TableCell className="font-mono text-xs">{template.command || "N/A"}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{template.containers?.length || 0} container(s)</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* Assumindo permissão 'read:containers:images:envs' */}
                                                    {userCan("read:containers:images:envs") && (
                                                        <Button asChild size="sm" variant="outline" className="gap-1">
                                                            <Link href={`/image-templates/${template.id}/env-definitions`}>
                                                                <SlidersHorizontal className="w-3 h-3" />
                                                                Envs
                                                            </Link>
                                                        </Button>
                                                    )}
                                                    {/* Assumindo permissão 'update:containers:images' (inventada) */}
                                                    {userCan("update:containers:image") && (
                                                        <Button size="sm" variant="ghost" onClick={() => handleEdit(template)} disabled={!!isSubmitting}>
                                                            <Edit2 className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                    {/* Assumindo permissão 'delete:containers:images' (inventada) */}
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