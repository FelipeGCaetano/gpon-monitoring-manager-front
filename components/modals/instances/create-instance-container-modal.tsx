"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { EnvDefinition, ImageTemplate } from "@/lib/types"
import { Copy, Globe, Loader2, Lock, Network, Plus, Trash2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

// ... (Helpers UUID)
function simpleUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
const randomUUID = (): string => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return simpleUUID();
}

interface FormEnvVar {
    id: string;
    key: string;
    value: string;
    isRequired: boolean;
    isGlobal: boolean;
}

interface FormPortMap {
    id: string;
    privatePort: string;
    publicPort: string;
}

interface FormVolumeMap {
    id: string;
    name: string;
    containerPath: string;
}
interface FormNetworkConfig {
    name: string
    ip: string
}

// Interface de Saída (Mantida como number para a API)
export interface InstanceContainerData {
    tempId: string;
    name: string
    image: string
    envVariables: Omit<FormEnvVar, 'id'>[]
    ports: { privatePort: number, publicPort: number, ip?: string }[] // API espera numbers
    volumes: Omit<FormVolumeMap, 'id'>[]
    network: FormNetworkConfig
}

interface CreateInstanceContainerModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (containerData: InstanceContainerData) => void
    imageTemplates: ImageTemplate[]
    globalEnvs: { key: string, value: string }[]
    containerToEdit: (InstanceContainerData & { tempId: string }) | null
}

// MUDANÇA 2: Inicializa com string vazia para mostrar o placeholder
const createDefaultPort = (): FormPortMap => ({ id: randomUUID(), privatePort: "", publicPort: "" });
const createDefaultVolume = (): FormVolumeMap => ({ id: randomUUID(), name: "", containerPath: "" });
const defaultNetwork: FormNetworkConfig = { name: "", ip: "" }

