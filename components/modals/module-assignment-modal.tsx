"use client"

import { useState } from "react"
import { X, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface ModuleAssignmentModalProps {
  container: any
  isOpen: boolean
  onClose: () => void
  onSave: (moduleIds: string[]) => void
}

const availableModules = [
  { id: "gpon", name: "GPON Core", version: "3.2.1", description: "Core GPON functionality" },
  { id: "acs", name: "ACS Module", version: "2.5.0", description: "Auto Configuration Server" },
  { id: "rupture", name: "Rupture Detection", version: "1.8.3", description: "Fiber rupture detection" },
  { id: "core", name: "Core Services", version: "2.0.0", description: "Essential core services" },
]

export default function ModuleAssignmentModal({ container, isOpen, onClose, onSave }: ModuleAssignmentModalProps) {
  const [selectedModules, setSelectedModules] = useState<string[]>(container?.modules || [])

  if (!isOpen) return null

  const handleToggleModule = (moduleId: string) => {
    setSelectedModules((prev) => (prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]))
  }

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/config/${container.id}/modules`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleIds: selectedModules }),
      })

      if (response.ok) {
        onSave(selectedModules)
        onClose()
      }
    } catch (error) {
      console.error("Failed to update modules:", error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg max-w-2xl w-full">
        {/* Header */}
        <div className="border-b border-border flex items-center justify-between p-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Assign Modules</h2>
            <p className="text-sm text-muted-foreground">{container.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
          <p className="text-sm text-muted-foreground">Select which modules should be licensed for this container:</p>

          <div className="space-y-3">
            {availableModules.map((module) => (
              <div
                key={module.id}
                onClick={() => handleToggleModule(module.id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedModules.includes(module.id)
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
                  />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{module.name}</p>
                    <p className="text-sm text-muted-foreground">{module.description}</p>
                    <Badge variant="secondary" className="mt-2 text-xs">
                      v{module.version}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-border flex gap-3 p-6 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button className="gap-2" onClick={handleSave}>
            <Save className="w-4 h-4" />
            Save Modules
          </Button>
        </div>
      </div>
    </div>
  )
}
