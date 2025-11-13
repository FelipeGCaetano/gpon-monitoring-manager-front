"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient } from "@/lib/api-client"
import { Container } from "@/lib/types"
import { HardDrive, KeyRound, Loader2, Network, RefreshCw, X } from "lucide-react"
import { useEffect, useState } from "react"

interface ContainerDetailsModalProps {
  container: Container // Recebe o container básico da lista
  isOpen: boolean
  onClose: () => void
}

// Helper para formatar data
const formatDate = (dateString: Date | string) => {
  if (!dateString) return "N/A"
  return new Date(dateString).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function ContainerDetailsModal({ container, isOpen, onClose }: ContainerDetailsModalProps) {
  const [fullContainer, setFullContainer] = useState<Container | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isOpen && container) {
      const fetchContainerDetails = async () => {
        setIsLoading(true)
        try {
          // Busca os dados completos do container
          const data = await apiClient.getContainerById(container.id)
          setFullContainer(data)
        } catch (error) {
          console.error("Falha ao buscar detalhes do container:", error)
          // TODO: Adicionar toast de erro
        } finally {
          setIsLoading(false)
        }
      }
      fetchContainerDetails()
    }
  }, [isOpen, container])

  // Atualizado para usar os status da API (maiúsculas)
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "RUNNING":
        return "bg-chart-4"
      case "PAUSED":
        return "bg-chart-2"
      case "STOPPED":
        return "bg-destructive"
      default:
        return "bg-muted"
    }
  }

  // Trunca o ID do container para exibição
  const truncateId = (id: string) => {
    if (!id) return "N/A"
    return id.substring(0, 12)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-border flex items-center justify-between p-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{container.name}</h2>
            <p className="text-sm text-muted-foreground font-mono">{container.imageTemplate.image}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : !fullContainer ? (
            <div className="text-center text-muted-foreground py-20">
              Não foi possível carregar os dados do container.
            </div>
          ) : (
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="environment">Ambiente</TabsTrigger>
                <TabsTrigger value="mappings">Mapeamentos</TabsTrigger>
                <TabsTrigger value="logs">Registros</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Informações de Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status Atual</span>
                      <Badge className={`${getStatusColor(fullContainer.status)} text-white border-0`}>
                        {fullContainer.status === "RUNNING"
                          ? "EM EXECUÇÃO"
                          : fullContainer.status === "PAUSED"
                            ? "PAUSADO"
                            : "PARADO"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Criado em</span>
                      <span className="text-sm font-medium">{formatDate(fullContainer.createdAt)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Último Reinício</span>
                      <span className="text-sm font-medium">
                        {fullContainer.lastRestart ? formatDate(fullContainer.lastRestart) : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">ID do Container</span>
                      <span className="text-xs font-mono text-muted-foreground">
                        {truncateId(fullContainer.id)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">ID da Instância GPON</span>
                      <span className="text-xs font-mono text-muted-foreground">
                        {fullContainer.gponInstanceId}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Template da Imagem</span>
                      <span className="text-sm font-medium">
                        {fullContainer.imageTemplate.name}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                {/* Card de Recursos (CPU/Memória) removido pois não há dados da API */}
              </TabsContent>

              {/* Environment Tab */}
              <TabsContent value="environment" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Variáveis de Ambiente</CardTitle>
                    <CardDescription>Configurações de ambiente do container (somente leitura)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                    {fullContainer.envVariables.length > 0 ? (
                      fullContainer.envVariables.map((envVar) => (
                        <div key={envVar.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary">
                          <KeyRound className="w-4 h-4 mt-1 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="text-sm font-mono font-medium">{envVar.key}</p>
                            <p className="text-sm text-muted-foreground font-mono break-all">{envVar.value}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma variável de ambiente definida.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Mappings Tab (Nova) */}
              <TabsContent value="mappings" className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Network className="w-4 h-4" />
                        Portas Expostas
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {fullContainer.portMapping.length > 0 ? (
                        fullContainer.portMapping.map((p) => (
                          <div key={p.id} className="flex items-center justify-between text-sm">
                            <div>
                              <p className="font-medium">
                                Host: <span className="font-mono">{p.publicPort}</span>
                              </p>
                            </div>
                            <p className="text-muted-foreground">
                              &rarr; Container: <span className="font-mono">{p.privatePort}</span>
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nenhuma porta mapeada.
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <HardDrive className="w-4 h-4" />
                        Volumes Mapeados
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {fullContainer.volumeMapping.length > 0 ? (
                        fullContainer.volumeMapping.map((v) => (
                          <div key={v.id} className="flex flex-col text-sm">
                            <p className="font-medium">
                              Host: <span className="font-mono">{v.hostVolumeName}</span>
                            </p>
                            <p className="text-muted-foreground">
                              &rarr; Container: <span className="font-mono">{v.containerPath}</span>
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nenhum volume mapeado.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Logs Tab */}
              <TabsContent value="logs" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Registros do Container</CardTitle>
                    <CardDescription>Visualização de logs em tempo real</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-secondary rounded-lg p-4 font-mono text-xs space-y-2 max-h-96 overflow-y-auto text-center text-muted-foreground py-10">
                      Funcionalidade de logs em tempo real ainda não implementada.
                      {/* TODO: Implementar WebSocket ou polling para
                      apiClient.getContainerLogs(container.id) */}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-border flex gap-3 p-6 justify-end mt-auto">
          {/* O botão Recarregar pode ser usado para buscar os dados novamente */}
          <Button
            variant="outline"
            className="gap-2"
            onClick={async () => {
              if (!container) return
              setIsLoading(true)
              try {
                const data = await apiClient.getContainerById(container.id)
                setFullContainer(data)
              } catch (e) { console.error(e) }
              setIsLoading(false)
            }}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Recarregar
          </Button>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  )
}