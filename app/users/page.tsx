"use client"

import { ProtectedLayout } from "@/components/layout/protected-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { TableCell, TableRow } from "@/components/ui/table"
import { apiClient } from "@/lib/api-client"
import type { Role, User } from "@/lib/types"
import { Edit2, Loader2, Plus, Shield, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useAuth } from "../auth-context"

// Tipos auxiliares
type RoleName = "ADMIN" | "OPERATOR" | "OPERATOR_N2" | "VIEWER"
interface UserFormData {
  name: string
  email: string
  phone: string
  password: string
  role: RoleName
}

// --- Descrições estáticas de roles ---
const roleDescriptions = {
  ADMIN: "Acesso completo ao sistema, gerenciamento de usuários e configurações.",
  OPERATOR: "Gerenciamento de containers, visualização de instâncias.",
  OPERATOR_N2: "Acesso avançado para debugging de instâncias.",
  VIEWER: "Acesso somente leitura, monitoramento de status e logs.",
}

// --- Helpers ---
const formatDate = (dateString: Date | string) => {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

const formatPhone = (value: string) => {
  if (!value) return ""
  let v = value.replace(/\D/g, "").slice(0, 11)
  if (v.length > 10) return v.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3")
  if (v.length > 6) return v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3")
  if (v.length > 2) return v.replace(/^(\d{2})(\d{0,5}).*/, "($1) $2")
  if (v.length > 0) return v.replace(/^(\d{0,2}).*/, "($1")
  return v
}

// --- Valor padrão do formulário ---
const defaultFormData: UserFormData = {
  name: "",
  email: "",
  phone: "",
  password: "",
  role: "VIEWER",
}

export default function UsersPage() {
  const { userCan, isAuthLoading } = useAuth()

  // --- Estados ---
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<UserFormData>(defaultFormData)
  const [searchTerm, setSearchTerm] = useState("")

  // --- Buscar dados da API ---
  const fetchUsersAndRoles = async () => {
    setIsLoading(true)
    try {
      // 6. Verificar permissões antes de buscar
      const canReadUsers = userCan("read:users:all")
      const canReadRoles = userCan("read:roles")

      const [usersResponse, rolesResponse] = await Promise.all([
        canReadUsers ? apiClient.getAllUsers() : Promise.resolve({ items: [] }),
        canReadRoles ? apiClient.getRoles() : Promise.resolve([]),
      ])

      setUsers(usersResponse.items || [])
      setRoles(rolesResponse || [])

    } catch (error) {
      console.error("Falha ao buscar dados:", error)
      toast.error("Falha ao buscar dados dos usuários ou funções.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }
    if (!isAuthLoading && isLoading) {
      fetchUsersAndRoles();
    }
  }, [isAuthLoading, userCan, isLoading])

  // --- Filtros e helpers ---
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getRoleBadgeClass = (roleName: string) => {
    switch (roleName.toUpperCase()) {
      case "ADMIN":
        return "bg-red-500/10 text-red-700"
      case "OPERATOR":
      case "OPERATOR_N2":
        return "bg-blue-500/10 text-blue-700"
      case "VIEWER":
      default:
        return "bg-gray-500/10 text-gray-700"
    }
  }

  // --- Handlers ---
  const handleAddUser = () => {
    setEditingUser(null)
    const defaultRole = roles.length > 0 ? (roles[0].name as RoleName) : "VIEWER"
    setFormData({ ...defaultFormData, role: defaultRole })
    setIsDialogOpen(true)
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      phone: formatPhone(user.phone),
      role: user.role.name as RoleName,
      password: "",
    })
    setIsDialogOpen(true)
  }

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Tem certeza que deseja deletar este usuário?")) {
      try {
        await apiClient.deleteUser(userId)
        setUsers((prev) => prev.filter((u) => u.id !== userId))
      } catch (error) {
        console.error("Falha ao deletar usuário:", error)
      }
    }
  }

  const handleSaveUser = async () => {
    setIsSubmitting(true)
    try {
      if (editingUser) {
        const updateData: Partial<UserFormData> = {
          ...formData,
          phone: formData.phone,
          password: formData.password || undefined,
        }
        await apiClient.updateUser(editingUser.id, updateData)
      } else {
        const createData = { ...formData, phone: formData.phone }
        await apiClient.createUser(createData)
      }
      setIsDialogOpen(false)
      await fetchUsersAndRoles()
    } catch (error) {
      console.error("Falha ao salvar usuário:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- Renderização ---
  return (
    <ProtectedLayout title="Usuários" description="Gerenciar usuários e suas funções no sistema">
      {/* Tabela de usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários do Sistema</CardTitle>
          <CardDescription>Total de {filteredUsers.length} usuários</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Nome</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Telefone</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Função</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Criado em</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                      <td className="py-3 px-4 text-sm text-foreground">{user.name}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{user.email}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{formatPhone(user.phone)}</td>
                      <td className="py-3 px-4 text-sm">
                        <Badge variant="outline" className={getRoleBadgeClass(user.role.name)}>
                          <Shield className="w-3 h-3 mr-1" />
                          {user.role.name}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{formatDate(user.createdAt)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {userCan("update:partial:user") && (
                            <Button size="sm" variant="outline" onClick={() => handleEditUser(user)} className="gap-1">
                              <Edit2 className="w-3 h-3" />
                            </Button>
                          )}
                          {/* 12. Permissão de Deletar */}
                          {userCan("delete:user") && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteUser(user.id)}
                              className="gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {userCan("create:users") && (
        <div className="flex justify-end mt-6 mb-6">
          <Button onClick={handleAddUser} className="gap-2">
            <Plus className="w-4 h-4" />
            Adicionar Usuário
          </Button>
        </div>
      )}

      {/* Funções disponíveis */}
      {userCan("read:roles") && (
        <Card>
          <CardHeader>
            <CardTitle>Funções Disponíveis</CardTitle>
            <CardDescription>Níveis de acesso e permissões do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {roles.map((role) => (
                <div key={role.id} className="p-4 rounded-lg border border-border">
                  <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    {role.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {roleDescriptions[role.name as RoleName] || "Descrição da função não disponível."}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {userCan("create:roles") && (
        <div className="flex justify-end mt-6 mb-6">
          <Button onClick={handleAddUser} className="gap-2">
            <Plus className="w-4 h-4" />
            Adicionar Função
          </Button>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Editar Usuário" : "Adicionar Novo Usuário"}</DialogTitle>
            <DialogDescription>
              {editingUser ? "Altere os dados do usuário" : "Crie um novo usuário no sistema"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome Completo</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground"
                placeholder="Ex: João Silva"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground"
                placeholder="Ex: joao@gpon.local"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Telefone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                maxLength={15}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground"
                placeholder="Ex: (11) 98888-7777"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Senha</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground"
                placeholder={editingUser ? "Deixe em branco para não alterar" : "••••••••"}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Função</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as RoleName })}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground"
                disabled={isSubmitting || roles.length === 0}
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.name}>{role.name}</option>
                ))}
              </select>
            </div>
            <Button onClick={handleSaveUser} className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                editingUser ? "Atualizar Usuário" : "Criar Usuário"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ProtectedLayout>
  )
}
