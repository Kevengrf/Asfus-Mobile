'use client'

import { useState } from "react";
import { checkCpf, activateAccount } from "./actions";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button className="w-full" type="submit" disabled={pending} variant="success">
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Ativar Conta
        </Button>
    )
}

const initialState = {
    error: "",
    success: false
}

export default function FirstAccessPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [cpf, setCpf] = useState("");
    const [profileData, setProfileData] = useState<{ name: string, email: string } | null>(null);
    const [isLoadingCheck, setIsLoadingCheck] = useState(false);
    const [checkError, setCheckError] = useState("");

    const [state, formAction] = useFormState(activateAccount, initialState);

    async function handleCheckCpf(e: React.FormEvent) {
        e.preventDefault();
        setIsLoadingCheck(true);
        setCheckError("");

        const res = await checkCpf(cpf);
        setIsLoadingCheck(false);

        if (res.error) {
            setCheckError(res.error);
        } else if (res.success) {
            setProfileData({ name: res.name || "", email: res.email || "" });
            setStep(2);
        }
    }

    if (state?.success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle className="text-2xl text-green-600">Conta Ativada!</CardTitle>
                        <CardDescription>
                            Sua conta foi ativada com sucesso. Agora você pode acessar o sistema.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-center">
                        <Link href="/login">
                            <Button variant="default">Ir para o Login</Button>
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="flex items-center mb-2">
                        <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 flex items-center">
                            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
                        </Link>
                    </div>
                    <CardTitle className="text-2xl">Primeiro Acesso</CardTitle>
                    <CardDescription>
                        {step === 1
                            ? "Identifique-se para ativar sua conta."
                            : `Olá, ${profileData?.name}. Defina sua senha.`
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {step === 1 && (
                        <form onSubmit={handleCheckCpf} className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="cpf">Informe seu CPF</Label>
                                <Input
                                    id="cpf"
                                    placeholder="000.000.000-00"
                                    value={cpf}
                                    onChange={(e) => setCpf(e.target.value)}
                                    required
                                />
                            </div>
                            {checkError && <p className="text-sm text-red-500">{checkError}</p>}
                            <Button className="w-full" type="submit" disabled={isLoadingCheck}>
                                {isLoadingCheck && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Verificar
                            </Button>
                        </form>
                    )}

                    {step === 2 && (
                        <form action={formAction} className="grid gap-4">
                            <input type="hidden" name="cpf" value={cpf} />

                            <div className="grid gap-2">
                                <Label htmlFor="email">Confirme seu Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    defaultValue={profileData?.email}
                                    required
                                />
                                <p className="text-xs text-muted-foreground">Este email será usado para login e comunicações.</p>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">Crie sua Senha</Label>
                                <Input id="password" name="password" type="password" required minLength={6} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="confirmPassword">Confirme a Senha</Label>
                                <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={6} />
                            </div>

                            {state?.error && <p className="text-sm text-red-500">{state.error}</p>}

                            <SubmitButton />
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
