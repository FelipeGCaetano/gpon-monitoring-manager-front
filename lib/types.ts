// Type definitions based on Prisma schema
export type ContainerStatus = "RUNNING" | "STOPPED" | "CREATED"
export type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

export interface User {
  id: string
  name: string
  email: string
  phone: string
  idRole: string
  role: Role
  createdAt: Date
  updatedAt: Date
}

export interface Role {
  id: string
  name: string
  users: User[]
  routes: Route[]
}

export interface Route {
  id: string
  path: string
  method: Method
  roles: Role[]
}

export interface Log {
  id: string
  type: string
  level: string
  userId?: string
  action: string
  user?: User
  created_at: Date
}

export interface Client {
  id: string
  name: string
  address: string
  phone: string
  email: string
  gponInstances: GponInstance[]
}

export interface GponInstance {
  id: string
  clientId: string
  client: Client
  modules: Module[]
  containers: Container[]
  createdAt: Date
}

export interface Module {
  id: string
  name: string
  instances: GponInstance[]
}

export interface ImageTemplate {
  id: string
  name: string
  image: string
  command?: string
  healthcheckTest?: string
  healthcheckInterval?: string
  healthcheckTimeout?: string
  healthcheckRetries?: number
  envDefinitions: EnvDefinition[]
  containers: Container[]
}

export interface EnvDefinition {
  id: string
  key: string
  isRequired: boolean
  templateId: string
  template: ImageTemplate
}

export interface PortMapping {
  id: string
  ip: string
  privatePort: number
  publicPort: number
  containerId: string
}

export interface ContainerEnv {
  id: string
  key: string
  value: string
  containerId: string
}

export interface VolumeMapping {
  id: string
  hostVolumeName: string
  containerPath: string
  containerId: string
}

export interface NetworkMapping {
  id: string
  hostNetworkName: string
  ipAddress?: string
  containerId: string
}

export interface Container {
  id: string
  gponInstanceId: string
  gponInstance: GponInstance
  name: string
  imageTemplateId: string
  imageTemplate: ImageTemplate
  lastRestart?: Date
  status?: ContainerStatus
  portMapping: PortMapping[]
  envVariables: ContainerEnv[]
  volumeMapping: VolumeMapping[]
  networkMapping?: NetworkMapping
  createdAt: Date
}
