"use client"

import { ProtectedLayout } from "@/components/layout/protected-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient } from "@/lib/api-client"
import { Loader2, Plus, Save, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useAuth } from "../auth-context"

// --- Polyfill/Fallback para crypto.randomUUID ---
function simpleUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
const randomUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return simpleUUID();
}
// --- FIM DA CORREÇÃO ---


// 2. Interface atualizada
interface GlobalEnv {
  id: string
  key: string
  value: string
  isNew?: boolean
}

interface GeneralSettings {
  systemName: string
  adminEmail: string
  updatedAt: string
  dockerHost: string
  dockerPort: number
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
  const { userCan } = useAuth()
  const [settingsId, setSettingsId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    systemName: "",
    adminEmail: "",
    updatedAt: "",
    dockerHost: "", // Padrão vazio
    dockerPort: 2375
  })

  const [globalEnvs, setGlobalEnvs] = useState<GlobalEnv[]>([])

  // --- Carrega dados da API ---
  const fetchSettings = async () => {
    setIsLoading(true)
    try {
      if (userCan("read:settings")) {
        const settingsData = await apiClient.getSettings()
        setSettingsId(settingsData.id)
        setGeneralSettings({
          systemName: settingsData.systemName,
          adminEmail: settingsData.adminEmail,
          updatedAt: formatDate(settingsData.updatedAt),
          dockerHost: settingsData.dockerHost || "", // Fallback para string vazia
          dockerPort: settingsData.dockerPort || 2375 // Fallback para porta padrão
        })
        setGlobalEnvs(settingsData.globalEnv.map((env: any) => ({ ...env, isNew: false })) || [])
      } else {
        setGlobalEnvs([])
      }
    } catch (error) {
      console.error("Falha ao carregar configurações:", error)
      toast.error("Falha ao carregar configurações.")
    } finally {
      setIsLoading(false)
    }
  }

  // --- CORREÇÃO: useEffect ATUALIZADO ---
  useEffect(() => {
    fetchSettings()
  }, [])
  // --- FIM DA CORREÇÃO ---

  // --- Handlers ---
  const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setGeneralSettings((prev) => ({
      ...prev,
      [name]: name === 'dockerPort' ? Number(value) : value, // Converte a porta para número
    }))
  }

  const handleGlobalVarChange = (id: string, field: "key" | "value", value: string) => {
    setGlobalEnvs((prevEnvs) =>
      prevEnvs.map((env) =>
        env.id === id ? { ...env, [field]: value } : env
      )
    )
  }

  const handleAddNewGlobalVar = () => {
    setGlobalEnvs((prevEnvs) => [
      ...prevEnvs,
      { id: randomUUID(), key: "", value: "", isNew: true }, // Usa randomUUID
    ])
  }

  const handleDeleteGlobalVar = (id: string) => {
    setGlobalEnvs((prevEnvs) => prevEnvs.filter((env) => env.id !== id))
  }


  const handleSaveSettings = async () => {
    if (!settingsId) {
      console.error("ID das Configurações não encontrado.")
      toast.error("Erro: ID das Configurações não encontrado.")
      return
    }

    setIsSubmitting(true)
    try {
      // --- CORREÇÃO: Payload ATUALIZADO ---
      const payload = {
        systemName: generalSettings.systemName,
        adminEmail: generalSettings.adminEmail,
        dockerHost: generalSettings.dockerHost,
        dockerPort: Number(generalSettings.dockerPort), // Garante que é um número
        globalEnvs: globalEnvs
          .filter(env => env.key.trim() !== "")
          .map((env) => ({
            key: env.key,
            value: env.value,
          })),
      }
      // --- FIM DA CORREÇÃO ---

      await apiClient.updateSettings(settingsId, payload)
      toast.success("Configurações salvas com sucesso!")
      await fetchSettings() // Recarrega os dados
    } catch (error) {
      console.error("Falha ao salvar configurações:", error)
      toast.error("Falha ao salvar configurações.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ProtectedLayout title="Configurações" description="Gerenciar configurações globais do sistema">
      <div className="max-w-6xl space-y-6">
        <Tabs defaultValue="general" className="space-y-4">
          {/* --- CORREÇÃO: TabsList ATUALIZADA --- */}
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="docker">Docker</TabsTrigger>
            <TabsTrigger value="variables">Variáveis Globais</TabsTrigger>
          </TabsList>
          {/* --- FIM DA CORREÇÃO --- */}

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
                ) : !userCan("read:settings") ? (
                  <div className="text-center text-destructive py-10">
                    Você não tem permissão para ver as configurações.
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
                          disabled={isSubmitting || !userCan("update:setting")}
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
                          disabled={isSubmitting || !userCan("update:setting")}
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

                    {userCan("update:setting") && (
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
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- NOVA ABA: Docker --- */}
          <TabsContent value="docker" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuração do Docker</CardTitle>
                <CardDescription>Endereço do Host e Porta do Daemon Docker</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : !userCan("read:settings") ? (
                  <div className="text-center text-destructive py-10">
                    Você não tem permissão para ver as configurações do Docker.
                  </div>
                ) : (
                  <>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Host do Docker</label>
                        <input
                          type="text"
                          name="dockerHost"
                          value={generalSettings.dockerHost}
                          onChange={handleGeneralChange}
                          placeholder="ex: 192.168.0.10"
                          disabled={isSubmitting || !userCan("update:setting")}
                          className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground disabled:opacity-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Porta do Docker</label>
                        <input
                          type="number"
                          name="dockerPort"
                          value={generalSettings.dockerPort}
                          onChange={handleGeneralChange}
                          placeholder="ex: 2375"
                          disabled={isSubmitting || !userCan("update:setting")}
                          className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground disabled:opacity-50"
                        />
                      </div>
                    </div>

                    {userCan("update:setting") && (
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
                          Salvar Configurações do Docker
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          {/* --- FIM DA NOVA ABA --- */}

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
                ) : !userCan("read:settings") ? (
                  <div className="text-center text-destructive py-10">
                    Você não tem permissão para ver as variáveis globais.
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
                              onChange={(e) => handleGlobalVarChange(env.id, 'key', e.target.value)}
                              disabled={isSubmitting || !env.isNew || !userCan("update:setting")}
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
                              disabled={isSubmitting || !userCan("update:setting")}
                              className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground disabled:opacity-50"
                            />
                          </div>
                          {userCan("update:setting") && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              onClick={() => handleDeleteGlobalVar(env.id)}
                              disabled={isSubmitting}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    {userCan("update:setting") && (
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
                    )}

                    <hr className="border-border" />

                    {userCan("update:setting") && (
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
                    )}
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