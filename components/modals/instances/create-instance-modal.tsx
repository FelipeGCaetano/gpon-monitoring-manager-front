"use client"

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox"; // Importa o Checkbox
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";
import { Client, Module } from "@/lib/types";
import { Container, Loader2, Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  CreateInstanceContainerModal,
  InstanceContainerData, // Importa o tipo do payload do sub-modal
} from "./create-instance-container-modal"; // Importa o novo sub-modal


interface CreateInstanceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInstanceCreated: () => void
  clients: Client[]
  modules: Module[]
}

export function CreateInstanceModal({
  open,
  onOpenChange,
  onInstanceCreated,
  clients,
  modules,
}: CreateInstanceModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // --- Estados do Formulário ---
  const [name, setName] = useState("")
  const [selectedClientId, setSelectedClientId] = useState("")
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([])
  const [containers, setContainers] = useState<InstanceContainerData[]>([]) // Lista de containers adicionados
  const [instanceType, setInstanceType] = useState<string>("PRODUCTION") // Valor padrão

  // --- Estado do Sub-Modal ---
  const [isContainerModalOpen, setIsContainerModalOpen] = useState(false)

  // --- Função para resetar o formulário ---
  const resetForm = () => {
    setName("")
    setSelectedClientId("")
    setSelectedModuleIds([])
    setContainers([])
    setInstanceType("PRODUCTION")
    setIsSubmitting(false)
  }

  const handleCloseModal = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm()
    }
    onOpenChange(isOpen)
  }

  // --- Handlers de Módulos e Containers ---
  const handleModuleToggle = (moduleId: string) => {
    setSelectedModuleIds((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    )
  }

  const handleSaveContainer = (containerData: InstanceContainerData) => {
    setContainers((prev) => [...prev, containerData])
    setIsContainerModalOpen(false) // Fecha o sub-modal
  }

  const handleRemoveContainer = (index: number) => {
    setContainers((prev) => prev.filter((_, i) => i !== index))
  }

  // --- Handler de Submissão Principal ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const payload = {
        name,
        clientId: selectedClientId,
        moduleIds: selectedModuleIds,
        containers, // O array de containers coletados do sub-modal
      }

      await apiClient.createInstance(payload)
      toast.success("Instância criada com sucesso!")
      onInstanceCreated() // Recarrega a página de instâncias
      handleCloseModal(false) // Fecha e reseta o modal
    } catch (error) {
      toast.error("Falha ao criar instância.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Criar Nova Instância GPON</DialogTitle>
            <DialogDescription>
              Preencha os dados da instância, selecione os módulos e adicione os containers.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden space-y-4">
            {/* Wrapper de Scroll para o conteúdo */}
            <div className="flex-1 overflow-y-auto p-1 space-y-4">

              {/* 1. Informações Gerais */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome da Instância</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Instância SP-Capital-01"
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cliente</label>
                  <Select
                    value={selectedClientId}
                    onValueChange={setSelectedClientId}
                    required
                    disabled={isSubmitting || clients.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente..." />
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
              </div>

              {/* 2. Módulos Licenciados */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Módulos Licenciados</label>
                {modules.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum módulo cadastrado no sistema.
                  </p>
                ) : (
                  <div className="p-4 border rounded-md max-h-40 overflow-y-auto space-y-3">
                    {modules.map((module) => (
                      <div key={module.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`mod-${module.id}`}
                          checked={selectedModuleIds.includes(module.id)}
                          onCheckedChange={() => handleModuleToggle(module.id)}
                          disabled={isSubmitting}
                        />
                        <label
                          htmlFor={`mod-${module.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {module.name}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Containers */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Containers</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setIsContainerModalOpen(true)}
                    disabled={isSubmitting}
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Container
                  </Button>
                </div>
                <div className="p-4 border rounded-md max-h-48 overflow-y-auto space-y-2">
                  {containers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum container adicionado a esta instância.
                    </p>
                  ) : (
                    containers.map((container, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded bg-secondary">
                        <div className="flex items-center gap-2">
                          <Container className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{container.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{container.image}</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveContainer(index)}
                          disabled={isSubmitting}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Botão de Submissão */}
            <div className="mt-auto pt-6 border-t border-border">
              <Button type="submit" className="w-full" disabled={isSubmitting || !selectedClientId || !name}>
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Criar Instância"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Renderiza o Sub-Modal */}
      <CreateInstanceContainerModal
        open={isContainerModalOpen}
        onOpenChange={setIsContainerModalOpen}
        onSave={handleSaveContainer}
      />
    </>
  )
}