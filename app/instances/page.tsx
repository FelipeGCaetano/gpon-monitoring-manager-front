"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    Activity, // Ícone para Status
    Box,
    Component,
    Container,
    Edit2,
    Eye,
    Layers,
    LayoutDashboard,
    Loader2,
    Menu,
    Plus,
    Settings,
    Users,
    X
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
// Table não é mais usado aqui, mas pode ser mantido se outros componentes o usarem
import { TableCell, TableRow } from "@/components/ui/table"
// 1. Importar componentes do Accordion
import { CreateInstanceModal } from "@/components/modals/instances/create-instance-modal"
import { EditInstanceModal } from "@/components/modals/instances/edit-instance-modal"
import { GponInstanceDetailsModal } from "@/components/modals/instances/gpon-instance-details-modal"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { apiClient } from "@/lib/api-client"
import type { Client, GponInstance as Instance, Module } from "@/lib/types"

// Lista de navegação (permanece a mesma)
const navigationItems = [
    { icon: LayoutDashboard, label: "Painel", href: "/" },
    { icon: Container, label: "Containers", href: "/containers" },
    { icon: Layers, label: "Módulos", href: "/modules" },
    { icon: Component, label: "Instâncias", href: "/instances", active: true },
    { icon: Users, label: "Clientes", href: "/clients" },
    { icon: Users, label: "Usuários", href: "/users" },
    { icon: Settings, label: "Configuração", href: "/settings" },
]

// Helper para formatar data
const formatDate = (dateString: Date | string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    })
}

