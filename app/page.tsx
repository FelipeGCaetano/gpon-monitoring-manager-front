"use client"
import { LayoutDashboard, Container, Layers, Users, Settings, Activity, AlertCircle, Server } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { ProtectedLayout } from "@/components/layout/protected-layout"

const activityData = [
  { time: "00:00", containers: 12, modules: 45, jobs: 8 },
  { time: "04:00", containers: 14, modules: 48, jobs: 12 },
  { time: "08:00", containers: 16, modules: 52, jobs: 18 },
  { time: "12:00", containers: 19, modules: 58, jobs: 22 },
  { time: "16:00", containers: 18, modules: 55, jobs: 19 },
  { time: "20:00", containers: 21, modules: 62, jobs: 25 },
  { time: "24:00", containers: 20, modules: 60, jobs: 23 },
]

const moduleData = [
  { name: "GPON", value: 340 },
  { name: "ACS", value: 280 },
  { name: "Core", value: 220 },
  { name: "Rupture", value: 190 },
]

const COLORS = ["#8b5cf6", "#0ea5e9", "#eab308", "#ef4444"]

const recentLogs = [
  { id: 1, message: "Container docker-01 iniciado com sucesso", type: "success", time: "2 min atrás" },
  { id: 2, message: "Módulo ACS v2.1 implantado", type: "success", time: "5 min atrás" },
  { id: 3, message: "Validação de licença concluída", type: "info", time: "8 min atrás" },
  { id: 4, message: "Falha ao conectar ao cliente-003", type: "error", time: "12 min atrás" },
]

const navigationItems = [
  { icon: LayoutDashboard, label: "Painel", href: "/", active: true },
  { icon: Container, label: "Containers", href: "/containers" },
  { icon: Layers, label: "Módulos", href: "/modules" },
  { icon: Users, label: "Clientes", href: "/clients" },
  { icon: Settings, label: "Configuração", href: "/settings" },
]

export default function Page() {
  return (
    <ProtectedLayout title="Painel de Controle" description="Bem-vindo de volta, Administrador">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Containers Ativos</CardTitle>
            <Server className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">+2 este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Módulos Carregados</CardTitle>
            <Layers className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">180</div>
            <p className="text-xs text-muted-foreground">+12 em implantação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas em Execução</CardTitle>
            <Activity className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
            <p className="text-xs text-muted-foreground">Tempo médio: 3.5m</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Falhas Recentes</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Última: 15 min atrás</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Atividade do Sistema</CardTitle>
            <CardDescription>Containers, módulos e tarefas nas últimas 24 horas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="time" stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "var(--color-foreground)" }}
                />
                <Line type="monotone" dataKey="containers" stroke="var(--color-chart-1)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="modules" stroke="var(--color-chart-2)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="jobs" stroke="var(--color-chart-3)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Module Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Módulos</CardTitle>
            <CardDescription>Por tipo de serviço</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={moduleData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {moduleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "var(--color-foreground)" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Logs and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Registros Recentes</CardTitle>
            <CardDescription>Últimos eventos do sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-4 pb-4 border-b border-border last:border-0">
                <div
                  className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    log.type === "success" ? "bg-chart-4" : log.type === "error" ? "bg-destructive" : "bg-chart-2"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{log.message}</p>
                  <p className="text-xs text-muted-foreground">{log.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Status Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo do Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Uso de CPU</span>
                <span className="font-medium">68%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: "68%" }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Memória</span>
                <span className="font-medium">82%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-accent h-2 rounded-full" style={{ width: "82%" }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Rede</span>
                <span className="font-medium">45%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-chart-2 h-2 rounded-full" style={{ width: "45%" }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Armazenamento</span>
                <span className="font-medium">56%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-chart-3 h-2 rounded-full" style={{ width: "56%" }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedLayout>
  )
}
