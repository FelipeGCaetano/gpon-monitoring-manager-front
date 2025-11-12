"use client"

import { useState } from "react"
import Link from "next/link"
import {
  LayoutDashboard,
  Container,
  Layers,
  Users,
  Settings,
  Activity,
  Menu,
  X,
  Plus,
  Edit2,
  Trash2,
  Search,
  Shield,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const navigationItems = [
  { icon: LayoutDashboard, label: "Painel", href: "/" },
  { icon: Container, label: "Containers", href: "/containers" },
  { icon: Layers, label: "Módulos", href: "/modules" },
  { icon: Users, label: "Clientes", href: "/clients" },
  { icon: Users, label: "Usuários", href: "/users", active: true },
  { icon: Settings, label: "Configuração", href: "/settings" },
]

// Dados de exemplo
const usersData = [
  {
    id: 1,
    name: "João Silva",
    email: "joao@gpon.local",
    role: "Admin",
    status: "Ativo",
    createdAt: "2024-01-15",
  },
  {
    id: 2,
    name: "Maria Santos",
    email: "maria@gpon.local",
    role: "Operador",
    status: "Ativo",
    createdAt: "2024-02-20",
  },
  {
    id: 3,
    name: "Carlos Costa",
    email: "carlos@gpon.local",
    role: "Visualizador",
    status: "Ativo",
    createdAt: "2024-03-10",
  },
  {
    id: 4,
    name: "Ana Paula",
    email: "ana@gpon.local",
    role: "Operador",
    status: "Inativo",
    createdAt: "2024-04-05",
  },
]

const roleDescriptions = {
  Admin: "Acesso completo ao sistema, gerenciamento de usuários e configurações",
  Operador: "Gerenciamento de containers, visualização de instâncias e configuração limitada",
  Visualizador: "Acesso somente leitura, monitoramento de status e visualização de registros",
}

export default function UsersPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [users, setUsers] = useState(usersData)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "Operador",
    status: "Ativo",
  })

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddUser = () => {
    setEditingUser(null)
    setFormData({ name: "", email: "", role: "Operador", status: "Ativo" })
    setIsDialogOpen(true)
  }

  const handleEditUser = (user) => {
    setEditingUser(user)
    setFormData(user)
    setIsDialogOpen(true)
  }

  const handleSaveUser = () => {
    if (editingUser) {
      setUsers(users.map((u) => (u.id === editingUser.id ? { ...u, ...formData } : u)))
    } else {
      setUsers([...users, { id: users.length + 1, ...formData, createdAt: new Date().toISOString().split("T")[0] }])
    }
    setIsDialogOpen(false)
  }

  const handleDeleteUser = (userId) => {
    setUsers(users.filter((u) => u.id !== userId))
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`bg-sidebar border-r border-sidebar-border transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-20"
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
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                item.active
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
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Função</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground"
                    >
                      <option>Admin</option>
                      <option>Operador</option>
                      <option>Visualizador</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground"
                    >
                      <option>Ativo</option>
                      <option>Inativo</option>
                    </select>
                  </div>
                  <Button onClick={handleSaveUser} className="w-full">
                    {editingUser ? "Atualizar Usuário" : "Criar Usuário"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Search Bar */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-secondary border border-border text-foreground"
                />
              </div>
            </CardContent>
          </Card>

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
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Função</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Criado em</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                        <td className="py-3 px-4 text-sm text-foreground">{user.name}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{user.email}</td>
                        <td className="py-3 px-4 text-sm">
                          <Badge
                            variant="outline"
                            className={
                              user.role === "Admin"
                                ? "bg-red-500/10 text-red-700"
                                : user.role === "Operador"
                                  ? "bg-blue-500/10 text-blue-700"
                                  : "bg-gray-500/10 text-gray-700"
                            }
                          >
                            <Shield className="w-3 h-3 mr-1" />
                            {user.role}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <Badge variant={user.status === "Ativo" ? "default" : "secondary"}>{user.status}</Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{user.createdAt}</td>
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
                    ))}
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
                {Object.entries(roleDescriptions).map(([role, description]) => (
                  <div key={role} className="p-4 rounded-lg border border-border">
                    <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      {role}
                    </h3>
                    <p className="text-sm text-muted-foreground">{description}</p>
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
