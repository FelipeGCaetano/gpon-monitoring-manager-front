"use client"

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { apiClient } from "@/lib/api-client";
import { Client } from "@/lib/types"; // Importa o tipo
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Copiando a função de máscara para este componente
const formatPhone = (value: string) => {
    if (!value) return ""
    let v = value.replace(/\D/g, "")
    v = v.slice(0, 11)
    if (v.length > 10) {
        v = v.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3")
    } else if (v.length > 6) {
        v = v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3")
    } else if (v.length > 2) {
        v = v.replace(/^(\d{2})(\d{0,5}).*/, "($1) $2")
    } else if (v.length > 0) {
        v = v.replace(/^(\d{0,2}).*/, "($1")
    }
    return v
}

interface EditClientModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onClientUpdated: () => void // Callback para recarregar a lista
    client: Client | null // Cliente a ser editado
}

interface ClientFormData {
    name: string
    address: string
    phone: string
    email: string
}

export function EditClientModal({
    open,
    onOpenChange,
    onClientUpdated,
    client,
}: EditClientModalProps) {
    const [formData, setFormData] = useState<ClientFormData>({
        name: "",
        address: "",
        phone: "",
        email: "",
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Popula o formulário quando o cliente é passado e o modal é aberto
    useEffect(() => {
        if (client && open) {
            setFormData({
                name: client.name,
                address: client.address,
                phone: formatPhone(client.phone), // Formata o telefone ao carregar
                email: client.email,
            })
        }
    }, [client, open])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({
            ...prev,
            phone: formatPhone(e.target.value),
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!client) return

        setIsSubmitting(true)
        try {
            const payload = {
                ...formData,
                phone: formData.phone.replace(/\D/g, ""), // Envia apenas os números
            }
            // Chama a rota de UPDATE
            await apiClient.updateClient(client.id, payload)
            toast.success("Cliente atualizado com sucesso!")
            onClientUpdated() // Chama o callback para atualizar a página
            onOpenChange(false) // Fecha o modal
        } catch (error) {
            toast.error("Falha ao atualizar cliente.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Editar Cliente</DialogTitle>
                    <DialogDescription>
                        Altere os dados do cliente.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="text-sm font-medium">
                            Nome do Cliente
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground"
                            placeholder="Ex: N-Multifibra"
                            disabled={isSubmitting}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="text-sm font-medium">
                            Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground"
                            placeholder="Ex: contato@cliente.com.br"
                            disabled={isSubmitting}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="phone" className="text-sm font-medium">
                            Telefone
                        </label>
                        <input
                            id="phone"
                            name="phone"
                            type="text"
                            value={formData.phone}
                            onChange={handlePhoneChange}
                            maxLength={15}
                            className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground"
                            placeholder="Ex: (11) 4210-0123"
                            disabled={isSubmitting}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="address" className="text-sm font-medium">
                            Endereço
                        </label>
                        <input
                            id="address"
                            name="address"
                            type="text"
                            value={formData.address}
                            onChange={handleChange}
                            className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground"
                            placeholder="Ex: R. José Augusto Pedroso, 298..."
                            disabled={isSubmitting}
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            "Salvar Alterações"
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}