"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function GuaritaLoginPage() {
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const router = useRouter();

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        const form = event.currentTarget;
        const formData = new FormData(form);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        // 1. Tenta fazer o login
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError || !authData.user) {
            // Tenta achar usuario pelo CPF caso tenha digitado cpf (opcional, mas portaria geralmente usa email fixo)
            // Por via das dúvidas, vamos manter simples: email/senha
            setIsLoading(false);
            setError("Email ou senha inválidos.");
            return;
        }

        // 2. Verifica a role do usuário no banco de dados
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", authData.user.id)
            .single();

        if (profileError || !profile) {
            await supabase.auth.signOut();
            setIsLoading(false);
            setError("Erro ao verificar permissões.");
            return;
        }

        // 3. Se for guarita (ou admin), redireciona.
        if (profile.role === 'guarita' || profile.role === 'admin') {
            router.push('/guarita');
            router.refresh();
        } else {
            await supabase.auth.signOut();
            setIsLoading(false);
            setError("Você não tem permissão para acessar a Guarita.");
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-2 sm:p-4">
            <Card className="w-full max-w-xs sm:max-w-sm border-t-4 border-t-orange-500 shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                        <ShieldCheck className="text-orange-500 w-8 h-8" />
                        Acesso Guarita
                    </CardTitle>
                    <CardDescription>
                        Área exclusiva para controle de portaria.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" placeholder="portaria@asfus.com.br" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Senha</Label>
                            <Input id="password" name="password" type="password" required />
                        </div>
                        {error && <p className="text-sm text-red-500 bg-red-50 p-2 rounded border border-red-200">{error}</p>}
                    </CardContent>
                    <CardFooter className="flex flex-col">
                        <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white" type="submit" disabled={isLoading}>
                            {isLoading && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Entrar na Guarita
                        </Button>
                        <div className="mt-4 text-center text-sm flex flex-col gap-2">
                            <Link
                                href="/login"
                                className="underline underline-offset-4 hover:text-primary"
                            >
                                Sou um Associado
                            </Link>
                            <Link
                                href="/admin/login"
                                className="underline underline-offset-4 hover:text-primary text-muted-foreground"
                            >
                                Acesso Administrativo
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
