"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { TableCell, TableRow } from "@/components/ui/table"
import { apiClient } from "@/lib/api-client"; // Importa o API Client
import type { Role, User } from "@/lib/types"; // Importa os tipos reais
import {
  Activity,
  Component,
  Container,
  Edit2,
  Layers,
  LayoutDashboard,
  Loader2,
  Menu,
  Plus,
  Settings,
  Shield,
  Trash2,
  Users,
  X
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

// Tipos para o formulário, baseados no schema do back-end
type RoleName = "ADMIN" | "SUPPORT_N2" | "SUPPORT_N3" | "TECHNICIAN"
interface UserFormData {
  name: string
  email: string
  phone: string
  password: string
  role: RoleName
}

const navigationItems = [
  { icon: LayoutDashboard, label: "Painel", href: "/" },
  { icon: Container, label: "Containers", href: "/containers" },
  { icon: Layers, label: "Módulos", href: "/modules" },
  { icon: Component, label: "Instâncias", href: "/instances" }, // 2. Adicionar novo item
  { icon: Users, label: "Clientes", href: "/clients", active: true },
  { icon: Users, label: "Usuários", href: "/users" },
  { icon: Settings, label: "Configuração", href: "/settings" },
]

// Este objeto estático é usado apenas para descrições.
// As funções em si são carregadas da API.
const roleDescriptions = {
  ADMIN: "Acesso completo ao sistema, gerenciamento de usuários e configurações.",
  SUPPORT_N2: "Gerenciamento de containers, visualização de instâncias.",
  SUPPORT_N3: "Acesso avançado para debugging de instâncias.",
  TECHNICIAN: "Acesso somente leitura, monitoramento de status e logs.",
}

// Helper para formatar data (movido para fora do componente para melhor organização)
const formatDate = (dateString: Date | string) => {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

// --- NOVA FUNÇÃO DE MÁSCARA ---
const formatPhone = (value: string) => {
  if (!value) return ""

  // Remove tudo que não é dígito
  let v = value.replace(/\D/g, "")

  // Limita a 11 dígitos
  v = v.slice(0, 11)

  // Aplica a máscara (00) 0000-0000
  if (v.length > 10) {
    // Celular (00) 00000-0000
    v = v.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3")
  } else if (v.length > 6) {
    // Fixo (00) 0000-0000
    v = v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3")
  } else if (v.length > 2) {
    // (00) 0000
    v = v.replace(/^(\d{2})(\d{0,5}).*/, "($1) $2")
  } else if (v.length > 0) {
    // (00
    v = v.replace(/^(\d{0,2}).*/, "($1")
  }

  return v
}
// --- FIM DA NOVA FUNÇÃO ---

// Valores padrão para o formulário de novo usuário
const defaultFormData: UserFormData = {
  name: "",
  email: "",
  phone: "",
  password: "",
  role: "TECHNICIAN", // Padrão para a role menos privilegiada
}

export default function UsersPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  // --- Estados para dados da API ---
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  // ---------------------------------

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<UserFormData>(defaultFormData)

  // Função para carregar dados da API
  const fetchUsersAndRoles = async () => {
    setIsLoading(true)
    try {
      const [usersResponse, rolesResponse] = await Promise.all([
        apiClient.getAllUsers(),
        apiClient.getRoles(),
      ])

      // A rota /users/all retorna um objeto de paginação
      setUsers(usersResponse.items || [])

      // A rota /roles retorna um array
      setRoles(rolesResponse || [])

    } catch (error) {
      console.error("Falha ao buscar dados:", error)
      // TODO: Adicionar um Toast de erro para o usuário
    } finally {
      setIsLoading(false)
    }
  }

  // Carrega os dados no mount do componente
  useEffect(() => {
    fetchUsersAndRoles()
  }, [])

  // Filtra os usuários com base nos dados reais
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddUser = () => {
    setEditingUser(null)
    // --- CORREÇÃO AQUI ---
    // Pega a primeira role da lista de roles carregadas, ou mantém 'TECHNICIAN' se a lista estiver vazia.
    const defaultRole = roles.length > 0 ? (roles[0].name as RoleName) : "TECHNICIAN"

    setFormData({
      name: "",
      email: "",
      phone: "",
      password: "",
      role: defaultRole, // Define a role padrão dinamicamente
    })
    // --- FIM DA CORREÇÃO ---
    setIsDialogOpen(true)
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      phone: formatPhone(user.phone), // Aplica a máscara ao carregar
      role: user.role.name as RoleName, // O back-end envia o objeto role
      password: "", // Deixa a senha em branco para edição
    })
    setIsDialogOpen(true)
  }

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Tem certeza que deseja deletar este usuário?")) {
      try {
        await apiClient.deleteUser(userId)
        setUsers(users.filter((u) => u.id !== userId))
        // TODO: Adicionar toast de sucesso
      } catch (error) {
        console.error("Falha ao deletar usuário:", error)
        // TODO: Adicionar toast de erro
      }
    }
  }

  const handleSaveUser = async () => {
    setIsSubmitting(true)
    try {
      if (editingUser) {
        // --- Lógica de ATUALIZAÇÃO ---
        // Envia apenas campos que foram alterados.
        // Se a senha estiver vazia, não a enviamos.
        const updateData: Partial<UserFormData> & { phone: string } = {
          ...formData,
          phone: formData.phone, // Remove a máscara antes de enviar
          password: formData.password ? formData.password : undefined,
        }
        await apiClient.updateUser(editingUser.id, updateData)
      } else {
        // --- Lógica de CRIAÇÃO ---
        const createData = {
          ...formData,
          phone: formData.phone, // Remove a máscara antes de enviar
        }
        await apiClient.createUser(createData)
      }

      setIsDialogOpen(false)
      await fetchUsersAndRoles() // Recarrega a lista
      // TODO: Adicionar toast de sucesso
    } catch (error) {
      console.error("Falha ao salvar usuário:", error)
      // TODO: Adicionar toast de erro
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper para formatar data (removido daqui e movido para cima)

  // Mapeia o nome da role para a cor do badge
  const getRoleBadgeClass = (roleName: string) => {
    switch (roleName.toUpperCase()) {
      case "ADMIN":
        return "bg-red-500/10 text-red-700"
      case "SUPPORT_N2":
      case "SUPPORT_N3":
        return "bg-blue-500/10 text-blue-700"
      case "TECHNICIAN":
        return "bg-gray-500/10 text-gray-700"
      default:
        return "bg-gray-500/10 text-gray-700"
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`bg-sidebar border-r border-sidebar-border transition-all duration-300 ${sidebarOpen ? "w-64" : "w-20"
          } flex flex-col`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-primary-foreground" />
            </div>
            {sidebarOpen && <span className="text-sidebar-foreground font-bold text-lg">GPON</span>}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-2">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${item.active
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="mx-3 mb-6 p-2 hover:bg-sidebar-accent rounded-lg text-sidebar-foreground"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-6 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Gerenciamento de Usuários</h1>
              <p className="text-muted-foreground">Gerenciar usuários e suas funções no sistema</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddUser} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Adicionar Usuário
                </Button>
              </DialogTrigger>
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
                      // --- ATUALIZADO ONCHANGE E ADICIONADO MAXLENGTH ---
                      onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                      maxLength={15} // (00) 00000-0000
                      // -------------------------------------------------
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
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Users Table */}
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
                            <Badge
                              variant="outline"
                              className={getRoleBadgeClass(user.role.name)}
                            >
                              <Shield className="w-3 h-3 mr-1" />
                              {user.role.name}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleEditUser(user)} className="gap-1">
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteUser(user.id)}
                                className="gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
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

          {/* Role Information */}
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
        </div>
      </main>
    </div>
  )
}