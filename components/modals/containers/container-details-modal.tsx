"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient } from "@/lib/api-client"
import { Container } from "@/lib/types"
import { Ban, HardDrive, KeyRound, Loader2, Network, RefreshCw, Terminal, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { io, Socket } from "socket.io-client"
import { toast } from "sonner"

// Ajuste esta URL para apontar para onde seu backend (server.ts) está rodando
// Geralmente é a mesma URL da API, ex: http://localhost:3333
const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ContainerDetailsModalProps {
  container: Container
  isOpen: boolean
  onClose: () => void
}

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
  const [activeTab, setActiveTab] = useState("overview")

  // --- Estados para Logs ---
  const [logs, setLogs] = useState<string[]>([])
  const [isSocketConnected, setIsSocketConnected] = useState(false)
  const logsEndRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<Socket | null>(null)

  // Busca detalhes completos do container ao abrir
  useEffect(() => {
    if (isOpen && container) {
      const fetchContainerDetails = async () => {
        setIsLoading(true)
        try {
          const data = await apiClient.getContainerById(container.id)
          setFullContainer(data)
        } catch (error) {
          toast.error("Falha ao buscar detalhes do container.")
        } finally {
          setIsLoading(false)
        }
      }
      fetchContainerDetails()
    }

    // Cleanup ao fechar modal
    if (!isOpen) {
      setActiveTab("overview")
      setLogs([])
      disconnectSocket()
    }
  }, [isOpen, container])

  // Função auxiliar para desconectar
  const disconnectSocket = () => {
    if (socketRef.current) {
      socketRef.current.emit("unsubscribe_logs")
      socketRef.current.disconnect()
      socketRef.current = null
      setIsSocketConnected(false)
    }
  }

  // Gerenciamento do WebSocket quando a aba de logs é ativada
  useEffect(() => {
    // Só conecta se a modal estiver aberta, a aba for logs e o container existir
    if (isOpen && activeTab === "logs" && container) {

      // Inicializa conexão
      const socket = io(SOCKET_URL, {
        transports: ['websocket'],
        reconnection: true,
      })

      socketRef.current = socket

      socket.on("connect", () => {
        console.log("[Frontend] Conectado ao Socket.IO")
        setIsSocketConnected(true)
        setLogs(["--- Conectando ao stream de logs... ---"])

        // IMPORTANTE: Seu backend espera o NOME do container, não o ID
        socket.emit("subscribe_logs", container.name)
      })

      // Escuta novos logs vindos do backend
      // Payload esperado: { timestamp: string, message: string }
      socket.on("new_log", (data: { timestamp: string, message: string }) => {
        setLogs((prev) => {
          // Otimização: Manter buffer máximo de 500 linhas para não travar a UI
          const newLogs = [...prev, data.message]
          if (newLogs.length > 500) {
            return newLogs.slice(newLogs.length - 500)
          }
          return newLogs
        })
      })

      socket.on("log_error", (errorMessage: string) => {
        setLogs((prev) => [...prev, `[ERRO SOCKET] ${errorMessage}`])
      })

      socket.on("disconnect", () => {
        console.log("[Frontend] Desconectado do Socket.IO")
        setIsSocketConnected(false)
        setLogs((prev) => [...prev, "--- Conexão perdida ---"])
      })

      socket.on("connect_error", (err) => {
        console.error("[Frontend] Erro de conexão socket:", err)
        setLogs((prev) => [...prev, `[ERRO CONEXÃO] Não foi possível conectar ao servidor de logs.`])
      })

      // Cleanup function do useEffect
      return () => {
        disconnectSocket()
      }
    }
  }, [isOpen, activeTab, container])

  // Auto-scroll para a última linha
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [logs])

  // Cores do Status
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "RUNNING": return "bg-chart-4"
      case "PAUSED": return "bg-chart-2"
      case "STOPPED": return "bg-destructive"
      default: return "bg-muted"
    }
  }

  const truncateId = (id: string) => (!id ? "N/A" : id.substring(0, 12))

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-border">
        {/* Header */}
        <div className="border-b border-border flex items-center justify-between p-6 bg-card/50">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              {container.name}
              {fullContainer && (
                <Badge className={`${getStatusColor(fullContainer.status)} text-white border-0 text-xs px-2 py-0.5`}>
                  {fullContainer.status}
                </Badge>
              )}
            </h2>
            <p className="text-sm text-muted-foreground font-mono mt-1">{container.imageTemplate.image}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          {isLoading ? (
            <div className="flex flex-col justify-center items-center h-64 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm">Carregando detalhes do container...</p>
            </div>
          ) : !fullContainer ? (
            <div className="text-center text-muted-foreground py-20 flex flex-col items-center gap-4">
              <Ban className="w-10 h-10" />
              <p>Não foi possível carregar os dados completos.</p>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 h-full flex flex-col">
              <TabsList className="w-full justify-start border-b rounded-none px-0 bg-transparent h-auto">
                <TabsTrigger value="overview" className="data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2">Visão Geral</TabsTrigger>
                <TabsTrigger value="environment" className="data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2">Ambiente</TabsTrigger>
                <TabsTrigger value="mappings" className="data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2">Mapeamentos</TabsTrigger>
                <TabsTrigger value="logs" className="data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2">Registros</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Informações de Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">ID do Container</span>
                        <p className="text-sm font-mono">{truncateId(fullContainer.id)}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Criado em</span>
                        <p className="text-sm">{formatDate(fullContainer.createdAt)}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Último Reinício</span>
                        <p className="text-sm">{fullContainer.lastRestart ? formatDate(fullContainer.lastRestart) : "N/A"}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">ID Instância GPON</span>
                        <p className="text-sm font-mono">{fullContainer.gponInstanceId}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Environment Tab */}
              <TabsContent value="environment" className="space-y-4 mt-4 h-full overflow-hidden flex flex-col">
                <Card className="flex-1 flex flex-col min-h-0">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Variáveis de Ambiente</CardTitle>
                    <CardDescription>Configurações de runtime (somente leitura)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 overflow-y-auto pr-2">
                    {fullContainer.envVariables.length > 0 ? fullContainer.envVariables.map((envVar) => (
                      <div key={envVar.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                        <KeyRound className="w-4 h-4 mt-1 text-primary" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-mono font-semibold text-foreground">{envVar.key}</p>
                          <p className="text-xs text-muted-foreground font-mono break-all mt-1">{envVar.value}</p>
                        </div>
                      </div>
                    )) : (
                      <p className="text-sm text-muted-foreground text-center py-8">Nenhuma variável definida.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Mappings Tab */}
              <TabsContent value="mappings" className="space-y-4 mt-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Network className="w-4 h-4 text-primary" />
                        Portas
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {fullContainer.portMapping.length > 0 ? fullContainer.portMapping.map((p) => (
                        <div key={p.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded border">
                          <span className="font-mono text-muted-foreground">{p.publicPort} (Host)</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="font-mono font-medium">{p.privatePort} (Container)</span>
                        </div>
                      )) : <p className="text-xs text-muted-foreground text-center py-4">Sem mapeamento de portas.</p>}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-primary" />
                        Volumes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {fullContainer.volumeMapping.length > 0 ? fullContainer.volumeMapping.map((v) => (
                        <div key={v.id} className="flex flex-col text-sm p-2 bg-muted/50 rounded border gap-1">
                          <div className="flex justify-between">
                            <span className="text-xs text-muted-foreground">Host:</span>
                            <span className="font-mono text-xs">{v.hostVolumeName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-muted-foreground">Container:</span>
                            <span className="font-mono text-xs">{v.containerPath}</span>
                          </div>
                        </div>
                      )) : <p className="text-xs text-muted-foreground text-center py-4">Sem volumes mapeados.</p>}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Logs Tab (INTEGRADO COM SOCKET) */}
              <TabsContent value="logs" className="flex-1 flex flex-col min-h-[400px] mt-4 data-[state=active]:flex">
                <Card className="flex-1 flex flex-col overflow-hidden border-zinc-800 bg-zinc-950 shadow-inner">
                  <CardHeader className="pb-2 bg-zinc-900/50 border-b border-zinc-800">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-zinc-400" />
                        <CardTitle className="text-sm text-zinc-100">Registros em Tempo Real</CardTitle>
                      </div>
                      <div className="flex items-center gap-3">
                        {isSocketConnected ? (
                          <span className="flex items-center gap-1.5 text-[10px] text-emerald-500 uppercase font-bold tracking-wider">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Ao Vivo
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Desconectado</span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                          onClick={() => setLogs([])}
                          title="Limpar logs"
                        >
                          <Ban className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 p-0 relative overflow-hidden font-mono text-xs">
                    <div className="absolute inset-0 p-4 overflow-y-auto space-y-0.5 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                      {logs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-2">
                          <Loader2 className="w-6 h-6 animate-spin opacity-20" />
                          <p>Aguardando logs do container...</p>
                        </div>
                      ) : (
                        logs.map((log, index) => (
                          <div key={index} className="text-zinc-300 break-all whitespace-pre-wrap leading-relaxed hover:bg-zinc-900/50 px-1 rounded">
                            <span className="text-zinc-600 select-none mr-2 text-[10px]">
                              {index + 1}
                            </span>
                            {log}
                          </div>
                        ))
                      )}
                      <div ref={logsEndRef} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-border flex gap-3 p-6 justify-end bg-card/50">
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
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  )
}