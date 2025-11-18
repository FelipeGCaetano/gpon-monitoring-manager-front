"use client"

import { useAuth } from "@/app/auth-context"; // 1. Importar o contexto de Auth
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient } from "@/lib/api-client"
import { User } from "@/lib/types"
import { Loader2, Lock, User as UserIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface UserProfileModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

// Helper para formatar telefone
const formatPhone = (value: string) => {
    if (!value) return ""
    let v = value.replace(/\D/g, "").slice(0, 11)
    if (v.length > 10) return v.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3")
    if (v.length > 6) return v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3")
    if (v.length > 2) return v.replace(/^(\d{2})(\d{0,5}).*/, "($1) $2")
    if (v.length > 0) return v.replace(/^(\d{0,2}).*/, "($1")
    return v
}

export function UserProfileModal({ open, onOpenChange }: UserProfileModalProps) {
    const { logout } = useAuth() // 2. Pegar a função de logout
    const [userData, setUserData] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    // Estado para o formulário de informações
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: ""
    })

    // Estados para senha
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    // Busca os dados do próprio usuário ao abrir o modal
    useEffect(() => {
        if (open) {
            const fetchSelf = async () => {
                setIsLoading(true)
                try {
                    const data = await apiClient.getSelf()
                    setUserData(data)
                    setFormData({
                        name: data.name,
                        email: data.email,
                        phone: formatPhone(data.phone || "")
                    })
                } catch (error) {
                    console.error("Erro ao buscar perfil:", error)
                    toast.error("Não foi possível carregar seu perfil.")
                    onOpenChange(false)
                } finally {
                    setIsLoading(false)
                }
            }
            fetchSelf()
        } else {
            setNewPassword("")
            setConfirmPassword("")
        }
    }, [open, onOpenChange])

    // Atualizar Informações Básicas
    const handleUpdateInfo = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!userData) return

        // 3. Verifica se o email foi alterado ANTES de salvar
        const isEmailChanged = formData.email !== userData.email

        setIsSaving(true)
        try {
            await apiClient.updateUser(userData.id, {
                name: formData.name,
                email: formData.email,
                phone: formData.phone
            })

            // Atualiza estado local
            setUserData(prev => prev ? ({ ...prev, ...formData }) : null)

            // 4. Lógica de Logout se email mudou
            if (isEmailChanged) {
                toast.success("E-mail atualizado. Você será desconectado para segurança.")
                onOpenChange(false)
                // Pequeno delay para o usuário ler o toast antes do logout
                setTimeout(() => {
                    logout()
                }, 1500)
            } else {
                toast.success("Perfil atualizado com sucesso!")
            }

        } catch (error) {
            console.error("Erro ao atualizar perfil:", error)
            toast.error("Falha ao atualizar perfil.")
        } finally {
            setIsSaving(false)
        }
    }

    // Atualizar Senha
    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newPassword || !userData) return

        if (newPassword !== confirmPassword) {
            toast.error("As senhas não coincidem.")
            return
        }

        if (newPassword.length < 6) {
            toast.error("A senha deve ter pelo menos 6 caracteres.")
            return
        }

        setIsSaving(true)
        try {
            await apiClient.updateUser(userData.id, {
                password: newPassword
            })

            // 5. Sempre desloga ao trocar senha
            toast.success("Senha atualizada. Você será desconectado.")
            setNewPassword("")
            setConfirmPassword("")
            onOpenChange(false)

            setTimeout(() => {
                logout()
            }, 1500)

        } catch (error) {
            console.error("Erro ao atualizar senha:", error)
            toast.error("Falha ao atualizar a senha.")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Meu Perfil</DialogTitle>
                    <DialogDescription>
                        Gerencie suas informações pessoais e segurança.
                    </DialogDescription>
                </DialogHeader>

                {isLoading || !userData ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <Tabs defaultValue="info" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="info">Informações</TabsTrigger>
                            <TabsTrigger value="security">Segurança</TabsTrigger>
                        </TabsList>

                        {/* Aba de Informações (Editável) */}
                        <TabsContent value="info" className="space-y-4 py-4">
                            <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg mb-4">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <UserIcon className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium">{formData.name || userData.name}</p>
                                    <p className="text-sm text-muted-foreground">{userData.role?.name || "Usuário"}</p>
                                </div>
                            </div>

                            <form onSubmit={handleUpdateInfo} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome Completo</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        disabled={isSaving}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                        disabled={isSaving}
                                    />
                                    {/* Aviso visual se o email mudar */}
                                    {userData && formData.email !== userData.email && (
                                        <p className="text-xs text-amber-600 dark:text-amber-500 font-medium">
                                            Atenção: Alterar o e-mail irá desconectar sua sessão.
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Telefone</Label>
                                    <Input
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                                        placeholder="(00) 00000-0000"
                                        maxLength={15}
                                        disabled={isSaving}
                                    />
                                </div>

                                <div className="pt-2">
                                    <Button type="submit" className="w-full" disabled={isSaving}>
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                        Salvar Alterações
                                    </Button>
                                </div>
                            </form>
                        </TabsContent>

                        {/* Aba de Segurança (Alterar Senha) */}
                        <TabsContent value="security" className="space-y-4 py-4">
                            <form onSubmit={handleUpdatePassword} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="new-pass">Nova Senha</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="new-pass"
                                            type="password"
                                            className="pl-9"
                                            placeholder="••••••••"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            disabled={isSaving}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirm-pass">Confirmar Nova Senha</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="confirm-pass"
                                            type="password"
                                            className="pl-9"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            disabled={isSaving}
                                        />
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <Button type="submit" className="w-full" disabled={isSaving || !newPassword}>
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                        Atualizar Senha
                                    </Button>
                                    <p className="text-xs text-muted-foreground text-center mt-2">
                                        Sua sessão será encerrada após a alteração da senha.
                                    </p>
                                </div>
                            </form>
                        </TabsContent>
                    </Tabs>
                )}
            </DialogContent>
        </Dialog>
    )
}