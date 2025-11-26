"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GponInstance as Instance } from "@/lib/types"; // Importando o tipo
import { Blocks, Globe, Lock } from "lucide-react"; // 1. Importar Blocks, Globe e Lock
import { useState } from "react"

interface GponInstanceDetailsModalProps {
  instance: Instance | null // Usando o tipo da API
  open: boolean
  onOpenChange: (open: boolean) => void
}

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

// Tipo temporário para a visualização de Domínios
interface ConsolidatedDomain {
  domain: string;
  targetPort: number;
  sslEnable: boolean;
  containerName: string;
}

// Função para extrair e consolidar domínios de todos os containers
const getConsolidatedDomains = (instance: Instance): ConsolidatedDomain[] => {
  if (!instance || !instance.containers) return [];

  return instance.containers
    .map(container => {
      if (container.domain) {
        return {
          domain: container.domain.domain,
          targetPort: container.domain.targetPort,
          sslEnable: container.domain.sslEnabled,
          containerName: container.name, // Nome do container
        };
      }
      return null;
    })
    .filter((domain): domain is ConsolidatedDomain => domain !== null);
};

export function GponInstanceDetailsModal({ instance, open, onOpenChange }: GponInstanceDetailsModalProps) {
  const [activeTab, setActiveTab] = useState("overview")

  if (!instance) return null

  const consolidatedDomains = getConsolidatedDomains(instance);

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
          {/* Adicionado a aba 'domains' e ajustado o grid para 4 colunas */}
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="containers">Containers</TabsTrigger>
            <TabsTrigger value="domains">Domínios</TabsTrigger> {/* Nova Aba */}
            <TabsTrigger value="modules">Módulos</TabsTrigger>
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

          {/* Containers Tab */}
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
                      <TableHead className="w-[30%]">Nome</TableHead>
                      <TableHead className="w-[50%]">Imagem</TableHead>
                      <TableHead className="w-[20%]">Status</TableHead>
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
                          <TableCell className="font-medium whitespace-normal break-words align-top">
                            {container.name}
                          </TableCell>
                          <TableCell className="font-mono text-xs whitespace-normal break-all align-top">
                            {container.imageTemplate.image}
                          </TableCell>
                          <TableCell className="align-top">
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

          {/* Domínios Tab (NOVA) */}
          <TabsContent value="domains" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Configurações de Domínio (Reverse Proxy)</CardTitle>
                <CardDescription>
                  Total de {consolidatedDomains.length} domínio(s) configurado(s).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Domínio</TableHead>
                      <TableHead className="w-[30%]">Container de Destino</TableHead>
                      <TableHead className="w-[15%]">Porta Interna</TableHead>
                      <TableHead className="w-[15%]">SSL</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consolidatedDomains.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          Nenhum domínio configurado para esta instância.
                        </TableCell>
                      </TableRow>
                    ) : (
                      consolidatedDomains.map((domain, index) => (
                        <TableRow key={domain.domain}>
                          <TableCell className="font-medium flex items-center gap-2">
                            <Globe className="w-4 h-4 text-primary/80" />
                            {domain.domain}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {domain.containerName}
                          </TableCell>
                          <TableCell className="font-medium text-center">
                            {domain.targetPort}
                          </TableCell>
                          <TableCell className="text-center">
                            {domain.sslEnable ? (
                              <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">
                                <Lock className="w-3 h-3 mr-1" /> HTTPS
                              </Badge>
                            ) : (
                              <Badge variant="secondary">HTTP</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Módulos Tab */}
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