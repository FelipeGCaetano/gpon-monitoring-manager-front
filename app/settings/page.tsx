"use client"

import { ProtectedLayout } from "@/components/layout/protected-layout"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient } from "@/lib/api-client"
import { AlertTriangle, FileKey, Loader2, Plus, Save, Shield, Trash2, Upload } from "lucide-react"
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
  nginxBaseUrl: string
  // nginxNodeSecret/nginxPrivKeyContent removido daqui pois agora é via upload
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
  const { userCan, isAuthLoading } = useAuth() // Pegando o token do contexto se necessário para o upload manual
  const [settingsId, setSettingsId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingKey, setIsUploadingKey] = useState(false)
  const [isAlertOpen, setIsAlertOpen] = useState(false)

  // Estado para o arquivo de upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    systemName: "",
    adminEmail: "",
    updatedAt: "",
    dockerHost: "",
    dockerPort: 2375,
    nginxBaseUrl: "",
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
          dockerHost: settingsData.dockerHost || "",
          dockerPort: settingsData.dockerPort || 2375,
          nginxBaseUrl: settingsData.nginxBaseUrl || "",
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

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }
    if (!isAuthLoading && isLoading) {
      fetchSettings();
    }
  }, [isAuthLoading, userCan, isLoading])

  // --- Handlers ---
  const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setGeneralSettings((prev) => ({
      ...prev,
      [name]: name === 'dockerPort' ? Number(value) : value,
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
      { id: randomUUID(), key: "", value: "", isNew: true },
    ])
  }

  const handleDeleteGlobalVar = (id: string) => {
    setGlobalEnvs((prevEnvs) => prevEnvs.filter((env) => env.id !== id))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  // --- Lógica de Upload da Chave Privada ---
  const handleUploadPrivateKey = async () => {
    if (!selectedFile) {
      toast.error("Por favor, selecione um arquivo .pem primeiro.")
      return
    }

    setIsUploadingKey(true)
    try {
      // Usamos FormData para enviar arquivo multipart
      const formData = new FormData()
      formData.append("file", selectedFile)

      // Aqui fazemos a chamada direta fetch pois o apiClient padrão pode estar configurado para JSON
      // Ajuste a URL base conforme a sua configuração de ambiente
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

      const response = await fetch(`${baseUrl}/settings/nginx-private-key`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}` // Pega o token do storage
          // Não defina Content-Type aqui, o browser define automaticamente o boundary do multipart
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Erro no upload")
      }

      toast.success("Chave privada enviada e salva com sucesso!")
      setSelectedFile(null) // Limpa seleção

      // Opcional: resetar o input file via ref se necessário, mas null no state resolve a lógica
      const fileInput = document.getElementById("pem-file-input") as HTMLInputElement
      if (fileInput) fileInput.value = ""

    } catch (error: any) {
      console.error("Erro no upload:", error)
      toast.error(`Falha ao enviar chave: ${error.message}`)
    } finally {
      setIsUploadingKey(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!settingsId) {
      console.error("ID das Configurações não encontrado.")
      toast.error("Erro: ID das Configurações não encontrado.")
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        systemName: generalSettings.systemName,
        adminEmail: generalSettings.adminEmail,
        dockerHost: generalSettings.dockerHost,
        dockerPort: Number(generalSettings.dockerPort),
        nginxBaseUrl: generalSettings.nginxBaseUrl,
        // nginxNodeSecret/nginxPrivKeyContent removido do payload
        globalEnvs: globalEnvs
          .filter(env => env.key.trim() !== "")
          .map((env) => ({
            key: env.key,
            value: env.value,
          })),
      }

      await apiClient.updateSettings(settingsId, payload)
      toast.success("Configurações salvas com sucesso!")
      await fetchSettings()
    } catch (error) {
      console.error("Falha ao salvar configurações:", error)
      toast.error("Falha ao salvar configurações.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const SaveButton = ({ label, isLoading, isSubmitting, userCanUpdate, onClick }: { label: string, isLoading: boolean, isSubmitting: boolean, userCanUpdate: boolean, onClick: () => void }) => (
    userCanUpdate && (
      <div className="flex gap-4 pt-4">
        <Button
          className="gap-2"
          onClick={onClick}
          disabled={isSubmitting || isLoading}
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {label}
        </Button>
      </div>
    )
  );

  const LoadingOrPermissionDenied = ({ permissionKey, loadingMessage, deniedMessage }: { permissionKey: string, loadingMessage: string, deniedMessage: string }) => (
    isLoading ? (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    ) : !userCan(permissionKey) ? (
      <div className="text-center text-destructive py-10">
        {deniedMessage}
      </div>
    ) : null
  );

  return (
    <ProtectedLayout title="Configurações" description="Gerenciar configurações globais do sistema">
      <div className="max-w-6xl space-y-6">
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="docker">Docker</TabsTrigger>
            <TabsTrigger value="nginx">Nginx</TabsTrigger>
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
                <LoadingOrPermissionDenied
                  permissionKey="read:settings"
                  loadingMessage="Carregando detalhes do sistema..."
                  deniedMessage="Você não tem permissão para ver as configurações."
                />
                {!isLoading && userCan("read:settings") && (
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

                    <SaveButton
                      label="Salvar Alterações Gerais"
                      isLoading={isLoading}
                      isSubmitting={isSubmitting}
                      userCanUpdate={userCan("update:setting")}
                      onClick={handleSaveSettings}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Docker */}
          <TabsContent value="docker" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuração do Docker</CardTitle>
                <CardDescription>Endereço do Host e Porta do Daemon Docker</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <LoadingOrPermissionDenied
                  permissionKey="read:settings"
                  loadingMessage="Carregando configurações do Docker..."
                  deniedMessage="Você não tem permissão para ver as configurações do Docker."
                />
                {!isLoading && userCan("read:settings") && (
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

                    <SaveButton
                      label="Salvar Configurações do Docker"
                      isLoading={isLoading}
                      isSubmitting={isSubmitting}
                      userCanUpdate={userCan("update:setting")}
                      onClick={handleSaveSettings}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- ABA: Nginx (ATUALIZADA) --- */}
          <TabsContent value="nginx" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Configuração do Nginx (Autenticação Segura)
                </CardTitle>
                <CardDescription>Configuração da URL e Chave Privada (RSA) para comunicação segura.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <LoadingOrPermissionDenied
                  permissionKey="read:settings"
                  loadingMessage="Carregando configurações do Nginx..."
                  deniedMessage="Você não tem permissão para ver as configurações do Nginx."
                />

                {!isLoading && userCan("read:settings") && (
                  <>
                    {/* Bloco 1: URL Base */}
                    <div className="space-y-4 border-b pb-6 border-border">
                      <h3 className="text-base font-semibold">Conexão Básica</h3>
                      <div className="grid md:grid-cols-1 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">URL Base do Nginx UI</label>
                          <div className="flex gap-2">
                            <input
                              type="url"
                              name="nginxBaseUrl"
                              value={generalSettings.nginxBaseUrl}
                              onChange={handleGeneralChange}
                              placeholder="ex: http://nginx-host:8080"
                              disabled={isSubmitting || !userCan("update:setting")}
                              className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground disabled:opacity-50"
                            />
                            <SaveButton
                              label="Salvar URL"
                              isLoading={isLoading}
                              isSubmitting={isSubmitting}
                              userCanUpdate={userCan("update:setting")}
                              onClick={handleSaveSettings}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">Endereço onde a API do Nginx-UI está rodando.</p>
                        </div>
                      </div>
                    </div>

                    {/* Bloco 2: Upload de Chave */}
                    <div className="space-y-4">
                      <h3 className="text-base font-semibold flex items-center gap-2">
                        <FileKey className="w-4 h-4" /> Chave Privada de Autenticação (RSA)
                      </h3>
                      <div className="p-4 border border-dashed border-border rounded-lg bg-secondary/30">
                        <div className="flex flex-col md:flex-row gap-4 items-end">
                          <div className="flex-1 space-y-2 w-full">
                            <label className="text-sm font-medium">Arquivo da Chave Privada (.pem)</label>
                            {userCan("create:settings:nginx-private-key") &&
                              <input
                                id="pem-file-input"
                                type="file"
                                accept=".pem,.key"
                                onChange={handleFileSelect}
                                disabled={isUploadingKey || !userCan("update:setting")}
                                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer bg-background rounded-lg border border-input"
                              />}
                            <p className="text-xs text-muted-foreground">
                              {userCan("create:settings:nginx-private-key") ? "Faça upload do arquivo private.pem. Isso sobrescreverá a chave atual no servidor." : "Você não tem permissão para alterar a chave privada."}
                            </p>
                          </div>

                          {userCan("create:settings:nginx-private-key") && (
                            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                              <AlertDialogTrigger asChild>
                                <Button
                                  disabled={!selectedFile || isUploadingKey}
                                  variant="secondary"
                                  className="min-w-[140px]"
                                >
                                  {isUploadingKey ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                  ) : (
                                    <Upload className="w-4 h-4 mr-2" />
                                  )}
                                  Enviar Chave
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="border-destructive/50 bg-destructive/5">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                                    <AlertTriangle className="w-6 h-6" />
                                    ATENÇÃO: PERIGO DE SOBRESCRITA
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-base text-foreground/90">
                                    Você está prestes a <strong>sobrescrever a Chave Privada</strong> atual (nginx_private.pem).
                                    <br /><br />
                                    Se esta nova chave não formar um par com a Chave Pública configurada no servidor Nginx-UI, <strong>toda a comunicação automática com o Nginx falhará.</strong>
                                    <br /><br />
                                    Deseja realmente continuar?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={handleUploadPrivateKey}
                                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                  >
                                    Sim, Sobrescrever Chave
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          {/* --- FIM DA ABA NGINX --- */}

          {/* Aba: Variáveis Globais */}
          <TabsContent value="variables" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Variáveis Globais de Configuração</CardTitle>
                <CardDescription>Gerenciar variáveis de ambiente do sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <LoadingOrPermissionDenied
                  permissionKey="read:settings"
                  loadingMessage="Carregando variáveis globais..."
                  deniedMessage="Você não tem permissão para ver as variáveis globais."
                />
                {!isLoading && userCan("read:settings") && (
                  <>
                    <div className="space-y-3">
                      {globalEnvs.map((env) => (
                        <div key={env.id} className="flex items-end gap-2 p-4 rounded-lg bg-secondary">
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