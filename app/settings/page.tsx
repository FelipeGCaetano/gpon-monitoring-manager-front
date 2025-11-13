"use client"

import { ProtectedLayout } from "@/components/layout/protected-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient } from "@/lib/api-client"
import { Loader2, Save } from "lucide-react"
import { useEffect, useState } from "react"

// Tipos
interface GlobalEnv {
  id: string
  key: string
  value: string
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
      setGlobalEnvs(settingsData.globalEnv || [])
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

  const handleGlobalVarChange = (index: number, value: string) => {
    setGlobalEnvs((prevEnvs) =>
      prevEnvs.map((env, i) => (i === index ? { ...env, value } : env))
    )
  }

  const handleSaveSettings = async () => {
    if (!settingsId) {
      console.error("ID das Configurações não encontrado.")
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        systemName: generalSettings.systemName,
        adminEmail: generalSettings.adminEmail,
        globalEnvs: globalEnvs.map((env) => ({
          key: env.key,
          value: env.value,
        })),
      }

      await apiClient.updateSettings(settingsId, payload)
      await fetchSettings()
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

          {/* Aba: Variáveis Globais */}
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
                    {globalEnvs.map((env, index) => (
                      <div key={env.id} className="space-y-2 p-4 rounded-lg bg-secondary">
                        <label className="text-sm font-medium text-foreground">{env.key}</label>
                        <input
                          type="text"
                          value={env.value}
                          onChange={(e) => handleGlobalVarChange(index, e.target.value)}
                          disabled={isSubmitting}
                          className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground disabled:opacity-50"
                        />
                      </div>
                    ))}
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
