"use client"

import { ProtectedLayout } from "@/components/layout/protected-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient } from "@/lib/api-client"
import { Loader2, Plus, Save, Trash2 } from "lucide-react"; // 1. Adicionado Plus e Trash2
import { useEffect, useState } from "react"

// 2. Interface atualizada
interface GlobalEnv {
  id: string // ID do banco de dados ou crypto.randomUUID() para novos
  key: string
  value: string
  isNew?: boolean // Flag para identificar novas variáveis
}

interface GeneralSettings {
  systemName: string
  adminEmail: string
  updatedAt: string
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

export default function SettingsPage() {
  const [settingsId, setSettingsId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    systemName: "",
    adminEmail: "",
    updatedAt: "",
  })

  const [globalEnvs, setGlobalEnvs] = useState<GlobalEnv[]>([])

  // --- Carrega dados da API ---
  const fetchSettings = async () => {
    setIsLoading(true)
    try {
      const settingsData = await apiClient.getSettings()
      setSettingsId(settingsData.id)
      setGeneralSettings({
        systemName: settingsData.systemName,
        adminEmail: settingsData.adminEmail,
        updatedAt: formatDate(settingsData.updatedAt),
      })
      // 3. Adiciona a flag isNew: false para variáveis existentes
      setGlobalEnvs(settingsData.globalEnv.map((env: any) => ({ ...env, isNew: false })) || [])
    } catch (error) {
      console.error("Falha ao carregar configurações:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  // --- Handlers ---
  const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setGeneralSettings((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // 4. Handler de Variáveis Globais (Atualizado para usar ID e 'key'/'value')
  const handleGlobalVarChange = (id: string, field: "key" | "value", value: string) => {
    setGlobalEnvs((prevEnvs) =>
      prevEnvs.map((env) =>
        env.id === id ? { ...env, [field]: value } : env
      )
    )
  }

  // 5. Nova função para Adicionar Env
  const handleAddNewGlobalVar = () => {
    setGlobalEnvs((prevEnvs) => [
      ...prevEnvs,
      { id: crypto.randomUUID(), key: "", value: "", isNew: true },
    ])
  }

  // 6. Nova função para Deletar Env
  const handleDeleteGlobalVar = (id: string) => {
    setGlobalEnvs((prevEnvs) => prevEnvs.filter((env) => env.id !== id))
  }


  const handleSaveSettings = async () => {
    if (!settingsId) {
      console.error("ID das Configurações não encontrado.")
      return
    }

    setIsSubmitting(true)
    try {
      // 7. Payload atualizado para filtrar novas chaves vazias
      const payload = {
        systemName: generalSettings.systemName,
        adminEmail: generalSettings.adminEmail,
        globalEnvs: globalEnvs
          .filter(env => env.key.trim() !== "") // Garante que a chave não está vazia
          .map((env) => ({ // Envia apenas o que a API espera
            key: env.key,
            value: env.value,
          })),
      }

      await apiClient.updateSettings(settingsId, payload)
      await fetchSettings() // Recarrega os dados para sincronizar IDs
    } catch (error) {
      console.error("Falha ao salvar configurações:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ProtectedLayout title="Configurações" description="Gerenciar configurações globais do sistema">
      <div className="max-w-6xl space-y-6">
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="variables">Variáveis Globais</TabsTrigger>
          </TabsList>

          {/* Aba: Geral */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Sistema</CardTitle>
                <CardDescription>Configuração geral e detalhes do sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nome do Sistema</label>
                        <input
                          type="text"
                          name="systemName"
                          value={generalSettings.systemName}
                          onChange={handleGeneralChange}
                          disabled={isSubmitting}
                          className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground disabled:opacity-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Email do Administrador</label>
                        <input
                          type="email"
                          name="adminEmail"
                          value={generalSettings.adminEmail}
                          onChange={handleGeneralChange}
                          disabled={isSubmitting}
                          className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground disabled:opacity-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Versão do Sistema</label>
                        <input
                          type="text"
                          value="v1.0.0"
                          disabled
                          className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-muted-foreground"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Última Atualização</label>
                        <input
                          type="text"
                          value={generalSettings.updatedAt}
                          disabled
                          className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-muted-foreground"
                        />
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <Button
                        className="gap-2"
                        onClick={handleSaveSettings}
                        disabled={isSubmitting || isLoading}
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Salvar Alterações
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Variáveis Globais (Atualizada com CRUD) */}
          <TabsContent value="variables" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Variáveis Globais de Configuração</CardTitle>
                <CardDescription>Gerenciar variáveis de ambiente do sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {globalEnvs.map((env) => (
                        <div key={env.id} className="flex items-end gap-2 p-4 rounded-lg bg-secondary">
                          {/* Campo Chave */}
                          <div className="flex-1 space-y-2">
                            <label className="text-sm font-medium text-foreground">Chave</label>
                            <input
                              type="text"
                              placeholder="EXEMPLO_VAR"
                              value={env.key}
                              // Só permite editar a chave se for um item novo
                              onChange={(e) => handleGlobalVarChange(env.id, 'key', e.target.value)}
                              disabled={isSubmitting || !env.isNew}
                              className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground disabled:opacity-70 disabled:bg-secondary"
                            />
                          </div>
                          {/* Campo Valor */}
                          <div className="flex-1 space-y-2">
                            <label className="text-sm font-medium text-foreground">Valor</label>
                            <input
                              type="text"
                              placeholder="Valor da variável"
                              value={env.value}
                              onChange={(e) => handleGlobalVarChange(env.id, 'value', e.target.value)}
                              disabled={isSubmitting}
                              className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground disabled:opacity-50"
                            />
                          </div>
                          {/* Botão Deletar */}
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteGlobalVar(env.id)}
                            disabled={isSubmitting}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Botão Adicionar */}
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2"
                      onClick={handleAddNewGlobalVar}
                      disabled={isSubmitting}
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar Variável
                    </Button>

                    <hr className="border-border" />

                    {/* Botão Salvar */}
                    <Button
                      className="gap-2 w-full"
                      onClick={handleSaveSettings}
                      disabled={isSubmitting || isLoading}
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Salvar Variáveis Globais
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedLayout>
  )
}