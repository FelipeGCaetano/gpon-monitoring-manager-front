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
import { apiClient } from "@/lib/api-client"
// 1. Adicionei Copy, Globe e Network aos imports
import { Copy, Globe, Loader2, Lock, Network, Trash2 } from "lucide-react"
// 2. Adicionei useMemo aos imports
import type { EnvDefinition, GponInstance, ImageTemplate } from "@/lib/types"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

// --- Tipos para os campos do formulário ---
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

interface CreateContainerModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onContainerCreated: () => void
}

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

const createDefaultPort = (): FormPortMap => ({ id: randomUUID(), privatePort: "", publicPort: "" });
const createDefaultVolume = (): FormVolumeMap => ({ id: randomUUID(), name: "", containerPath: "" });
const defaultNetwork: FormNetworkConfig = { name: "", ip: "" }

export function CreateContainerModal({
    open,
    onOpenChange,
    onContainerCreated,
}: CreateContainerModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoadingData, setIsLoadingData] = useState(true)

    const [imageTemplates, setImageTemplates] = useState<ImageTemplate[]>([])
    const [gponInstances, setGponInstances] = useState<GponInstance[]>([])
    const [globalEnvs, setGlobalEnvs] = useState<{ key: string, value: string }[]>([])

    const [name, setName] = useState("")
    const [selectedImage, setSelectedImage] = useState("")
    const [selectedInstance, setSelectedInstance] = useState("")
    const [envVars, setEnvVars] = useState<FormEnvVar[]>([])
    const [ports, setPorts] = useState<FormPortMap[]>([createDefaultPort()])
    const [volumes, setVolumes] = useState<FormVolumeMap[]>([createDefaultVolume()])
    const [network, setNetwork] = useState<FormNetworkConfig>(defaultNetwork)

    const resetForm = () => {
        setName("")
        setSelectedImage("")
        setSelectedInstance("")
        setEnvVars([])
        setPorts([createDefaultPort()])
        setVolumes([createDefaultVolume()])
        setNetwork(defaultNetwork)
        setIsSubmitting(false)
    }

    useEffect(() => {
        if (open) {
            const fetchData = async () => {
                setIsLoadingData(true)
                try {
                    const [templatesData, instancesData, settingsData] = await Promise.all([
                        apiClient.getImageTemplates(),
                        apiClient.getInstances(),
                        apiClient.getSettings(),
                    ])
                    setImageTemplates(templatesData || [])
                    setGponInstances(instancesData || [])
                    setGlobalEnvs(settingsData?.globalEnv || [])
                } catch (error) {
                    toast.error("Falha ao carregar dados.")
                } finally {
                    setIsLoadingData(false)
                }
            }
            fetchData()
        } else {
            resetForm()
        }
    }, [open])

    useEffect(() => {
        if (!selectedImage) {
            setEnvVars([])
            return
        }

        const globalEnvMap = new Map(globalEnvs.map(env => [env.key, env.value]));
        const template = imageTemplates.find(t => t.id === selectedImage)

        if (template && template.envDefinitions) {
            const newEnvs = template.envDefinitions.map((def: EnvDefinition) => {
                const isGlobal = globalEnvMap.has(def.key);
                let value = "";
                if (isGlobal) {
                    value = globalEnvMap.get(def.key)!;
                } else if (def.key === "CONTAINER_NAME") {
                    value = name;
                }

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
    }, [selectedImage, imageTemplates, globalEnvs, name])

    const handleEnvChange = (id: string, value: string) => {
        setEnvVars(currentEnvs =>
            currentEnvs.map(env => (env.id === id ? { ...env, value } : env))
        );
    }

    const handlePortChange = (id: string, field: "privatePort" | "publicPort", value: string) => {
        setPorts(currentPorts =>
            currentPorts.map(port => (port.id === id ? { ...port, [field]: value } : port))
        );
    }
    const addPort = () => setPorts([...ports, createDefaultPort()])
    const removePort = (id: string) => {
        if (ports.length > 1) {
            setPorts(ports.filter(port => port.id !== id));
        }
    }

    const handleVolumeChange = (id: string, field: "name" | "containerPath", value: string) => {
        setVolumes(currentVolumes =>
            currentVolumes.map(vol => (vol.id === id ? { ...vol, [field]: value } : vol))
        );
    }
    const addVolume = () => setVolumes([...volumes, createDefaultVolume()])
    const removeVolume = (id: string) => {
        if (volumes.length > 1) {
            setVolumes(volumes.filter(vol => vol.id !== id));
        }
    }

    // --- 3. Lógica de Visualização de URL (Inserida Aqui) ---
    const connectionPreview = useMemo(() => {
        const template = imageTemplates.find(t => t.id === selectedImage);
        if (!template) return null;

        const img = template.image.toLowerCase();
        const getVal = (keyPart: string) => {
            const found = envVars.find(e => e.key.includes(keyPart) && e.value);
            return found ? found.value : "";
        }

        const getPortsConfig = (defaultPort: number) => {
            const mapped = ports.find(p => Number(p.privatePort) === defaultPort);
            return {
                public: mapped && mapped.publicPort ? mapped.publicPort : defaultPort,
                private: defaultPort
            };
        }

        const publicHost = network.ip || "0.0.0.0";
        const privateHost = name || "container-name";

        let publicUrl = "";
        let privateUrl = "";
        let type = "";
        let protocol = "";
        let user = "";
        let pass = "";
        let dbPath = "";
        let portConfig = { public: 0, private: 0 };

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
            const db = getVal("_DATABASE") || "mydb";
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
    // -------------------------------------------------------

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        const missingRequiredEnvs = envVars.filter(env => env.isRequired && !env.isGlobal && !env.value)
        if (missingRequiredEnvs.length > 0) {
            alert(`Por favor, preencha as variáveis obrigatórias: ${missingRequiredEnvs.map(e => e.key).join(", ")}`)
            setIsSubmitting(false)
            return
        }

        const finalEnvVars = envVars.filter((env) => env.key).map(({ key, value }) => ({ key, value }))
        const finalPorts = ports
            .filter((p) => p.privatePort && p.publicPort)
            .map((p) => ({
                privatePort: parseInt(p.privatePort, 10),
                publicPort: parseInt(p.publicPort, 10),
            }))
        const finalVolumes = volumes.filter((v) => v.name && v.containerPath).map(({ name, containerPath }) => ({ name, containerPath }))

        const selectedTemplate = imageTemplates.find(t => t.id === selectedImage);
        if (!selectedTemplate) {
            alert("Template de imagem selecionado não encontrado. Recarregue a página.");
            setIsSubmitting(false);
            return;
        }
        const imageName = selectedTemplate.image;

        try {
            const payload = {
                name,
                image: imageName,
                instanceId: selectedInstance,
                envVariables: finalEnvVars.length > 0 ? finalEnvVars : undefined,
                ports: finalPorts.length > 0 ? finalPorts : undefined,
                volumes: finalVolumes.length > 0 ? finalVolumes : undefined,
                network: network.name.trim() ? { ...network, ip: network.ip || undefined } : undefined,
            }

            await apiClient.createContainer(payload)
            toast.success("Container criado com sucesso!")
            onContainerCreated()
            onOpenChange(false)
        } catch (error) {
            toast.error("Falha ao criar container.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const renderDynamicInputs = (
        items: (FormPortMap | FormVolumeMap)[],
        onChange: (id: string, field: any, value: string) => void,
        onRemove: (id: string) => void,
        fields: { name: string; placeholder: string }[]
    ) => {
        return items.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
                {fields.map((field) => (
                    <Input
                        key={field.name}
                        type={field.name.includes("Port") ? "number" : "text"}
                        placeholder={field.placeholder}
                        value={item[field.name as keyof typeof item]}
                        onChange={(e) => onChange(item.id, field.name, e.target.value)}
                        disabled={isSubmitting}
                        className="flex-1"
                    />
                ))}
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(item.id)}
                    disabled={isSubmitting || items.length === 1}
                    className="text-destructive hover:text-destructive"
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>
        ))
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Criar Novo Container</DialogTitle>
                    <DialogDescription>
                        Configure os detalhes para a implantação de um novo container.
                    </DialogDescription>
                </DialogHeader>

                {isLoadingData ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                        <div className="overflow-y-auto px-1 py-4">
                            <Tabs defaultValue="general" className="space-y-4">
                                <TabsList className="grid grid-cols-5 w-full">
                                    <TabsTrigger value="general">Geral</TabsTrigger>
                                    <TabsTrigger value="environment">Ambiente</TabsTrigger>
                                    <TabsTrigger value="ports">Portas</TabsTrigger>
                                    <TabsTrigger value="volumes">Volumes</TabsTrigger>
                                    <TabsTrigger value="network">Rede</TabsTrigger>
                                </TabsList>

                                <TabsContent value="general" className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Nome do Container</label>
                                        <Input
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Ex: gpon-core-prod"
                                            disabled={isSubmitting}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Template da Imagem</label>
                                        <Select
                                            value={selectedImage}
                                            onValueChange={setSelectedImage}
                                            required
                                            disabled={isSubmitting}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione um template de imagem..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {imageTemplates.map((template) => (
                                                    <SelectItem key={template.id} value={template.id}>
                                                        {template.name} ({template.image})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Instância GPON</label>
                                        <Select
                                            value={selectedInstance}
                                            onValueChange={setSelectedInstance}
                                            required
                                            disabled={isSubmitting}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione a instância GPON..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {gponInstances.map((instance) => (
                                                    <SelectItem key={instance.id} value={instance.id}>
                                                        {instance.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </TabsContent>

                                <TabsContent value="environment" className="space-y-4">
                                    {!selectedImage ? (
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                            Selecione um Template de Imagem na aba 'Geral' para ver as variáveis de ambiente.
                                        </p>
                                    ) : (
                                        <>
                                            {/* 4. Interface de Visualização (Inserida Aqui) */}
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
                                            {/* -------------------------------------------- */}

                                            {envVars.length === 0 ? (
                                                <p className="text-sm text-muted-foreground text-center py-4">
                                                    Este template de imagem não possui variáveis de ambiente predefinidas.
                                                </p>
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
                                                            type="text"
                                                            placeholder={env.isGlobal ? "Valor global (não editável)" : "Valor"}
                                                            value={env.value}
                                                            onChange={(e) => handleEnvChange(env.id, e.target.value)}
                                                            disabled={isSubmitting || env.isGlobal || env.key === "CONTAINER_NAME"}
                                                            required={env.isRequired && !env.isGlobal}
                                                            className="flex-1 read-only:bg-secondary/50 read-only:opacity-70"
                                                        />
                                                    </div>
                                                ))
                                            )}
                                        </>
                                    )}
                                </TabsContent>

                                <TabsContent value="ports" className="space-y-3">
                                    {renderDynamicInputs(
                                        ports,
                                        handlePortChange as any,
                                        removePort,
                                        [
                                            { name: "publicPort", placeholder: "Porta Pública (Host)" },
                                            { name: "privatePort", placeholder: "Porta Privada (Container)" },
                                        ]
                                    )}
                                    <Button type="button" variant="outline" size="sm" onClick={addPort} disabled={isSubmitting}>
                                        Adicionar Porta
                                    </Button>
                                </TabsContent>

                                <TabsContent value="volumes" className="space-y-3">
                                    {renderDynamicInputs(
                                        volumes,
                                        handleVolumeChange as any,
                                        removeVolume,
                                        [
                                            { name: "name", placeholder: "Nome do Volume (Host)" },
                                            { name: "containerPath", placeholder: "Caminho no Container" },
                                        ]
                                    )}
                                    <Button type="button" variant="outline" size="sm" onClick={addVolume} disabled={isSubmitting}>
                                        Adicionar Volume
                                    </Button>
                                </TabsContent>

                                <TabsContent value="network" className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Nome da Rede (Opcional)</label>
                                        <Input
                                            value={network.name}
                                            onChange={(e) => setNetwork(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="Ex: gpon-net (padrão: bridge se vazio)"
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Endereço IP (Opcional)</label>
                                        <Input
                                            value={network.ip}
                                            onChange={(e) => setNetwork(prev => ({ ...prev, ip: e.target.value }))}
                                            placeholder="Ex: 172.17.0.5"
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>

                        <div className="mt-auto pt-6 border-t border-border">
                            <Button type="submit" className="w-full" disabled={isSubmitting || isLoadingData || !name || !selectedImage || !selectedInstance}>
                                {isSubmitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    "Criar Container"
                                )}
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}