"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card } from "@/components/ui/card"
import { apiClient } from "@/lib/api-client"
import type { Client, Module } from "@/lib/types"

interface CreateInstanceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clients: Client[]
  modules: Module[]
  onSuccess?: () => void
}

export function CreateInstanceModal({ open, onOpenChange, clients, modules, onSuccess }: CreateInstanceModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    clientId: "",
    moduleIds: [] as string[],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await apiClient.createGponInstance(formData)
      onOpenChange(false)
      setFormData({ clientId: "", moduleIds: [] })
      onSuccess?.()
    } catch (error) {
      console.error("Failed to create instance:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New GPON Instance</DialogTitle>
          <DialogDescription>Configure a new GPON instance for a client</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client">Client</Label>
            <Select value={formData.clientId} onValueChange={(value) => setFormData({ ...formData, clientId: value })}>
              <SelectTrigger id="client">
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Modules</Label>
            <Card className="p-3 space-y-2 max-h-48 overflow-y-auto">
              {modules.map((module) => (
                <div key={module.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={module.id}
                    checked={formData.moduleIds.includes(module.id)}
                    onCheckedChange={(checked) => {
                      setFormData({
                        ...formData,
                        moduleIds: checked
                          ? [...formData.moduleIds, module.id]
                          : formData.moduleIds.filter((id) => id !== module.id),
                      })
                    }}
                  />
                  <Label htmlFor={module.id} className="cursor-pointer">
                    {module.name}
                  </Label>
                </div>
              ))}
            </Card>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.clientId}>
              {isLoading ? "Creating..." : "Create Instance"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
