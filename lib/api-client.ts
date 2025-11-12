// API client utilities for fetching schema-based data
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"

export const apiClient = {
  async getContainers() {
    const response = await fetch(`${API_BASE_URL}/containers`)
    if (!response.ok) throw new Error("Failed to fetch containers")
    return response.json()
  },

  async getContainerDetails(containerId: string) {
    const response = await fetch(`${API_BASE_URL}/containers/${containerId}`)
    if (!response.ok) throw new Error("Failed to fetch container details")
    return response.json()
  },

  async getClients() {
    const response = await fetch(`${API_BASE_URL}/clients`)
    if (!response.ok) throw new Error("Failed to fetch clients")
    return response.json()
  },

  async getGponInstances(clientId?: string) {
    const url = clientId ? `${API_BASE_URL}/gpon-instances?clientId=${clientId}` : `${API_BASE_URL}/gpon-instances`
    const response = await fetch(url)
    if (!response.ok) throw new Error("Failed to fetch GPON instances")
    return response.json()
  },

  async getModules() {
    const response = await fetch(`${API_BASE_URL}/modules`)
    if (!response.ok) throw new Error("Failed to fetch modules")
    return response.json()
  },

  async getImageTemplates() {
    const response = await fetch(`${API_BASE_URL}/image-templates`)
    if (!response.ok) throw new Error("Failed to fetch image templates")
    return response.json()
  },

  async getUsers() {
    const response = await fetch(`${API_BASE_URL}/users`)
    if (!response.ok) throw new Error("Failed to fetch users")
    return response.json()
  },

  async getRoles() {
    const response = await fetch(`${API_BASE_URL}/roles`)
    if (!response.ok) throw new Error("Failed to fetch roles")
    return response.json()
  },

  async getLogs(limit = 50) {
    const response = await fetch(`${API_BASE_URL}/logs?limit=${limit}`)
    if (!response.ok) throw new Error("Failed to fetch logs")
    return response.json()
  },

  async updateContainerEnv(containerId: string, envVariables: Record<string, string>) {
    const response = await fetch(`${API_BASE_URL}/containers/${containerId}/env`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ envVariables }),
    })
    if (!response.ok) throw new Error("Failed to update environment variables")
    return response.json()
  },

  async updateContainerModules(gponInstanceId: string, moduleIds: string[]) {
    const response = await fetch(`${API_BASE_URL}/config/${gponInstanceId}/modules`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleIds }),
    })
    if (!response.ok) throw new Error("Failed to update container modules")
    return response.json()
  },

  async restartContainer(containerId: string) {
    const response = await fetch(`${API_BASE_URL}/containers/${containerId}/restart`, {
      method: "POST",
    })
    if (!response.ok) throw new Error("Failed to restart container")
    return response.json()
  },

  async stopContainer(containerId: string) {
    const response = await fetch(`${API_BASE_URL}/containers/${containerId}/stop`, {
      method: "POST",
    })
    if (!response.ok) throw new Error("Failed to stop container")
    return response.json()
  },

  async deleteContainer(containerId: string) {
    const response = await fetch(`${API_BASE_URL}/containers/${containerId}`, {
      method: "DELETE",
    })
    if (!response.ok) throw new Error("Failed to delete container")
    return response.json()
  },

  async createGponInstance(data: {
    clientId: string
    moduleIds: string[]
  }) {
    const response = await fetch(`${API_BASE_URL}/gpon-instances`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error("Failed to create GPON instance")
    return response.json()
  },

  async updateUser(userId: string, data: Partial<any>) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error("Failed to update user")
    return response.json()
  },

  async deleteUser(userId: string) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: "DELETE",
    })
    if (!response.ok) throw new Error("Failed to delete user")
    return response.json()
  },
}
