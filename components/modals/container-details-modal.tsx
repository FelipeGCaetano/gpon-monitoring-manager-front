"use client"

import { useState } from "react"
import { X, RefreshCw, Network, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"

interface ContainerDetailsModalProps {
  container: any
  isOpen: boolean
  onClose: () => void
}

export default function ContainerDetailsModal({ container, isOpen, onClose }: ContainerDetailsModalProps) {
  const [logs, setLogs] = useState([
    { timestamp: "2024-11-03 14:30:22", level: "info", message: "Container iniciado com sucesso" },
    { timestamp: "2024-11-03 14:30:15", level: "info", message: "Carregando configuração de /config/app.json" },
    { timestamp: "2024-11-03 14:30:10", level: "warn", message: "Uso de memória acima de 80%" },
    { timestamp: "2024-11-03 14:30:05", level: "info", message: "Conectado ao banco de dados" },
  ])

  const [envVars, setEnvVars] = useState([
    { key: "GPON_MODE", value: "production", editable: false },
    { key: "DATABASE_URL", value: "postgresql://db.local:5432/gpon", editable: true },
    { key: "LOG_LEVEL", value: "info", editable: true },
    { key: "WORKER_THREADS", value: "4", editable: true },
  ])

  const [editingVar, setEditingVar] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")

  if (!isOpen) return null

  const handleSaveEnvVar = (key: string) => {
    setEnvVars(envVars.map((v) => (v.key === key ? { ...v, value: editValue } : v)))
    setEditingVar(null)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border flex items-center justify-between p-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{container.name}</h2>
            <p className="text-sm text-muted-foreground">{container.image}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="logs">Registros</TabsTrigger>
              <TabsTrigger value="environment">Ambiente</TabsTrigger>
              <TabsTrigger value="ports">Portas & Trabalhos</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Informações de Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status Atual</span>
                      <Badge className={`${container.status === "running" ? "bg-chart-4" : "bg-chart-2"} text-white`}>
                        {container.status === "running" ? "EM EXECUÇÃO" : "PARADO"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Tempo de Atividade</span>
                      <span className="text-sm font-medium">{container.uptime}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">ID do Container</span>
                      <span className="text-xs font-mono text-muted-foreground">docker-01</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Uso de Recursos</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">CPU</span>
                        <span className="text-sm font-medium">{container.cpu}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded h-2">
                        <div className="bg-chart-1 h-2 rounded" style={{ width: `${container.cpu}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Memória</span>
                        <span className="text-sm font-medium">{container.memory}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded h-2">
                        <div className="bg-accent h-2 rounded" style={{ width: `${container.memory}%` }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Logs Tab */}
            <TabsContent value="logs" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Registros do Container</CardTitle>
                  <CardDescription>Últimas 50 entradas de registro</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-secondary rounded-lg p-4 font-mono text-xs space-y-2 max-h-96 overflow-y-auto">
                    {logs.map((log, idx) => (
                      <div key={idx} className="flex gap-3">
                        <span className="text-muted-foreground min-w-fit">{log.timestamp}</span>
                        <span
                          className={`min-w-fit px-2 rounded ${
                            log.level === "info"
                              ? "bg-chart-4/20 text-chart-4"
                              : log.level === "warn"
                                ? "bg-chart-3/20 text-chart-3"
                                : "bg-destructive/20 text-destructive"
                          }`}
                        >
                          {log.level === "info" ? "INFO" : log.level === "warn" ? "AVISO" : "ERRO"}
                        </span>
                        <span className="text-foreground">{log.message}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Environment Tab */}
            <TabsContent value="environment" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Variáveis de Ambiente</CardTitle>
                  <CardDescription>Configurar as configurações de ambiente do container</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {envVars.map((envVar) => (
                    <div key={envVar.key} className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
                      <div className="flex-1">
                        <p className="text-sm font-mono font-medium">{envVar.key}</p>
                        {editingVar === envVar.key ? (
                          <Input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="mt-1"
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground">{envVar.value}</p>
                        )}
                      </div>
                      {envVar.editable && (
                        <div className="flex gap-2">
                          {editingVar === envVar.key ? (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => handleSaveEnvVar(envVar.key)}>
                                Salvar
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingVar(null)}>
                                Cancelar
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingVar(envVar.key)
                                setEditValue(envVar.value)
                              }}
                            >
                              Editar
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Ports & Workers Tab */}
            <TabsContent value="ports" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Network className="w-4 h-4" />
                      Portas Expostas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      { port: 8080, protocol: "HTTP", status: "active" },
                      { port: 8443, protocol: "HTTPS", status: "active" },
                      { port: 5432, protocol: "PostgreSQL", status: "active" },
                      { port: 6379, protocol: "Redis", status: "active" },
                    ].map((p) => (
                      <div key={p.port} className="flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium">
                            {p.port}/{p.protocol}
                          </p>
                        </div>
                        <Badge variant="outline" className="bg-chart-4/20 text-chart-4 border-0">
                          {p.status === "active" ? "Ativa" : "Inativa"}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Trabalhos Ativos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      { id: "worker-1", status: "active" },
                      { id: "worker-2", status: "active" },
                      { id: "worker-3", status: "idle" },
                      { id: "worker-4", status: "active" },
                    ].map((w) => (
                      <div key={w.id} className="flex items-center justify-between text-sm">
                        <p className="font-medium">{w.id}</p>
                        <Badge
                          variant="outline"
                          className={`${w.status === "active" ? "bg-chart-4/20 text-chart-4" : "bg-muted/20 text-muted-foreground"} border-0`}
                        >
                          {w.status === "active" ? "Ativo" : "Ocioso"}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-border">
            <Button className="gap-2" onClick={onClose}>
              <RefreshCw className="w-4 h-4" />
              Recarregar
            </Button>
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
