"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
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
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
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
      setIsLoading(false);
      setError(authError?.message || "An unknown error occurred.");
      return;
    }

    // 2. Verifica a role e o status do usuário
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", authData.user.id)
      .single();
    
    if (profileError || !profile) {
        await supabase.auth.signOut();
        setIsLoading(false);
        setError("Erro ao verificar permissões.");
        return;
    }
    
    // 3. Verifica se o cadastro está ativo
    if (profile.status !== 'ativo') {
        await supabase.auth.signOut();
        setIsLoading(false);
        setError("Seu cadastro ainda está pendente de aprovação.");
        return;
    }

    // 4. Redireciona com base na role
    if (profile.role === 'admin') {
      router.push('/admin/dashboard');
    } else {
      router.push('/dashboard'); // Redireciona para o dashboard do associado
    }
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Acesso ao Portal</CardTitle>
          <CardDescription>
            Entre com seu email e senha para continuar.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="m@exemplo.com" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col">
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Entrar
            </Button>
            <div className="mt-4 text-center text-sm">
              <Link
                href="#"
                className="underline underline-offset-4 hover:text-primary"
              >
                Esqueci minha senha
              </Link>
            </div>
          </CardFooter>
        </form>
        <div className="mb-4 text-center text-sm">
            Ainda não é associado?{" "}
            <Link href="/register" className="underline underline-offset-4 hover:text-primary">
                Cadastre-se
            </Link>
        </div>
      </Card>
    </div>
  );
}