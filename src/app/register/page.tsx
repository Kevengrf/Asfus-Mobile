"use client";

import * as React from "react";
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
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client"; // Importamos nosso cliente

export default function RegisterPage() {
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        const form = event.currentTarget;
        const formData = new FormData(form);
        const nome_completo = formData.get("nome") as string; // Changed from full-name
        const cpf = formData.get("cpf") as string;
        const codtipo = formData.get("codtipo") as string;
        const chapa = formData.get("chapa") as string;
        const dt_nasc = formData.get("dt_nasc") as string;
        const sexo = formData.get("sexo") as string;
        const telefone1 = formData.get("telefone1") as string;
        const email = formData.get("email") as string;
        const nome_dependente = formData.get("nome_dependente") as string;
        const sexo_dependente = formData.get("sexo_dependente") as string;
        const grauparentesco_dependente = formData.get("grauparentesco_dependente") as string;
        const data_nascimento_dependente = formData.get("data_nascimento_dependente") as string;

        // Auto-generate password from CPF (first 5 digits)
        const cleanCpf = cpf.replace(/\D/g, '');
        let password = '1234567890'; // Fallback
        if (cleanCpf.length >= 6) {
            password = cleanCpf.substring(0, 6);
        } else {
            password = '123456';
        }

        // Usando o cliente Supabase para registrar
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                // Dados extras que a nossa função SQL vai usar
                data: {
                    nome_completo,
                    cpf,
                    codtipo,
                    chapa,
                    dt_nasc,
                    sexo,
                    telefone1,
                    nome_dependente,
                    sexo_dependente,
                    grauparentesco_dependente,
                    data_nascimento_dependente,
                }
            }
        });

        setIsLoading(false);

        if (error) {
            setError(error.message);
        } else {
            // Sucesso! O Supabase enviará um email de confirmação.
            setSuccess(true);
        }
    }

    // Se o cadastro foi bem-sucedido, mostramos uma mensagem de sucesso.
    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-2xl">Verifique seu Email</CardTitle>
                        <CardDescription>
                            Enviamos um link de confirmação para o seu email. Por favor, clique no link para ativar sua conta antes de prosseguir com a aprovação da diretoria.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-2 sm:p-4">
            <Card className="w-full max-w-xs sm:max-w-sm md:max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl">Solicitação de Cadastro</CardTitle>
                    <CardDescription>
                        Preencha os dados para solicitar sua associação.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="nome">Nome Completo</Label>
                            <Input id="nome" name="nome" placeholder="Seu nome completo" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="cpf">CPF</Label>
                            <Input id="cpf" name="cpf" placeholder="000.000.000-00" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="codtipo">Código do Tipo</Label>
                            <Input id="codtipo" name="codtipo" placeholder="Código do Tipo" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="chapa">Chapa</Label>
                            <Input id="chapa" name="chapa" placeholder="Número da Chapa" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="dt_nasc">Data de Nascimento</Label>
                            <Input id="dt_nasc" name="dt_nasc" type="date" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="sexo">Sexo</Label>
                            <select id="sexo" name="sexo" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" required>
                                <option value="">Selecione</option>
                                <option value="Masculino">Masculino</option>
                                <option value="Feminino">Feminino</option>
                                <option value="Outro">Outro</option>
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="telefone1">Telefone</Label>
                            <Input id="telefone1" name="telefone1" placeholder="(XX) XXXXX-XXXX" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" placeholder="m@exemplo.com" required />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="nome_dependente">Nome do Dependente</Label>
                            <Input id="nome_dependente" name="nome_dependente" placeholder="Nome completo do dependente" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="sexo_dependente">Sexo do Dependente</Label>
                            <select id="sexo_dependente" name="sexo_dependente" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                <option value="">Selecione</option>
                                <option value="Masculino">Masculino</option>
                                <option value="Feminino">Feminino</option>
                                <option value="Outro">Outro</option>
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="grauparentesco_dependente">Grau de Parentesco do Dependente</Label>
                            <select id="grauparentesco_dependente" name="grauparentesco_dependente" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                <option value="">Selecione</option>
                                <option value="Filho(a)">Filho(a)</option>
                                <option value="Cônjuge">Cônjuge</option>
                                <option value="Pai/Mãe">Pai/Mãe</option>
                                <option value="Outro">Outro</option>
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="data_nascimento_dependente">Data de Nascimento do Dependente</Label>
                            <Input id="data_nascimento_dependente" name="data_nascimento_dependente" type="date" />
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                    </CardContent>
                    <CardFooter className="flex flex-col items-center gap-4">
                        <Button className="w-full" type="submit" disabled={isLoading} variant="success">
                            {isLoading && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Enviar Solicitação
                        </Button>
                        <p className="text-xs text-center text-muted-foreground">
                            Seu cadastro passará pela aprovação da diretoria.
                        </p>
                    </CardFooter>
                </form>
                <div className="mb-4 text-center text-sm">
                    Já possui uma conta?{" "}
                    <Link href="/login" className="underline underline-offset-4 hover:text-primary">
                        Faça Login
                    </Link>
                </div>
            </Card>
        </div>
    );
}