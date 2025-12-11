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
      const nome_completo = formData.get("full-name") as string;
      const cpf = formData.get("cpf") as string;
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      const confirmPassword = formData.get("confirm-password") as string;

      if (password !== confirmPassword) {
        setError("As senhas não coincidem.");
        setIsLoading(false);
        return;
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
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Solicitação de Cadastro</CardTitle>
          <CardDescription>
            Preencha os dados para solicitar sua associação.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
            <CardContent className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="full-name">Nome Completo</Label>
                    <Input id="full-name" name="full-name" placeholder="Seu nome completo" required />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input id="cpf" name="cpf" placeholder="000.000.000-00" required />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="m@exemplo.com" required />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input id="password" name="password" type="password" required />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="confirm-password">Confirmar Senha</Label>
                    <Input id="confirm-password" name="confirm-password" type="password" required />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
            </CardContent>
            <CardFooter className="flex flex-col items-center gap-4">
                <Button className="w-full" type="submit" disabled={isLoading}>
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