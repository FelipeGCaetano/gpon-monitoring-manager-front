"use client"

import { ProtectedLayout } from "@/components/layout/protected-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient } from "@/lib/api-client"
import type { Role, User } from "@/lib/types"
import {
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit2,
  Eye,
  Loader2,
  Plus,
  Save,
  Search,
  Shield,
  Trash2,
  X
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { useAuth } from "../auth-context"

// Tipos auxiliares
type RoleName = "ADMIN" | "OPERATOR" | "OPERATOR_N2" | "VIEWER"

// Interface para os detalhes completos da role (vinda do getRoleById)
interface RoleDetails {
  id: string
  name: string
  permissions: Record<string, string[]>
}

// Tipo para todas as permissões do sistema
type SystemPermissions = Record<string, string[]>

// Tipo auxiliar para ordenação
type SortConfig = {
  key: string
  direction: "asc" | "desc"
} | null

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

  // --- Estados de Dados ---
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<UserFormData>(defaultFormData)

  // --- Estados de Detalhes/Edição da Role ---
  const [isRoleDetailsOpen, setIsRoleDetailsOpen] = useState(false)
  const [roleDetailsLoading, setRoleDetailsLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<RoleDetails | null>(null)

  // Estados específicos para edição/criação da Role
  const [isEditingRole, setIsEditingRole] = useState(false)
  const [isCreatingRole, setIsCreatingRole] = useState(false)
  const [allSystemPermissions, setAllSystemPermissions] = useState<SystemPermissions | null>(null)
  const [editedRoleName, setEditedRoleName] = useState("")
  const [selectedPermissionsSet, setSelectedPermissionsSet] = useState<Set<string>>(new Set())
  const [isSavingRole, setIsSavingRole] = useState(false)

  // --- Estados para Exclusão de Role ---
  const [isDeleteRoleModalOpen, setIsDeleteRoleModalOpen] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState<{ id: string, name: string } | null>(null)
  const [isDeletingRole, setIsDeletingRole] = useState(false)

  // --- Estados de Paginação ---
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // --- Estados Locais (Busca e Ordenação) ---
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState<SortConfig>(null)

  // --- Buscar dados da API ---
  const fetchUsersAndRoles = useCallback(async () => {
    setIsLoading(true)
    try {
      const canReadUsers = userCan("read:users:all")
      const canReadRoles = userCan("read:roles")

      const [usersResponse, rolesResponse] = await Promise.all([
        canReadUsers ? apiClient.getAllUsers({ page, limit }) : Promise.resolve({ items: [], totalPages: 1, totalItems: 0 }),
        canReadRoles ? apiClient.getRoles() : Promise.resolve([]),
      ])

      // Verifica se a resposta é paginada ou array simples (fallback)
      const userData: any = usersResponse
      if (userData && userData.items) {
        setUsers(userData.items)
        setTotalPages(userData.totalPages)
        setTotalItems(userData.totalItems)
      } else if (Array.isArray(userData)) {
        setUsers(userData)
        setTotalPages(1)
        setTotalItems(userData.length)
      } else {
        setUsers([])
      }

      setRoles(rolesResponse || [])

    } catch (error) {
      console.error("Falha ao buscar dados:", error)
      toast.error("Falha ao buscar dados dos usuários ou funções.")
    } finally {
      setIsLoading(false)
    }
  }, [userCan, page, limit])

  useEffect(() => {
    if (isAuthLoading) return
    fetchUsersAndRoles()
  }, [isAuthLoading, fetchUsersAndRoles])

  // --- Lógica de Ordenação e Filtro ---
  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return { key, direction: current.direction === "asc" ? "desc" : "asc" }
      }
      return { key, direction: "asc" }
    })
  }

  const filteredAndSortedUsers = useMemo(() => {
    let result = users.filter((user) => {
      if (!searchTerm) return true
      const term = searchTerm.toLowerCase()
      return (
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.role.name.toLowerCase().includes(term)
      )
    })

    if (sortConfig !== null) {
      result.sort((a, b) => {
        let aValue: any
        let bValue: any

        if (sortConfig.key === "role") {
          aValue = a.role.name
          bValue = b.role.name
        } else {
          aValue = a[sortConfig.key as keyof User]
          bValue = b[sortConfig.key as keyof User]
        }

        if (typeof aValue === 'string') aValue = aValue.toLowerCase()
        if (typeof bValue === 'string') bValue = bValue.toLowerCase()

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
        return 0
      })
    }
    return result
  }, [users, sortConfig, searchTerm])

  const getRoleBadgeClass = (roleName: string) => {
    switch (roleName.toUpperCase()) {
      case "ADMIN": return "bg-red-500/10 text-red-700"
      case "OPERATOR":
      case "OPERATOR_N2": return "bg-blue-500/10 text-blue-700"
      case "VIEWER": default: return "bg-gray-500/10 text-gray-700"
    }
  }

  // --- Handlers (CRUD Usuários) ---
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
        fetchUsersAndRoles()
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
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
        }
        if (formData.password && formData.password.trim() !== "") {
          updateData.password = formData.password;
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

  // --- Handlers (Roles) ---

  const handleViewRole = async (roleId: string) => {
    setIsRoleDetailsOpen(true)
    setRoleDetailsLoading(true)
    setIsEditingRole(false)
    setIsCreatingRole(false)
    setSelectedRole(null)

    try {
      const roleData: RoleDetails = await apiClient.getRoleById(roleId)
      setSelectedRole(roleData)
      setEditedRoleName(roleData.name)

      const currentPermissions = new Set<string>()
      Object.values(roleData.permissions).forEach((group) => {
        group.forEach((perm) => currentPermissions.add(perm))
      })
      setSelectedPermissionsSet(currentPermissions)

      if (!allSystemPermissions) {
        const permissionsData: SystemPermissions = await apiClient.getPermissions()
        setAllSystemPermissions(permissionsData)
      }

    } catch (error) {
      console.error("Erro ao buscar detalhes da role:", error)
      toast.error("Não foi possível carregar os detalhes da função.")
      setIsRoleDetailsOpen(false)
    } finally {
      setRoleDetailsLoading(false)
    }
  }

  const handleOpenCreateRole = async () => {
    setIsRoleDetailsOpen(true)
    setIsCreatingRole(true)
    setIsEditingRole(false)
    setSelectedRole(null)
    setEditedRoleName("")
    setSelectedPermissionsSet(new Set())

    setRoleDetailsLoading(true)
    try {
      if (!allSystemPermissions) {
        const permissionsData: SystemPermissions = await apiClient.getPermissions()
        setAllSystemPermissions(permissionsData)
      }
    } catch (error) {
      console.error("Erro ao buscar permissões:", error)
      toast.error("Erro ao carregar permissões do sistema.")
      setIsRoleDetailsOpen(false)
    } finally {
      setRoleDetailsLoading(false)
    }
  }

  // 1. Abre o modal de confirmação
  const handleOpenDeleteRoleModal = (roleId: string, roleName: string, e: React.MouseEvent) => {
    e.stopPropagation() // Impede abrir o modal de detalhes
    setRoleToDelete({ id: roleId, name: roleName })
    setIsDeleteRoleModalOpen(true)
  }

  // 2. Executa a exclusão
  const handleConfirmDeleteRole = async () => {
    if (!roleToDelete) return

    setIsDeletingRole(true)
    try {
      await apiClient.deleteRole(roleToDelete.id)
      toast.success("Função removida com sucesso!")
      fetchUsersAndRoles() // Recarrega a lista
      setIsDeleteRoleModalOpen(false)
      setRoleToDelete(null)
    } catch (error) {
      console.error("Falha ao deletar função:", error)
      toast.error("Erro ao deletar função. Verifique se ela não está em uso.")
    } finally {
      setIsDeletingRole(false)
    }
  }

  const togglePermission = (permission: string) => {
    const newSet = new Set(selectedPermissionsSet)
    if (newSet.has(permission)) {
      newSet.delete(permission)
    } else {
      newSet.add(permission)
    }
    setSelectedPermissionsSet(newSet)
  }

  const handleSaveRole = async () => {
    if (!editedRoleName.trim()) {
      toast.warning("O nome da função é obrigatório.")
      return
    }

    setIsSavingRole(true)
    try {
      const payload = {
        name: editedRoleName,
        permissions: Array.from(selectedPermissionsSet)
      }

      if (isCreatingRole) {
        await apiClient.createRole(payload)
        toast.success("Nova função criada com sucesso!")
      } else {
        if (!selectedRole) return
        await apiClient.updateRole(selectedRole.id, payload)
        toast.success("Função atualizada com sucesso!")
      }

      setIsRoleDetailsOpen(false)
      setIsEditingRole(false)
      setIsCreatingRole(false)

      fetchUsersAndRoles()

    } catch (error) {
      console.error("Erro ao salvar função:", error)
      toast.error("Falha ao salvar a função.")
    } finally {
      setIsSavingRole(false)
    }
  }

  // --- Componentes de Renderização Auxiliares ---

  const SortableHead = ({ label, sortKey }: { label: string, sortKey: string }) => (
    <TableHead>
      <Button
        variant="ghost"
        onClick={() => handleSort(sortKey)}
        className="hover:bg-transparent px-0 font-medium text-muted-foreground flex items-center gap-1 h-auto"
      >
        {label}
        <ArrowUpDown className="h-3 w-3" />
      </Button>
    </TableHead>
  )

  const LoadingRow = () => (
    <TableRow>
      <TableCell colSpan={6} className="text-center py-10">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
      </TableCell>
    </TableRow>
  )

  // Renderiza a lista de permissões
  const renderPermissionsContent = () => {
    const isEditingOrCreate = isEditingRole || isCreatingRole

    if (isEditingOrCreate && allSystemPermissions) {
      return (
        <div className="grid gap-6 py-2">
          <div className="space-y-2 mb-4">
            <Label htmlFor="role-name">Nome da Função</Label>
            <Input
              id="role-name"
              value={editedRoleName}
              onChange={(e) => setEditedRoleName(e.target.value)}
              placeholder="Ex: SUPORTE_N1"
            />
          </div>

          <div className="border-t pt-4">
            <Label className="mb-4 block text-base">Permissões do Sistema</Label>
            {Object.entries(allSystemPermissions).map(([category, perms]) => (
              <div key={category} className="space-y-3 mb-6">
                <div className="flex items-center gap-2 border-b pb-1">
                  <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                    {category}
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {perms.map((permission) => {
                    const isChecked = selectedPermissionsSet.has(permission)
                    return (
                      <label
                        key={permission}
                        className={`flex items-center gap-3 p-2 rounded-md border transition-all cursor-pointer ${isChecked
                          ? "bg-primary/10 border-primary"
                          : "bg-background border-border hover:border-primary/50"
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePermission(permission)}
                          className="w-4 h-4 accent-primary rounded-sm cursor-pointer"
                        />
                        <span className={`font-mono text-xs ${isChecked ? "text-primary font-medium" : "text-muted-foreground"}`}>
                          {permission}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (selectedRole && Object.entries(selectedRole.permissions).length > 0) {
      return (
        <div className="grid gap-6 py-2">
          {Object.entries(selectedRole.permissions).map(([category, perms]) => (
            <div key={category} className="space-y-3">
              <div className="flex items-center gap-2 border-b pb-1">
                <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                  {category}
                </h4>
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 rounded-full">
                  {perms.length}
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {perms.map((permission) => (
                  <div
                    key={permission}
                    className="flex items-center gap-2 text-sm p-2 rounded-md bg-secondary/30 border border-transparent"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="font-mono text-xs">{permission}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )
    }

    return (
      <div className="text-center py-8 text-muted-foreground">
        Esta função não possui permissões explícitas listadas.
      </div>
    )
  }

  const getModalTitle = () => {
    if (isCreatingRole) return "Criar Nova Função"
    if (isEditingRole) return "Editar Função e Permissões"
    return `Detalhes da Função: ${selectedRole?.name}`
  }

  const getModalDescription = () => {
    if (isCreatingRole || isEditingRole) return "Configure o nome e as permissões de acesso para esta função."
    return "Lista completa de permissões atribuídas a esta função."
  }

  return (
    <ProtectedLayout title="Usuários & Acessos" description="Gerencie usuários, funções e níveis de acesso">
      <div className="space-y-6">
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="roles">Funções e Permissões</TabsTrigger>
          </TabsList>

          {/* --- ABA DE USUÁRIOS --- */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Usuários do Sistema</CardTitle>
                    <CardDescription>Gerencie quem tem acesso à plataforma ({totalItems} total)</CardDescription>
                  </div>
                  {userCan("create:users") && (
                    <Button onClick={handleAddUser} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Adicionar Usuário
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* Filtros */}
                <div className="flex flex-col md:flex-row gap-4 mb-4 justify-between items-end md:items-center">
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Filtrar nesta página..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Itens por pág:</span>
                    <Select
                      value={String(limit)}
                      onValueChange={(val) => {
                        setLimit(Number(val))
                        setPage(1)
                      }}
                    >
                      <SelectTrigger className="w-[70px]">
                        <SelectValue placeholder="10" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <SortableHead label="Nome" sortKey="name" />
                        <SortableHead label="Email" sortKey="email" />
                        <SortableHead label="Telefone" sortKey="phone" />
                        <SortableHead label="Função" sortKey="role" />
                        <SortableHead label="Criado em" sortKey="createdAt" />
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <LoadingRow />
                      ) : filteredAndSortedUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                            {searchTerm ? "Nenhum usuário encontrado para a busca." : "Nenhum usuário cadastrado."}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAndSortedUsers.map((user) => (
                          <TableRow key={user.id} className="hover:bg-secondary/50">
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell className="text-muted-foreground">{user.email}</TableCell>
                            <TableCell className="text-muted-foreground">{formatPhone(user.phone)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getRoleBadgeClass(user.role.name)}>
                                <Shield className="w-3 h-3 mr-1" />
                                {user.role.name}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                {userCan("update:partial:user") && (
                                  <Button size="sm" variant="ghost" onClick={() => handleEditUser(user)}>
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                )}
                                {userCan("delete:user") && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Paginação */}
                <div className="flex items-center justify-between space-x-2 py-4 border-t mt-4">
                  <div className="text-sm text-muted-foreground">
                    Total: {totalItems}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(1)}
                      disabled={page === 1 || isLoading}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1 || isLoading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">
                      {page} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages || isLoading}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(totalPages)}
                      disabled={page === totalPages || isLoading}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- ABA DE FUNÇÕES --- */}
          <TabsContent value="roles" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Funções Disponíveis</CardTitle>
                    <CardDescription>Definições de níveis de acesso e permissões. Clique em um card para ver detalhes.</CardDescription>
                  </div>
                  {userCan("create:roles") && (
                    <Button onClick={handleOpenCreateRole} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Adicionar Função
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="grid md:grid-cols-3 gap-4">
                    {roles.map((role) => (
                      <div
                        key={role.id}
                        className="group relative p-4 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md hover:border-primary/50 transition-all cursor-pointer"
                        onClick={() => handleViewRole(role.id)}
                      >
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye className="w-4 h-4 text-primary" />
                          {userCan("delete:role") && (
                            <button
                              onClick={(e) => handleOpenDeleteRoleModal(role.id, role.name, e)}
                              className="text-destructive hover:text-destructive/80 transition-colors"
                              title="Deletar função"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <h3 className="font-medium mb-2 flex items-center gap-2 group-hover:text-primary transition-colors">
                          <Shield className="w-4 h-4" />
                          {role.name}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {roleDescriptions[role.name as RoleName] || "Descrição da função não disponível."}
                        </p>
                      </div>
                    ))}
                    {roles.length === 0 && (
                      <div className="col-span-3 text-center py-8 text-muted-foreground">
                        Nenhuma função encontrada.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* --- Modal Único para Criar/Editar Usuário (Mantido) --- */}
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
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: João Silva"
                disabled={isSubmitting}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Ex: joao@gpon.local"
                disabled={isSubmitting}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Telefone</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                maxLength={15}
                placeholder="Ex: (11) 98888-7777"
                disabled={isSubmitting}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Função</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as RoleName })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                disabled={isSubmitting || roles.length === 0}
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.name}>{role.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">
                {editingUser ? "Nova Senha (deixe em branco para manter)" : "Senha"}
              </label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="******"
                disabled={isSubmitting}
                className="mt-1"
              />
            </div>
            <Button onClick={handleSaveUser} className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {editingUser ? "Atualizar Usuário" : "Criar Usuário"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- Modal de Detalhes/Edição/Criação da Role --- */}
      <Dialog
        open={isRoleDetailsOpen}
        onOpenChange={(open) => {
          if (!isSavingRole) setIsRoleDetailsOpen(open)
        }}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0">
          <div className="p-6 pb-2 border-b">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Shield className="w-6 h-6 text-primary" />
                {getModalTitle()}
              </DialogTitle>
              <DialogDescription>
                {getModalDescription()}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto p-6 pt-2">
            {roleDetailsLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Carregando detalhes...</p>
              </div>
            ) : (isCreatingRole || selectedRole) ? (
              renderPermissionsContent()
            ) : (
              <div className="text-center py-8 text-destructive">
                Erro ao carregar detalhes. Tente novamente.
              </div>
            )}
          </div>

          <div className="p-4 border-t bg-secondary/20 flex justify-between items-center">
            {/* Footer com botões */}
            {(isEditingRole || isCreatingRole) ? (
              <div className="flex gap-2 justify-end w-full">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (isCreatingRole) setIsRoleDetailsOpen(false)
                    else setIsEditingRole(false)
                  }}
                  disabled={isSavingRole}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveRole}
                  disabled={isSavingRole}
                >
                  {isSavingRole ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {isCreatingRole ? "Criar Função" : "Salvar Alterações"}
                </Button>
              </div>
            ) : (
              <div className="flex gap-2 justify-end w-full">
                <Button
                  variant="outline"
                  onClick={() => setIsRoleDetailsOpen(false)}
                >
                  Fechar
                </Button>
                {userCan("update:role") && selectedRole && (
                  <Button onClick={() => setIsEditingRole(true)}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Editar Função
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* --- Modal de Confirmação de Exclusão de Role --- */}
      <Dialog open={isDeleteRoleModalOpen} onOpenChange={setIsDeleteRoleModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Função</DialogTitle>
            <DialogDescription>
              Esta ação removerá permanentemente a função do sistema.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-4 py-4 bg-muted/50 p-4 rounded-md border border-destructive/20">
            <div className="p-2 rounded-full bg-destructive/10">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-semibold">Função a ser excluída</Label>
              <div className="text-sm text-muted-foreground font-mono">
                {roleToDelete?.name || "..."}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDeleteRoleModalOpen(false)} disabled={isDeletingRole}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDeleteRole}
              disabled={isDeletingRole}
              className="gap-2"
            >
              {isDeletingRole ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedLayout>
  )
}