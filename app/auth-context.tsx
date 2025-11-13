"use client"

import { usePathname, useRouter } from "next/navigation"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

interface User {
  id: string
  email: string
  name: string
  role: "admin" | "operator" | "viewer"
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Verificar autenticação ao montar o componente
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error("Erro ao restaurar usuário:", error)
        localStorage.removeItem("user")
      }
    }
    setIsLoading(false)
  }, [])

  // Redirecionar para login se não autenticado
  useEffect(() => {
    if (!isLoading && !user && pathname !== "/login") {
      router.push("/login")
    }
  }, [isLoading, user, pathname, router])

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // 1. Chamar a API REAL de login do seu back-end
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Email ou senha inválidos');
      }

      const data = await response.json();

      // 2. Salvar o usuário e o token
      const userToSave: User = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role.name.toLowerCase() as "admin" | "operator" | "viewer",
      };

      setUser(userToSave);
      localStorage.setItem("user", JSON.stringify(userToSave));

      // 3. Salvar o Access Token!
      localStorage.setItem("token", data.accessToken);

      router.push("/");

    } catch (error) {
      console.error("Erro ao fazer login:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, isAuthenticated: !!user }}>
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