export default function InstancesPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true)

    // --- Estados dos Modais ---
    const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null)
    const [instanceDetailsOpen, setInstanceDetailsOpen] = useState(false)
    const [createInstanceOpen, setCreateInstanceOpen] = useState(false)
    const [editingInstanceOpen, setEditingInstanceOpen] = useState(false)

    // --- Estados de Dados da API ---
    const [clients, setClients] = useState<Client[]>([])
    const [instances, setInstances] = useState<Instance[]>([])
    const [modules, setModules] = useState<Module[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [editingInstanceId, setEditingInstanceId] = useState<string | null | undefined>()

    // 2. Novo estado para os dados agrupados
    const [groupedInstances, setGroupedInstances] = useState<Record<string, Instance[]>>({})

    // --- Funções de busca de dados ---
    const fetchPageData = async () => {
        setIsLoading(true)
        try {
            const [instancesData, modulesData, clientsData] = await Promise.all([
                apiClient.getInstances(),
                apiClient.getModules(),
                apiClient.getClients(),
            ])
            setInstances(instancesData || [])
            setModules(modulesData || [])
            setClients(clientsData || [])
        } catch (error) {
            console.error("Falha ao buscar dados da página:", error)
        } finally {
            setIsLoading(false)
        }
    }

    // Carrega todos os dados da página
    useEffect(() => {
        fetchPageData()
    }, [])

    // 3. useEffect para agrupar as instâncias por cliente
    useEffect(() => {
        if (isLoading || instances.length === 0) {
            setGroupedInstances({}) // Limpa se estiver carregando ou vazio
            return
        }

        // Agrupa o array de instâncias em um objeto { "nomeDoCliente": [instancia1, instancia2] }
        const groups = instances.reduce((acc, instance) => {
            const clientName = instance.client?.name || "Cliente Desconhecido" // Usa o nome do cliente
            if (!acc[clientName]) {
                acc[clientName] = []
            }
            acc[clientName].push(instance)
            return acc
        }, {} as Record<string, Instance[]>)

        setGroupedInstances(groups)
    }, [instances, isLoading]) // Roda quando os dados mudam

    // Ações da API (permanecem as mesmas)
    const handleEditInstance = (instance: Instance) => {
        setEditingInstanceId(instance.id)
        setEditingInstanceOpen(true)
    }

    const handleViewInstanceDetails = (instance: Instance) => {
        setSelectedInstance(instance)
        setInstanceDetailsOpen(true)
    }

    // (LoadingRow não é mais usado pela tabela, mas pode ser mantido para outros loaders)
    const LoadingRow = ({ cols }: { cols: number }) => (
        <TableRow>
            <TableCell colSpan={cols} className="h-24 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto" />
            </TableCell>
        </TableRow>
    )

    return (
        <div className="flex h-screen bg-background">
            {/* Sidebar (permanece o mesmo) */}
            <aside
                className={`bg-sidebar border-r border-sidebar-border transition-all duration-300 ${sidebarOpen ? "w-64" : "w-20"
                    } flex flex-col`}
            >
                {/* Logo */}
                <div className="flex items-center justify-between px-6 py-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                            <Activity className="w-6 h-6 text-primary-foreground" />
                        </div>
                        {sidebarOpen && <span className="text-sidebar-foreground font-bold text-lg">GPON</span>}
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 space-y-2">
                    {navigationItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${item.active
                                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                : "text-sidebar-foreground hover:bg-sidebar-accent"
                                }`}
                        >
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            {sidebarOpen && <span>{item.label}</span>}
                        </Link>
                    ))}
                </nav>

                {/* Toggle Button */}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="mx-3 mb-6 p-2 hover:bg-sidebar-accent rounded-lg text-sidebar-foreground"
                >
                    {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {/* Header (permanece o mesmo) */}
                <div className="sticky top-0 bg-card border-b border-border p-6 z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">Instâncias GPON</h1>
                            <p className="text-muted-foreground">Gerenciar suas instâncias e módulos atribuídos</p>
                        </div>
                        <Button className="gap-2" onClick={() => setCreateInstanceOpen(true)}>
                            <Plus className="w-4 h-4" />
                            Criar Instância
                        </Button>
                    </div>
                </div>

                {/* 4. Conteúdo Atualizado para usar Accordion com Lista */}
                <div className="p-6 space-y-6">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : Object.keys(groupedInstances).length === 0 ? (
                        <Card>
                            <CardContent className="p-10 text-center text-muted-foreground">
                                Nenhuma instância encontrada.
                            </CardContent>
                        </Card>
                    ) : (
                        <Accordion type="multiple" className="w-full space-y-4">
                            {Object.entries(groupedInstances).map(([clientName, clientInstances]) => (
                                <AccordionItem value={clientName} key={clientName} className="border border-border rounded-lg shadow-sm bg-card">
                                    <AccordionTrigger className="px-6 py-4 text-lg font-medium hover:no-underline">
                                        {clientName}
                                        <Badge variant="secondary" className="ml-3">{clientInstances.length} Instância(s)</Badge>
                                    </AccordionTrigger>

                                    {/* --- Início da Lista (Substitui a Tabela) --- */}
                                    <AccordionContent className="border-t border-border p-0">
                                        <div className="flex flex-col">
                                            {clientInstances.map((instance) => (
                                                <div
                                                    key={instance.id}
                                                    className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 p-4 border-b border-border last:border-b-0"
                                                >
                                                    {/* Coluna 1: Nome e Data */}
                                                    <div className="flex-1 min-w-[200px]">
                                                        <p className="text-sm text-muted-foreground">
                                                            Criado em: {formatDate(instance.createdAt)}
                                                        </p>
                                                    </div>

                                                    {/* Coluna 2: Badges de Info */}
                                                    <div className="flex flex-wrap gap-2">
                                                        <Badge variant="secondary" className="flex items-center gap-1.5">
                                                            <Layers className="w-3 h-3" />
                                                            {instance.modules.length} Módulo(s)
                                                        </Badge>
                                                        <Badge variant="secondary" className="flex items-center gap-1.5">
                                                            <Box className="w-3 h-3" />
                                                            {instance.containers.length} Container(s)
                                                        </Badge>
                                                    </div>

                                                    {/* Coluna 3: Ações */}
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button size="sm" variant="ghost" onClick={() => handleViewInstanceDetails(instance)}>
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                        <Button size="sm" variant="ghost" onClick={() => handleEditInstance(instance)}>
                                                            <Edit2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    )}
                </div>
            </main>

            {/* Modais (permanecem os mesmos) */}
            {selectedInstance && (
                <GponInstanceDetailsModal
                    instance={selectedInstance}
                    open={instanceDetailsOpen}
                    onOpenChange={setInstanceDetailsOpen}
                />
            )}

            <CreateInstanceModal
                open={createInstanceOpen}
                onOpenChange={setCreateInstanceOpen}
                clients={clients}
                modules={modules}
                onInstanceCreated={async () => {
                    await fetchPageData()
                }}
            />
            <EditInstanceModal
                open={editingInstanceOpen}
                onOpenChange={setEditingInstanceOpen}
                instanceId={editingInstanceId}
                clients={clients}
                modules={modules}
                onInstanceUpdated={async () => {
                    await fetchPageData()
                }}
            />
        </div>
    )
}