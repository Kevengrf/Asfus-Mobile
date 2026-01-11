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
import { Loader2, Shield } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function AdminLoginPage() {
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
      // Se não encontrar o perfil, desloga por segurança e mostra erro
      await supabase.auth.signOut();
      setIsLoading(false);
      setError("Erro ao verificar permissões.");
      return;
    }

    // 3. Se for admin, redireciona. Se não, desloga e avisa.
    if (profile.role === 'admin') {
      router.push('/admin/dashboard');
      router.refresh();
    } else {
      await supabase.auth.signOut();
      setIsLoading(false);
      setError("Você não tem permissão para acessar esta área.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/20 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]"></div>
      </div>

      <Card className="w-full max-w-sm bg-slate-900 border-slate-800 text-slate-100 shadow-2xl relative z-10">
        <CardHeader className="space-y-3 pb-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600/10 rounded-full flex items-center justify-center ring-1 ring-blue-500/50">
              <Shield className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center font-bold tracking-tight text-white">
            ASFUS <span className="text-blue-500">Admin</span>
          </CardTitle>
          <CardDescription className="text-center text-slate-400">
            Acesso restrito para administradores e diretoria.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-slate-300">Email Corporativo</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@asfus.com.br"
                required
                className="bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-600 focus-visible:ring-blue-500"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password" className="text-slate-300">Senha de Acesso</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-600 focus-visible:ring-blue-500"
              />
            </div>
            {error && <p className="text-sm text-red-400 bg-red-950/30 p-2 rounded text-center border border-red-900/50">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-2">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-5" type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                "Entrar no Sistema"
              )}
            </Button>

            <div className="w-full border-t border-slate-800 my-2"></div>

            <div className="text-center text-sm flex flex-col gap-3">
              <Link
                href="/login"
                className="text-slate-500 hover:text-blue-400 transition-colors"
              >
                Voltar para Login de Associado
              </Link>
              <Link
                href="/guarita/login"
                className="text-slate-500 hover:text-blue-400 transition-colors"
              >
                Acesso à Guarita
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>

      <div className="absolute bottom-6 text-center text-xs text-slate-600">
        &copy; {new Date().getFullYear()} ASFUS. Todos os direitos reservados.
      </div>
    </div>
  );
}