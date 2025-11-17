"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GponInstance as Instance } from "@/lib/types"; // Importando o tipo
import { Blocks } from "lucide-react"; // 1. Importar Blocks
import { useState } from "react"

interface GponInstanceDetailsModalProps {
  instance: Instance | null // Usando o tipo da API
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ... (helpers: formatDate, getStatusColor, getTypeColor, getTypeName) ...
// Helper para formatar data
const formatDate = (dateString: Date | string) => {
  if (!dateString) return "N/A"
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

// Funções de Cores
const getStatusColor = (status: string) => {
  switch (status) {
    case "RUNNING": return "bg-chart-4"
    case "PAUSED": return "bg-chart-2"
    default: return "bg-muted"
  }
}
const getTypeColor = (type: string) => {
  switch (type) {
    case "PRODUCTION": return "bg-chart-4"
    case "BACKUP": return "bg-chart-2"
    case "TESTING": return "bg-chart-3"
    case "MONITORING": return "bg-accent"
    default: return "bg-secondary"
  }
}
const getTypeName = (type: string) => {
  switch (type) {
    case "PRODUCTION": return "Produção"
    case "BACKUP": return "Backup"
    case "TESTING": return "Testes"
    case "MONITORING": return "Monitoramento"
    default: return type
  }
}

export function GponInstanceDetailsModal({ instance, open, onOpenChange }: GponInstanceDetailsModalProps) {
  const [activeTab, setActiveTab] = useState("overview")

  if (!instance) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{instance?.name}</DialogTitle>
          <DialogDescription>
            Detalhes da Instância - {instance?.name}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="containers">Containers</TabsTrigger>
            <TabsTrigger value="modules">Módulos Licenciados</TabsTrigger>
          </TabsList>

          {/* Overview Tab (Dados Reais) */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Informações da Instância</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Nome da Instância</span>
                  <span className="font-medium">{instance?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cliente</span>
                  <span className="font-medium">{instance?.client?.name}</span>
                </div>
                {/* 2. Adicionar linha do Projeto */}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Projeto</span>
                  <span className="font-medium flex items-center gap-2">
                    {instance.projectTemplate ? (
                      <>
                        <Blocks className="w-4 h-4" /> {instance.projectTemplate.name}
                      </>
                    ) : (
                      "Configuração Manual"
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Criado em</span>
                  <span className="font-medium">{formatDate(instance.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ... (Abas 'containers' e 'modules' permanecem as mesmas) ... */}

          {/* Containers Tab (Nova) */}
          <TabsContent value="containers" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Containers da Instância</CardTitle>
                <CardDescription>
                  Total de {instance.containers.length} container(s) associado(s).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Imagem</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {instance.containers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
                          Nenhum container associado a esta instância.
                        </TableCell>
                      </TableRow>
                    ) : (
                      instance.containers.map((container) => (
                        <TableRow key={container.id}>
                          <TableCell className="font-medium">{container.name}</TableCell>
                          <TableCell className="font-mono text-xs">{container.imageTemplate.image}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`${getStatusColor(container.status)} text-white border-0`}
                            >
                              {container.status === "RUNNING" ? "Em Execução" : "Parado/Outro"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Módulos Tab (Nova) */}
          <TabsContent value="modules" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Módulos Licenciados</CardTitle>
                <CardDescription>
                  Total de {instance.modules.length} módulo(s) licenciado(s).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome do Módulo</TableHead>
                      <TableHead>Versão</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {instance.modules.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="h-24 text-center">
                          Nenhum módulo licenciado para esta instância.
                        </TableCell>
                      </TableRow>
                    ) : (
                      instance.modules.map((module) => (
                        <TableRow key={module.id}>
                          <TableCell className="font-medium">{module.name}</TableCell>
                          <TableCell className="font-mono text-xs">{module.version}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </DialogContent>
    </Dialog>
  )
}