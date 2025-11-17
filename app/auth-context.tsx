"use client"

import { apiClient } from "@/lib/api-client"
import { User } from "@/lib/types"
import { usePathname, useRouter } from "next/navigation"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { toast } from "sonner"

interface PermissionGroup {
  method: string
  permissions: string[]
}
type PermissionsSet = Set<string>

interface AuthContextType {
  user: User | null
  isAuthLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  userCan: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const loadPermissions = (): PermissionsSet => {
  const stored = localStorage.getItem("permissions")
  if (stored) {
    try {
      // Converte o array de strings salvo de volta para um Set
      return new Set(JSON.parse(stored))
    } catch (e) {
      return new Set()
    }
  }
  return new Set()
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [permissions, setPermissions] = useState<PermissionsSet>(new Set())
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Verificar autenticação ao montar o componente
  useEffect(() => {
    setIsAuthLoading(true)
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
        setPermissions(loadPermissions()) // Carrega as permissões
      } catch (error) {
        console.error("Erro ao restaurar usuário:", error)
        localStorage.clear() // Limpa tudo se estiver corrompido
      }
    }
    setIsAuthLoading(false)
  }, [])

  // Redirecionar para login se não autenticado
  useEffect(() => {
    const publicRoutes = ["/login", "/forgot-password"]

    if (!isAuthLoading && !user && !publicRoutes.includes(pathname)) {
      router.push("/login")
    }
  }, [isAuthLoading, user, pathname, router])


  // --- FUNÇÃO DE LOGIN ATUALIZADA ---
  const login = async (email: string, password: string) => {
    setIsAuthLoading(true)
    try {
      // 1. Chamar a API REAL de login
      const response = await apiClient.login({ email, password })

      const { user, accessToken, permittedActions } = response

      // 2. Processar e achatar as permissões
      const allPermissions = (permittedActions as PermissionGroup[]).flatMap(
        (group) => group.permissions
      )
      const permissionsSet = new Set(allPermissions)

      // 3. Salvar tudo no estado e no localStorage
      setUser(user)
      setPermissions(permissionsSet)

      localStorage.setItem("user", JSON.stringify(user))
      localStorage.setItem("token", accessToken)
      localStorage.setItem("permissions", JSON.stringify(allPermissions)) // Salva o array

      router.push("/")
    } catch (error: any) {
      console.error("Erro ao fazer login:", error)
      toast.error(error.message || "Email ou senha inválidos")
      throw error
    } finally {
      setIsAuthLoading(false)
    }
  }

  // --- FUNÇÃO DE LOGOUT ATUALIZADA ---
  const logout = () => {
    setUser(null)
    setPermissions(new Set())
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    localStorage.removeItem("permissions") // Limpa as permissões
    router.push("/login")
  }

  // --- NOSSO NOVO HOOK DE VERIFICAÇÃO ---
  const userCan = (permission: string): boolean => {
    if (isAuthLoading) return false // Não permite nada enquanto carrega
    return permissions.has(permission)
  }

  return (
    <AuthContext.Provider value={{ user, isAuthLoading, login, logout, isAuthenticated: !!user, userCan }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider")
  }
  return context
}
