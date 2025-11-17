"use client"

import { ProtectedLayout } from "@/components/layout/protected-layout"
import { CreateClientModal } from "@/components/modals/client/create-client-modal"
import { EditClientModal } from "@/components/modals/client/update-client-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { apiClient } from "@/lib/api-client"
import { Client } from "@/lib/types"
import { Edit2, Loader2, Plus, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
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

export default function ClientsPage() {
  const { userCan, isAuthLoading } = useAuth()

  // --- Estados dos Modais ---
  const [isCreateClientOpen, setIsCreateClientOpen] = useState(false)
  const [isEditClientOpen, setIsEditClientOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  // --- Dados da API ---
  const [clients, setClients] = useState<Client[]>([])
  const [isLoadingClients, setIsLoadingClients] = useState(true)

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
    if (isAuthLoading) {
      return;
    }
    if (!isAuthLoading && isLoadingClients) {
      fetchClients();
    }
  }, [isAuthLoading, userCan, isLoadingClients])

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

  // --- Componente de linha de carregamento ---
  const LoadingRow = ({ cols }: { cols: number }) => (
    <TableRow>
      <TableCell colSpan={cols} className="h-24 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto" />
      </TableCell>
    </TableRow>
  )

  return (
    <ProtectedLayout title="Clientes" description="Gerenciar clientes do sistema">
      {/* Tabela de Clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Clientes Cadastrados</CardTitle>
          <CardDescription>Gerencie e monitore todos os clientes cadastrados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Cliente</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Instâncias</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingClients ? (
                  <LoadingRow cols={5} />
                ) : clients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Nenhum cliente encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{client.email}</TableCell>
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
