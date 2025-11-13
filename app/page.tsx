"use client"
import { ProtectedLayout } from "@/components/layout/protected-layout"
// 1. Imports de ícones simplificados. Removidos charts e KPIs antigos.
import { HardHat } from "lucide-react"
// 2. Imports de 'recharts' e outros ícones de KPI foram removidos.

// 3. Todos os dados mocados (activityData, moduleData, recentLogs) foram removidos.
// 4. navigationItems foi removido (agora é gerenciado pelo ProtectedLayout).

export default function Page() {
  return (
    <ProtectedLayout
      title="Painel de Controle"
      description="Bem-vindo ao gerenciador de instancias GPON"
    // Sem botão de ação no header do dashboard
    >
      {/* 5. Todo o conteúdo antigo (KPIs, Charts, Logs) foi substituído por este bloco: */}
      <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border/80 bg-card p-12 h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center text-center max-w-md">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-6">
            <HardHat className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-3">
            Dashboard em Construção
          </h2>
          <p className="text-lg text-muted-foreground">
            Estamos trabalhando duro para trazer os principais KPIs,
            gráficos e métricas de monitoramento para este painel.
          </p>
          <p className="mt-4 text-muted-foreground">
            Enquanto isso, você pode usar os menus ao lado para gerenciar
            seus Clientes, Instâncias, Containers e Módulos.
          </p>
        </div>
      </div>
    </ProtectedLayout>
  )
}