export function CreateInstanceContainerModal({
    open,
    onOpenChange,
    onSave,
    imageTemplates,
    globalEnvs,
    containerToEdit
}: CreateInstanceContainerModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoadingData, setIsLoadingData] = useState(false)
    const [tempId, setTempId] = useState(randomUUID())

    const [name, setName] = useState("")
    const [selectedImage, setSelectedImage] = useState("")
    const [envVars, setEnvVars] = useState<FormEnvVar[]>([])
    const [ports, setPorts] = useState<FormPortMap[]>([createDefaultPort()])
    const [volumes, setVolumes] = useState<FormVolumeMap[]>([createDefaultVolume()])
    const [network, setNetwork] = useState<FormNetworkConfig>(defaultNetwork)

    const resetForm = () => {
        setName("")
        setSelectedImage("")
        setEnvVars([])
        setPorts([createDefaultPort()])
        setVolumes([createDefaultVolume()])
        setNetwork(defaultNetwork)
        setIsSubmitting(false)
        setTempId(randomUUID())
    }

    useEffect(() => {
        if (open) {
            if (containerToEdit) {
                setIsLoadingData(true)
                const template = imageTemplates.find(t => t.image === containerToEdit.image)
                if (template) {
                    setName(containerToEdit.name)
                    setSelectedImage(template.id)
                    setTempId(containerToEdit.tempId)
                    const globalEnvMap = new Map(globalEnvs.map(env => [env.key, env.value]));
                    const savedEnvs = new Map(containerToEdit.envVariables.map(env => [env.key, env.value]));
                    const newEnvs = template.envDefinitions.map((def: EnvDefinition) => {
                        const isGlobal = globalEnvMap.has(def.key);
                        let value = "";
                        if (savedEnvs.has(def.key)) value = savedEnvs.get(def.key)!;
                        else if (isGlobal) value = globalEnvMap.get(def.key)!;
                        else if (def.key === "CONTAINER_NAME") value = containerToEdit.name;

                        return {
                            id: randomUUID(),
                            key: def.key,
                            value: value,
                            isRequired: def.isRequired,
                            isGlobal: isGlobal && !savedEnvs.has(def.key),
                        }
                    });
                    setEnvVars(newEnvs)
                    // MUDANÇA 3: Converte números salvos para string ao carregar
                    setPorts(containerToEdit.ports.map(p => ({
                        ...p,
                        id: randomUUID(),
                        privatePort: String(p.privatePort),
                        publicPort: String(p.publicPort)
                    })))
                    setVolumes(containerToEdit.volumes.map(v => ({ ...v, id: randomUUID() })))
                    setNetwork(containerToEdit.network || defaultNetwork)
                } else {
                    toast.error(`Template de imagem "${containerToEdit.image}" não encontrado.`);
                    onOpenChange(false)
                }
                setIsLoadingData(false)
            } else {
                resetForm()
                setIsLoadingData(false)
            }
        }
    }, [open, containerToEdit, imageTemplates, globalEnvs])

    useEffect(() => {
        if (containerToEdit || !selectedImage) {
            if (!containerToEdit) setEnvVars([])
            return
        }
        const globalEnvMap = new Map(globalEnvs.map(env => [env.key, env.value]));
        const template = imageTemplates.find(t => t.id === selectedImage)
        if (template && template.envDefinitions) {
            const newEnvs = template.envDefinitions.map((def: EnvDefinition) => {
                const isGlobal = globalEnvMap.has(def.key);
                let value = isGlobal ? globalEnvMap.get(def.key)! : "";
                if (def.key === "CONTAINER_NAME" && !isGlobal) value = name;
                return {
                    id: randomUUID(),
                    key: def.key,
                    value: value,
                    isRequired: def.isRequired,
                    isGlobal: isGlobal,
                }
            })
            setEnvVars(newEnvs)
        } else {
            setEnvVars([])
        }
    }, [selectedImage, imageTemplates, globalEnvs, name, containerToEdit])

    const handleEnvChange = (id: string, value: string) => {
        setEnvVars(currentEnvs => currentEnvs.map(env => (env.id === id ? { ...env, value } : env)));
    }

    // MUDANÇA: Handler genérico continua funcionando pois agora state é string
    const handlePortChange = (id: string, field: "privatePort" | "publicPort" | "ip", value: string) => {
        setPorts(currentPorts => currentPorts.map(port => (port.id === id ? { ...port, [field]: value } : port)));
    }
    const addPort = () => setPorts([...ports, createDefaultPort()])
    const removePort = (id: string) => { if (ports.length > 1) setPorts(ports.filter(port => port.id !== id)); }
    const handleVolumeChange = (id: string, field: "name" | "containerPath", value: string) => {
        setVolumes(currentVolumes => currentVolumes.map(vol => (vol.id === id ? { ...vol, [field]: value } : vol)));
    }
    const addVolume = () => setVolumes([...volumes, createDefaultVolume()])
    const removeVolume = (id: string) => { if (volumes.length > 1) setVolumes(volumes.filter(vol => vol.id !== id)); }

    const connectionPreview = useMemo(() => {
        const template = imageTemplates.find(t => t.id === selectedImage);
        if (!template) return null;

        const img = template.image.toLowerCase();
        const getVal = (keyPart: string) => {
            const found = envVars.find(e => e.key.includes(keyPart) && e.value);
            return found ? found.value : "";
        }

        // MUDANÇA 4: Conversão para Number na lógica de preview
        const getPortsConfig = (defaultPort: number) => {
            const mapped = ports.find(p => Number(p.privatePort) === defaultPort);
            return {
                public: mapped && mapped.publicPort ? mapped.publicPort : defaultPort,
                private: defaultPort
            };
        }

        const publicHost = network.ip || "10.0.30.154";
        const privateHost = name || "container-name";

        let publicUrl = "";
        let privateUrl = "";
        let type = "";
        let protocol = "";
        let user = "";
        let pass = "";
        let dbPath = "";
        let portConfig = { public: 0, private: 0 }; // Usando any/string na view mas number aqui

        if (img.includes("postgres")) {
            type = "PostgreSQL";
            protocol = "postgresql";
            user = getVal("_USER") || "postgres";
            pass = getVal("_PASSWORD") || "senha";
            const db = getVal("_DB") || "postgres";
            dbPath = `/${db}`;
            portConfig = getPortsConfig(5432) as any;
        }
        else if (img.includes("mysql") || img.includes("mariadb")) {
            type = "MySQL/MariaDB";
            protocol = "mysql";
            user = getVal("_USER") || "root";
            pass = getVal("_PASSWORD") || "senha";
            const db = getVal("_DATABASE") || "";
            dbPath = `/${db}`;
            portConfig = getPortsConfig(3306) as any;
        }
        else if (img.includes("mongo")) {
            type = "MongoDB";
            protocol = "mongodb";
            user = getVal("USERNAME") || "root";
            pass = getVal("PASSWORD") || "senha";
            portConfig = getPortsConfig(27017) as any;
        }
        else if (img.includes("redis")) {
            type = "Redis";
            protocol = "redis";
            pass = getVal("PASSWORD") || getVal("REQUIREPASS");
            portConfig = getPortsConfig(6379) as any;
        }

        if (!type) return null;

        let credentials = "";
        if (user && pass) credentials = `${user}:${pass}@`;
        else if (pass) credentials = `:${pass}@`;

        publicUrl = `${protocol}://${credentials}${publicHost}:${portConfig.public}${dbPath}`;
        privateUrl = `${protocol}://${credentials}${privateHost}:${portConfig.private}${dbPath}`;

        return { type, publicUrl, privateUrl };
    }, [selectedImage, imageTemplates, envVars, ports, network.ip, name]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copiado!");
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        const missingRequiredEnvs = envVars.filter(env => env.isRequired && !env.isGlobal && env.key !== "CONTAINER_NAME" && !env.value)
        if (missingRequiredEnvs.length > 0) {
            toast.error(`Variáveis obrigatórias faltando: ${missingRequiredEnvs.map(e => e.key).join(", ")}`)
            setIsSubmitting(false)
            return
        }
        const selectedTemplate = imageTemplates.find(t => t.id === selectedImage);
        if (!selectedTemplate) {
            toast.error("Template não encontrado.");
            setIsSubmitting(false);
            return;
        }

        // MUDANÇA 5: Converte string para number antes de salvar
        // Se estiver vazio, ignora a linha ou trata como erro (aqui filtra vazios)
        const finalPorts = ports
            .filter((p) => p.privatePort && p.publicPort)
            .map((p) => ({
                privatePort: Number(p.privatePort),
                publicPort: Number(p.publicPort),
            }));

        const payload: InstanceContainerData = {
            tempId, name, image: selectedTemplate.image,
            envVariables: envVars.filter((env) => env.key).map(({ key, value, isRequired, isGlobal }) => ({ key, value, isRequired, isGlobal })),
            ports: finalPorts,
            volumes: volumes.filter((v) => v.name && v.containerPath).map(({ name, containerPath }) => ({ name, containerPath })),
            network: network.name.trim() ? { ...network, ip: network.ip } : defaultNetwork,
        }
        onSave(payload)
        onOpenChange(false)
        setIsSubmitting(false)
    }

    // MUDANÇA 6: Renderização com cabeçalhos e inputs limpos
    const renderPortInputs = () => {
        return (
            <div className="space-y-2">
                {/* Cabeçalho das colunas */}
                <div className="grid grid-cols-[1fr_1fr_auto] gap-2 px-1">
                    <span className="text-xs font-medium text-muted-foreground">Porta Pública (Host)</span>
                    <span className="text-xs font-medium text-muted-foreground">Porta Privada (Container)</span>
                    <span className="w-8"></span> {/* Espaço para o botão delete */}
                </div>

                {/* Inputs */}
                {ports.map((item) => (
                    <div key={item.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                        <Input
                            type="number"
                            placeholder="Ex: 8080"
                            value={item.publicPort}
                            onChange={(e) => handlePortChange(item.id, 'publicPort', e.target.value)}
                            disabled={isSubmitting}
                        />
                        <Input
                            type="number"
                            placeholder="Ex: 80"
                            value={item.privatePort}
                            onChange={(e) => handlePortChange(item.id, 'privatePort', e.target.value)}
                            disabled={isSubmitting}
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removePort(item.id)}
                            disabled={isSubmitting || ports.length === 1}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-10 w-8"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                ))}
            </div>
        )
    }

    const renderVolumeInputs = () => {
        return (
            <div className="space-y-2">
                <div className="grid grid-cols-[1fr_1fr_auto] gap-2 px-1">
                    <span className="text-xs font-medium text-muted-foreground">Nome do Volume (Host)</span>
                    <span className="text-xs font-medium text-muted-foreground">Caminho no Container</span>
                    <span className="w-8"></span>
                </div>
                {volumes.map((item) => (
                    <div key={item.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                        <Input type="text" placeholder="Ex: dados-db" value={item.name} onChange={(e) => handleVolumeChange(item.id, 'name', e.target.value)} disabled={isSubmitting} />
                        <Input type="text" placeholder="Ex: /var/lib/mysql" value={item.containerPath} onChange={(e) => handleVolumeChange(item.id, 'containerPath', e.target.value)} disabled={isSubmitting} />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeVolume(item.id)} disabled={isSubmitting || volumes.length === 1} className="text-destructive hover:text-destructive hover:bg-destructive/10 h-10 w-8"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{containerToEdit ? "Editar Container" : "Adicionar Container"}</DialogTitle>
                    <DialogDescription>Configuração detalhada do serviço.</DialogDescription>
                </DialogHeader>

                {isLoadingData ? (
                    <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                        <div className="overflow-y-auto px-1 py-4">
                            <Tabs defaultValue="general" className="space-y-4">
                                <TabsList className="grid grid-cols-5 w-full">
                                    <TabsTrigger value="general">Geral</TabsTrigger>
                                    <TabsTrigger value="ports">Portas</TabsTrigger>
                                    <TabsTrigger value="environment">Ambiente</TabsTrigger>
                                    <TabsTrigger value="volumes">Volumes</TabsTrigger>
                                    <TabsTrigger value="network">Rede</TabsTrigger>
                                </TabsList>

                                <TabsContent value="general" className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Nome do Container</label>
                                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: gpon-db" disabled={isSubmitting} required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Template da Imagem</label>
                                        <Select value={selectedImage} onValueChange={setSelectedImage} required disabled={isSubmitting || !!containerToEdit}>
                                            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                            <SelectContent>{imageTemplates.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                </TabsContent>

                                <TabsContent value="ports" className="space-y-3">
                                    {renderPortInputs()}
                                    <Button type="button" variant="outline" size="sm" onClick={addPort} disabled={isSubmitting} className="gap-2">
                                        <Plus className="w-4 h-4" /> Adicionar Porta
                                    </Button>
                                </TabsContent>

                                <TabsContent value="environment" className="space-y-4">
                                    {!selectedImage ? (
                                        <p className="text-sm text-muted-foreground text-center py-4">Selecione um Template na aba 'Geral'.</p>
                                    ) : (
                                        <>
                                            {connectionPreview && (
                                                <div className="grid gap-3 mb-4">
                                                    <div className="bg-muted/30 border rounded-md p-3">
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                                                <Globe className="w-3.5 h-3.5" />
                                                                <span className="text-xs font-bold uppercase">Acesso Público</span>
                                                            </div>
                                                            <Button type="button" variant="ghost" size="icon" className="h-5 w-5" onClick={() => copyToClipboard(connectionPreview.publicUrl)}>
                                                                <Copy className="w-3 h-3" />
                                                            </Button>
                                                        </div>
                                                        <code className="block w-full bg-background p-2 rounded border text-xs font-mono break-all text-muted-foreground">
                                                            {connectionPreview.publicUrl}
                                                        </code>
                                                    </div>

                                                    <div className="bg-muted/30 border rounded-md p-3">
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                                                <Network className="w-3.5 h-3.5" />
                                                                <span className="text-xs font-bold uppercase">Acesso Privado (Rede Interna)</span>
                                                            </div>
                                                            <Button type="button" variant="ghost" size="icon" className="h-5 w-5" onClick={() => copyToClipboard(connectionPreview.privateUrl)}>
                                                                <Copy className="w-3 h-3" />
                                                            </Button>
                                                        </div>
                                                        <code className="block w-full bg-background p-2 rounded border text-xs font-mono break-all text-muted-foreground">
                                                            {connectionPreview.privateUrl}
                                                        </code>
                                                    </div>
                                                </div>
                                            )}

                                            {envVars.length === 0 ? (
                                                <p className="text-sm text-muted-foreground text-center py-4">Sem variáveis de ambiente.</p>
                                            ) : (
                                                envVars.map((env) => (
                                                    <div key={env.id} className="grid grid-cols-2 gap-3 items-center">
                                                        <div className="space-y-1">
                                                            <label htmlFor={env.id} className="flex items-center gap-2 text-sm font-mono text-muted-foreground">
                                                                {env.isGlobal && <Lock className="w-3 h-3" />}
                                                                {env.key} {env.isRequired && !env.isGlobal && <span className="text-destructive">*</span>}
                                                            </label>
                                                        </div>
                                                        <Input
                                                            id={env.id}
                                                            value={env.value}
                                                            onChange={(e) => handleEnvChange(env.id, e.target.value)}
                                                            placeholder={env.isGlobal ? "Global" : "Valor"}
                                                            disabled={isSubmitting || env.isGlobal || (env.key === "CONTAINER_NAME" && !containerToEdit)}
                                                            required={env.isRequired && !env.isGlobal}
                                                            className="flex-1"
                                                        />
                                                    </div>
                                                ))
                                            )}
                                        </>
                                    )}
                                </TabsContent>

                                <TabsContent value="volumes" className="space-y-3">
                                    {renderVolumeInputs()}
                                    <Button type="button" variant="outline" size="sm" onClick={addVolume} disabled={isSubmitting} className="gap-2">
                                        <Plus className="w-4 h-4" /> Adicionar Volume
                                    </Button>
                                </TabsContent>

                                <TabsContent value="network" className="space-y-4">
                                    <div className="space-y-2"><label className="text-sm font-medium">Nome da Rede</label><Input value={network.name} onChange={(e) => setNetwork(prev => ({ ...prev, name: e.target.value }))} placeholder="Ex: gpon-net" disabled={isSubmitting} /></div>
                                    <div className="space-y-2"><label className="text-sm font-medium">Endereço IP</label><Input value={network.ip} onChange={(e) => setNetwork(prev => ({ ...prev, ip: e.target.value }))} placeholder="Ex: 172.17.0.5" disabled={isSubmitting} /></div>
                                </TabsContent>
                            </Tabs>
                        </div>
                        <div className="mt-auto pt-6 border-t border-border">
                            <Button type="submit" className="w-full" disabled={isSubmitting || !name || !selectedImage}>{isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (containerToEdit ? "Salvar Alterações" : "Adicionar Container")}</Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}