"use client"

import { ProtectedLayout } from "@/components/layout/protected-layout"
import { ProjectFormModal } from "@/components/modals/projects/create-or-update-project-modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient } from "@/lib/api-client"
import type { Project } from "@/lib/types"
import { Blocks, Edit2, Loader2, Plus, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useAuth } from "../auth-context"

export default function ProjectsPage() {
    const { userCan, isAuthLoading } = useAuth()

    // --- Estados ---
    const [projects, setProjects] = useState<Project[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState<string | null>(null)

    // --- Estados dos Modais ---
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingProject, setEditingProject] = useState<Project | null>(null)

    // --- Buscar dados ---
    const fetchProjects = async () => {
        setIsLoading(true)
        try {
            if (userCan("read:projects")) {
                const data = await apiClient.getProjects()
                setProjects(data || [])
            }
        } catch (error) {
            console.error("Falha ao buscar projetos:", error)
            toast.error("Falha ao buscar projetos.")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (isAuthLoading) {
            return;
        }
        if (!isAuthLoading && isLoading) {
            fetchProjects();
        }
    }, [isAuthLoading, userCan, isLoading])

    // --- Handlers ---
    const handleOpenCreate = () => {
        setEditingProject(null)
        setIsModalOpen(true)
    }

    const handleOpenEdit = (project: Project) => {
        setEditingProject(project)
        setIsModalOpen(true)
    }

    const handleDelete = async (projectId: string) => {
        if (window.confirm("Tem certeza que deseja deletar este projeto?")) {
            setIsSubmitting(projectId)
            try {
                await apiClient.deleteProject(projectId)
                toast.success("Projeto deletado com sucesso.")
                await fetchProjects()
            } catch (error) {
                toast.error("Falha ao deletar projeto.")
                console.error("Falha ao deletar projeto:", error)
            } finally {
                setIsSubmitting(null)
            }
        }
    }

    return (
        <ProtectedLayout
            title="Projetos"
            description="Gerencie projetos que agrupam múltiplos templates de imagem"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64 md:col-span-2 lg:col-span-3">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : !userCan("read:projects") ? (
                    <Card className="md:col-span-2 lg:col-span-3">
                        <CardContent className="p-10 text-center text-destructive">
                            Você não tem permissão para ver os projetos.
                        </CardContent>
                    </Card>
                ) : projects.length === 0 ? (
                    <Card className="md:col-span-2 lg:col-span-3">
                        <CardContent className="p-10 text-center text-muted-foreground">
                            Nenhum projeto encontrado.
                        </CardContent>
                    </Card>
                ) : (
                    projects.map((project) => (
                        <Card key={project.id} className="flex flex-col">
                            <CardHeader>
                                <div className="flex justify-between items-start gap-4">
                                    <div>
                                        <CardTitle className="text-xl mb-1">{project.name}</CardTitle>
                                        <CardDescription>{project.description}</CardDescription>
                                    </div>
                                    <Badge variant="secondary" className="gap-2">
                                        <Blocks className="w-3 h-3" />
                                        {project.services?.length || 0} Serviços
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-3">
                                <span className="text-sm font-medium text-muted-foreground">Serviços Inclusos:</span>
                                <div className="flex flex-wrap gap-2">
                                    {project.services.length > 0 ? project.services.map((service) => (
                                        <Badge key={service.id} variant="outline">
                                            {service.imageTemplate?.name || "Template Removido"}
                                            <span className="ml-2 font-mono text-xs opacity-60">
                                                (Ordem: {service.startOrder})
                                            </span>
                                        </Badge>
                                    )) : (
                                        <span className="text-sm text-muted-foreground italic">Nenhum serviço vinculado.</span>
                                    )}
                                </div>
                            </CardContent>
                            {/* Ações no Rodapé */}
                            {(userCan("update:project") || userCan("delete:project")) && (
                                <div className="flex items-center justify-end gap-2 p-4 border-t border-border mt-auto">
                                    {userCan("update:project") && (
                                        <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(project)} disabled={!!isSubmitting}>
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                    {userCan("delete:project") && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => handleDelete(project.id)}
                                            disabled={!!isSubmitting}
                                        >
                                            {isSubmitting === project.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </Button>
                                    )}
                                </div>
                            )}
                        </Card>
                    ))
                )}
            </div>

            <div className="flex justify-end mt-6">

                {userCan("create:projects") && (
                    <Button className="gap-2" onClick={handleOpenCreate}>
                        <Plus className="w-4 h-4" />
                        Novo Projeto
                    </Button>
                )}
            </div>

            {/* --- Modais --- */}
            <ProjectFormModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                projectToEdit={editingProject}
                onSave={async () => {
                    await fetchProjects()
                    toast.success(editingProject ? "Projeto atualizado!" : "Projeto criado!")
                }}
            />
        </ProtectedLayout>
    )
}