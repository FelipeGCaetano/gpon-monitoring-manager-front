"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GponInstance, Module } from "@/lib/types"
import { Loader2, Save, X } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface ModuleAssignmentModalProps {
  instance: GponInstance | null // Prop alterada de 'container' para 'instance'
  availableModules: Module[] // Prop adicionada
  isOpen: boolean
  onClose: () => void
  onSave: (instanceId: string, moduleIds: string[]) => Promise<void> // Assinatura da função alterada
}

export default function ModuleAssignmentModal({
  instance,
  availableModules,
  isOpen,
  onClose,
  onSave,
}: ModuleAssignmentModalProps) {
  const [selectedModules, setSelectedModules] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Popula os módulos selecionados quando a instância muda
  useEffect(() => {
    if (instance) {
      setSelectedModules(instance.modules.map((m) => m.id))
    }
  }, [instance])

  if (!isOpen || !instance) return null

  const handleToggleModule = (moduleId: string) => {
    setSelectedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    )
  }

  const handleSave = async () => {
    setIsSubmitting(true)
    try {
      // Chama a função onSave (que chamará o apiClient)
      await onSave(instance.id, selectedModules)
      onClose()
      toast.success("Módulos atribuídos com sucesso!")
    } catch (error) {
      toast.error("Falha ao atribuir módulos.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg max-w-2xl w-full">
        {/* Header */}
        <div className="border-b border-border flex items-center justify-between p-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Atribuir Módulos</h2>
            <p className="text-sm text-muted-foreground">Instância: {instance.client.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg" disabled={isSubmitting}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
          <p className="text-sm text-muted-foreground">
            Selecione quais módulos esta instância deve ter licença para usar:
          </p>

          <div className="space-y-3">
            {/* Usa os módulos disponíveis da API */}
            {availableModules.map((module) => (
              <div
                key={module.id}
                onClick={() => !isSubmitting && handleToggleModule(module.id)}
                className={`p-4 rounded-lg border-2 transition-colors ${isSubmitting ? "opacity-50" : "cursor-pointer"
                  } ${selectedModules.includes(module.id)
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                  }`}
              >
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selectedModules.includes(module.id)}
                    onChange={() => handleToggleModule(module.id)}
                    className="w-5 h-5 rounded mt-0.5"
                    disabled={isSubmitting}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{module.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {module.name || "Descrição do módulo."}
                    </p>
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {module.version || `v1.0.0`}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-border flex gap-3 p-6 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button className="gap-2" onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Salvar Módulos
          </Button>
        </div>
      </div>
    </div>
  )
}