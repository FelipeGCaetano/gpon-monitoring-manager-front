"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp"
import { apiClient } from "@/lib/api-client"
import { Activity, ArrowLeft, CheckCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"

type RecoveryStep = "request" | "validate" | "success"

export default function ForgotPasswordPage() {
    const [step, setStep] = useState<RecoveryStep>("request")
    const [email, setEmail] = useState("")
    const [code, setCode] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    // --- Etapa 1: Pedir o e-mail ---
    const handleSubmitEmail = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)
        try {
            await apiClient.requestPasswordRecovery(email)
            toast.success("Código de recuperação enviado para o seu e-mail.")
            setStep("validate") // Avança para a próxima etapa
        } catch (err: any) {
            console.error(err)
            toast.error(err.message || "E-mail não encontrado ou falha ao enviar.")
            setError(err.message || "E-mail não encontrado.")
        } finally {
            setIsLoading(false)
        }
    }

    // --- Etapa 2: Validar o código e a nova senha ---
    const handleSubmitCode = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (password !== confirmPassword) {
            setError("As senhas não conferem.")
            return
        }

        if (code.length < 6) {
            setError("O código deve ter 6 dígitos.")
            return
        }

        setIsLoading(true)
        try {
            await apiClient.validateRecoveryCode({
                email,
                code,
                password,
            })
            toast.success("Senha alterada com sucesso!")
            setStep("success") // Avança para a etapa final
        } catch (err: any) {
            console.error(err)
            toast.error(err.message || "Código inválido ou expirado.")
            setError(err.message || "Código inválido ou expirado.")
        } finally {
            setIsLoading(false)
        }
    }

    // --- Renderização ---
    return (
        <div className="min-h-screen bg-gradient-to-br from-sidebar via-background to-sidebar flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-4 text-center">
                    <div className="flex justify-center">
                        <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                            <Activity className="w-8 h-8 text-primary-foreground" />
                        </div>
                    </div>
                    <div>
                        <CardTitle className="text-2xl">Recuperar Senha</CardTitle>
                    </div>
                </CardHeader>

                <CardContent>
                    {/* ETAPA 1: PEDIR E-MAIL */}
                    {step === "request" && (
                        <>
                            <CardDescription className="text-center mb-4">
                                Digite seu e-mail para enviarmos um código de recuperação.
                            </CardDescription>
                            <form onSubmit={handleSubmitEmail} className="space-y-4">
                                {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">{error}</div>}
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium text-foreground">
                                        Email
                                    </label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="seu@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar Código"}
                                </Button>
                            </form>
                        </>
                    )}

                    {/* ETAPA 2: VALIDAR CÓDIGO E NOVA SENHA */}
                    {step === "validate" && (
                        <>
                            <CardDescription className="text-center mb-4">
                                Digite o código de 6 dígitos enviado para <strong>{email}</strong> e sua nova senha.
                            </CardDescription>
                            <form onSubmit={handleSubmitCode} className="space-y-4">
                                {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">{error}</div>}

                                <div className="space-y-2 flex flex-col items-center">
                                    <label htmlFor="code" className="text-sm font-medium text-foreground">
                                        Código de Verificação
                                    </label>
                                    <InputOTP
                                        id="code"
                                        maxLength={6}
                                        value={code}
                                        onChange={(value) => setCode(value)}
                                        disabled={isLoading}
                                    >
                                        <InputOTPGroup>
                                            <InputOTPSlot index={0} />
                                            <InputOTPSlot index={1} />
                                            <InputOTPSlot index={2} />
                                            <InputOTPSlot index={3} />
                                            <InputOTPSlot index={4} />
                                            <InputOTPSlot index={5} />
                                        </InputOTPGroup>
                                    </InputOTP>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="password" className="text-sm font-medium text-foreground">
                                        Nova Senha
                                    </label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                                        Confirmar Nova Senha
                                    </label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>

                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Redefinir Senha"}
                                </Button>
                            </form>
                        </>
                    )}

                    {/* ETAPA 3: SUCESSO */}
                    {step === "success" && (
                        <div className="flex flex-col items-center text-center space-y-4">
                            <CheckCircle className="w-16 h-16 text-green-500" />
                            <p className="text-muted-foreground">
                                Sua senha foi alterada com sucesso!
                            </p>
                            <Button asChild className="w-full">
                                <Link href="/login">
                                    Voltar para o Login
                                </Link>
                            </Button>
                        </div>
                    )}

                    {/* Link para Voltar */}
                    {step !== "success" && (
                        <div className="text-center mt-4">
                            <Button variant="link" asChild>
                                <Link href="/login">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Voltar para o Login
                                </Link>
                            </Button>
                        </div>
                    )}

                </CardContent>
            </Card>
        </div>
    )
}