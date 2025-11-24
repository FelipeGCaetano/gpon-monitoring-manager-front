"use client"

import { ProtectedLayout } from "@/components/layout/protected-layout"
import { CreateClientModal } from "@/components/modals/client/create-client-modal"
import { EditClientModal } from "@/components/modals/client/update-client-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// Importar Input
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { apiClient } from "@/lib/api-client"
import { Client } from "@/lib/types"
// Adicionar ícones Search e ArrowUpDown
import { ArrowUpDown, Edit2, Loader2, Plus, Search, Trash2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { useAuth } from "../auth-context"

// --- Helper para formatar telefone ---
const formatPhone = (value: string) => {
  if (!value) return ""
  let v = value.replace(/\D/g, "")
  v = v.slice(0, 11)
  if (v.length > 10) {
    v = v.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3")
  } else if (v.length > 6) {
    v = v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3")
  } else if (v.length > 2) {
    v = v.replace(/^(\d{2})(\d{0,5}).*/, "($1) $2")
  } else if (v.length > 0) {
    v = v.replace(/^(\d{0,2}).*/, "($1")
  }
  return v
}

// Tipo auxiliar para ordenação
type SortConfig = {
  key: string
  direction: "asc" | "desc"
} | null

export default function ClientsPage() {
  const { userCan, isAuthLoading } = useAuth()

  // --- Estados dos Modais ---
  const [isCreateClientOpen, setIsCreateClientOpen] = useState(false)
  const [isEditClientOpen, setIsEditClientOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  // --- Estados de Dados e UI ---
  const [clients, setClients] = useState<Client[]>([])
  const [isLoadingClients, setIsLoadingClients] = useState(true)

  // ✅ Novos estados para Busca e Ordenação
  const [searchQuery, setSearchQuery] = useState("")
  const [sortConfig, setSortConfig] = useState<SortConfig>(null)

  // --- Buscar clientes ---
  const fetchClients = async () => {
    if (userCan("read:clients")) {
      setIsLoadingClients(true)
      try {
        const clientsData = await apiClient.getClients()
        setClients(clientsData || [])
      } catch (error) {
        console.error("Falha ao buscar clientes:", error)
      } finally {
        setIsLoadingClients(false)
      }
    } else {
      setClients([])
      setIsLoadingClients(false)
    }
  }

  useEffect(() => {
    if (isAuthLoading) return
    if (!isAuthLoading && isLoadingClients) fetchClients()
  }, [isAuthLoading, userCan, isLoadingClients])

  // --- Lógica de Ordenação e Filtro ---
  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return { key, direction: current.direction === "asc" ? "desc" : "asc" }
      }
      return { key, direction: "asc" }
    })
  }

  const filteredAndSortedClients = useMemo(() => {
    // 1. Filtragem
    let result = clients.filter((client) => {
      if (!searchQuery) return true

      const query = searchQuery.toLowerCase()

      // Procura por nome, email ou telefone
      // Obs: para telefone, removemos formatação para buscar apenas números se o usuário digitar números
      const cleanPhone = client.phone ? client.phone.replace(/\D/g, "") : ""

      return (
        client.name.toLowerCase().includes(query) ||
        (client.email && client.email.toLowerCase().includes(query)) ||
        cleanPhone.includes(query) ||
        (client.phone && client.phone.includes(query))
      )
    })

    // 2. Ordenação
    if (sortConfig !== null) {
      result.sort((a, b) => {
        let aValue: any
        let bValue: any

        // Tratamento especial para "Instâncias" (array length)
        if (sortConfig.key === "instances") {
          aValue = a.gponInstances?.length || 0
          bValue = b.gponInstances?.length || 0
        } else {
          // Campos normais (name, email, phone)
          aValue = a[sortConfig.key as keyof Client] || ""
          bValue = b[sortConfig.key as keyof Client] || ""
        }

        // Normalização para string case-insensitive
        if (typeof aValue === 'string') aValue = aValue.toLowerCase()
        if (typeof bValue === 'string') bValue = bValue.toLowerCase()

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
        return 0
      })
    }
    return result
  }, [clients, sortConfig, searchQuery])


  // --- Ações ---
  const handleDeleteClient = async (clientId: string) => {
    if (!window.confirm("Tem certeza que deseja deletar este cliente? Isso NÃO deletará as instâncias associadas.")) {
      return
    }
    try {
      await apiClient.deleteClient(clientId)
      setClients((prev) => prev.filter((c) => c.id !== clientId))
      toast.success("Cliente deletado com sucesso!")
    } catch (error) {
      toast.error("Falha ao deletar cliente.")
    }
  }

  const handleEditClient = (client: Client) => {
    setSelectedClient(client)
    setIsEditClientOpen(true)
  }

  // --- Componentes Auxiliares ---
  const LoadingRow = ({ cols }: { cols: number }) => (
    <TableRow>
      <TableCell colSpan={cols} className="h-24 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto" />
      </TableCell>
    </TableRow>
  )

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
    <ProtectedLayout title="Clientes" description="Gerenciar clientes do sistema">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Clientes Cadastrados</CardTitle>
            <CardDescription>Gerencie e monitore todos os clientes cadastrados</CardDescription>
          </CardHeader>
          <CardContent>
            {/* ✅ Barra de Pesquisa */}
            <div className="flex items-center mb-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou telefone..."
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
                    {/* Headers Ordenáveis */}
                    <SortableHead label="Nome do Cliente" sortKey="name" />
                    <SortableHead label="Email" sortKey="email" />
                    <SortableHead label="Telefone" sortKey="phone" />
                    {/* Ordenação customizada para contagem de array */}
                    <SortableHead label="Instâncias" sortKey="instances" />
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingClients ? (
                    <LoadingRow cols={5} />
                  ) : filteredAndSortedClients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        {searchQuery
                          ? "Nenhum cliente encontrado para sua busca."
                          : "Nenhum cliente cadastrado."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{client.email || "-"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatPhone(client.phone)}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {client.gponInstances?.length || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {userCan("update:client") && (
                              <Button size="sm" variant="ghost" onClick={() => handleEditClient(client)}>
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            )}
                            {userCan("delete:client") && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDeleteClient(client.id)}
                              >
                                <Trash2 className="w-4 h-4" />
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

        {/* Header Button */}
        <div className="flex justify-end mt-6">
          {userCan("create:clients") && (
            <Button className="gap-2" onClick={() => setIsCreateClientOpen(true)}>
              <Plus className="w-4 h-4" />
              Adicionar Cliente
            </Button>
          )}
        </div>
      </div>

      {/* Modais */}
      <CreateClientModal
        open={isCreateClientOpen}
        onOpenChange={setIsCreateClientOpen}
        onClientCreated={async () => {
          await fetchClients()
        }}
      />

      <EditClientModal
        open={isEditClientOpen}
        onOpenChange={setIsEditClientOpen}
        client={selectedClient}
        onClientUpdated={async () => {
          await fetchClients()
        }}
      />
    </ProtectedLayout>
  )
}