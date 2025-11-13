// API client utilities for fetching schema-based data
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");

  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token expirou ou é inválido, deslogar o usuário
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = '/login';
    throw new Error("Sessão expirada");
  }

  if (!response.ok) {
    throw new Error(`Falha na requisição: ${response.statusText}`);
  }

  if (options && options.method === 'DELETE') {
    return;
  } else {
    return response.json();
  }
}

export const apiClient = {
  async getAllUsers() {
    return fetchWithAuth("/users/all")
  },

  async createUser(user: any) {
    return fetchWithAuth("/users", {
      method: "POST",
      body: JSON.stringify(user),
    })
  },

  async updateUser(id: string, user: any) {
    return fetchWithAuth(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(user),
    })
  },

  async deleteUser(id: string) {
    return fetchWithAuth(`/users/${id}`, {
      method: "DELETE",
    })
  },

  async getRoles() {
    return fetchWithAuth("/roles")
  },
}
