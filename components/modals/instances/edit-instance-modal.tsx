"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Client, Module, Project } from "@/lib/types"
import { Construction } from "lucide-react"

interface EditInstanceModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onInstanceUpdated: () => void
    instanceId: string | null | undefined
    clients: Client[]
    modules: Module[]
    projects: Project[]
}

export function EditInstanceModal({
    open,
    onOpenChange,
    // As props abaixo não são usadas agora, mas mantidas para compatibilidade com o pai
    // instanceId,
    // clients,
    // modules,
    // projects,
    // onInstanceUpdated
}: EditInstanceModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Em Desenvolvimento</DialogTitle>
                    <DialogDescription>
                        Funcionalidade indisponível no momento.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                    <div className="p-4 bg-muted rounded-full">
                        <Construction className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-medium">Estamos trabalhando nisso!</h3>
                        <p className="text-sm text-muted-foreground">
                            A edição de instâncias estará disponível em uma atualização futura. Por favor, aguarde.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                        Entendi
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}