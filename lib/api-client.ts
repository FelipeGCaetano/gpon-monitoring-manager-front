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
  async login(credentials: { email: string; password: string }) {
    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
    });

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Credenciais inválidas")
    }

    return data
  },

  async requestPasswordRecovery(email: string) {
    const response = await fetch(`${API_BASE_URL}/users/password-recovery`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Credenciais inválidas")
    }

    return data
  },

  async validateRecoveryCode(content: {code: string, password: string, email: string}) {
    const response = await fetch(`${API_BASE_URL}/users/password-recovery/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(content),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Credenciais inválidas")
    }

    return data
  },

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

  async getSettings() {
    return fetchWithAuth("/settings")
  },

  async updateSettings(id: string, settings: any) {
    return fetchWithAuth(`/settings/${id}`, {
      method: "PUT",
      body: JSON.stringify(settings),
    })
  },

  async getClients() {
    return fetchWithAuth("/clients")
  },

  async createClient(client: any) {
    return fetchWithAuth("/clients", {
      method: "POST",
      body: JSON.stringify(client),
    })
  },

  async updateClient(id: string, client: any) {
    return fetchWithAuth(`/clients/${id}`, {
      method: "PUT",
      body: JSON.stringify(client),
    })
  },

  async deleteClient(id: string) {
    return fetchWithAuth(`/clients/${id}`, {
      method: "DELETE",
    })
  },

  async getInstances() {
    return fetchWithAuth("/instances")
  },

  async getInstanceById(id: string) {
    return fetchWithAuth(`/instances/${id}`)
  },

  async createInstance(instance: any) {
    return fetchWithAuth("/instances", {
      method: "POST",
      body: JSON.stringify(instance),
    })
  },

  async updateInstance(id: string, instance: any) {
    return fetchWithAuth(`/instances/${id}`, {
      method: "PUT",
      body: JSON.stringify(instance),
    })
  },

  async deleteInstance(id: string) {
    return fetchWithAuth(`/instances/${id}`, {
      method: "DELETE",
    })
  },

  async getModules() {
    return fetchWithAuth("/modules")
  },

  async getModuleById(id: string) {
    return fetchWithAuth(`/modules/${id}`)
  },

  async createModule(module: any) {
    return fetchWithAuth("/modules", {
      method: "POST",
      body: JSON.stringify(module),
    })
  },

  async updateModule(id: string, module: any) {
    return fetchWithAuth(`/modules/${id}`, {
      method: "PUT",
      body: JSON.stringify(module),
    })
  },

  async deleteModule(id: string) {
    return fetchWithAuth(`/modules/${id}`, {
      method: "DELETE",
    })
  },

  async syncInstanceModules(id: string, modules: any) {
    return fetchWithAuth(`/instances/${id}/sync-modules`, {
      method: "POST",
      body: JSON.stringify(modules),
    })
  },

  async getContainers() {
    return fetchWithAuth("/containers")
  },

  async getContainerById(id: string) {
    return fetchWithAuth(`/containers/${id}`)
  },

  async createContainer(container: any) {
    return fetchWithAuth("/containers", {
      method: "POST",
      body: JSON.stringify(container),
    })
  },

  async updateContainer(id: string, container: any) {
    return fetchWithAuth(`/containers/${id}`, {
      method: "PUT",
      body: JSON.stringify(container),
    })
  },

  async deleteContainer(id: string) {
    return fetchWithAuth(`/containers/${id}`, {
      method: "DELETE",
    })
  },

  async startContainer(id: string) {
    return fetchWithAuth(`/containers/${id}/start`, {
      method: "POST",
    })
  },

  async stopContainer(id: string) {
    return fetchWithAuth(`/containers/${id}/stop`, {
      method: "POST",
    })
  },

  async restartContainer(id: string) {
    return fetchWithAuth(`/containers/${id}/restart`, {
      method: "POST",
    })
  },

  async getUsedPublicPorts() {
    return fetchWithAuth(`/containers/used-public-ports`)
  },

  async getImageTemplates() {
    return fetchWithAuth("/containers/images")
  },

  async getImageTemplateById(id: string) {
    return fetchWithAuth(`/containers/images/${id}`)
  },

  async createImageTemplate(imageTemplate: any) {
    return fetchWithAuth("/containers/images", {
      method: "POST",
      body: JSON.stringify(imageTemplate),
    })
  },

  async updateImageTemplate(id: string, imageTemplate: any) {
    return fetchWithAuth(`/containers/images/${id}`, {
      method: "PUT",
      body: JSON.stringify(imageTemplate),
    })
  },

  async deleteImageTemplate(id: string) {
    return fetchWithAuth(`/containers/images/${id}`, {
      method: "DELETE",
    })
  },

  async getEnvDefinitions(id: string) {
    return fetchWithAuth(`/containers/images/${id}/envs`)
  },

  async createEnvDefinitions(id: string, envDefinition: any) {
    return fetchWithAuth(`/containers/images/${id}/envs`, {
      method: "POST",
      body: JSON.stringify(envDefinition),
    })
  },

  async updateEnvDefinition(id: string, envId: string, envDefinition: any) {
    return fetchWithAuth(`/containers/images/${id}/envs/${envId}`, {
      method: "PUT",
      body: JSON.stringify(envDefinition),
    })
  },

  async deleteEnvDefinition(id: string, envId: string,) {
    return fetchWithAuth(`/containers/images/${id}/envs/${envId}`, {
      method: "DELETE",
    })
  },

  async getProjects() {
    return fetchWithAuth("/projects")
  },

  async getProjectById(id: string) {
    return fetchWithAuth(`/projects/${id}`)
  },

  async createProject(project: any) {
    return fetchWithAuth("/projects", {
      method: "POST",
      body: JSON.stringify(project),
    })
  },

  async updateProject(id: string, project: any) {
    return fetchWithAuth(`/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(project),
    })
  },

  async deleteProject(id: string) {
    return fetchWithAuth(`/projects/${id}`, {
      method: "DELETE",
    })
  },
}
