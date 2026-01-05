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
import { Loader2, Trash2 } from "lucide-react";
import { submitRegistration } from "./actions";

export default function RegisterPage() {
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState(false);

    // Dynamic Dependents State
    type Dependent = {
        nome: string;
        sexo: string;
        parentesco: string;
        dt_nasc: string;
    };
    const [dependents, setDependents] = React.useState<Dependent[]>([]);

    const addDependent = () => {
        setDependents([...dependents, { nome: '', sexo: '', parentesco: '', dt_nasc: '' }]);
    };

    const removeDependent = (index: number) => {
        const newDeps = [...dependents];
        newDeps.splice(index, 1);
        setDependents(newDeps);
    };

    const updateDependent = (index: number, field: keyof Dependent, value: string) => {
        const newDeps = [...dependents];
        newDeps[index] = { ...newDeps[index], [field]: value };
        setDependents(newDeps);
    };

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(event.currentTarget);

        // Server Action
        const result = await submitRegistration(formData);

        setIsLoading(false);

        if (result?.error) {
            setError(result.error);
        } else {
            setSuccess(true);
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-2xl">Solicitação Enviada!</CardTitle>
                        <CardDescription>
                            Seu cadastro foi recebido com sucesso e está em análise.
                            <br /><br />
                            Você receberá um email quando sua conta for aprovada. Após a aprovação, acesse o &quot;Primeiro Acesso&quot; para definir sua senha.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-center">
                        <Link href="/">
                            <Button>Voltar para o Início</Button>
                        </Link>
                    </CardFooter>
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
                        Preencha os dados abaixo. Seus dados serão enviados para análise da diretoria.
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

                        <div className="space-y-4 border-t pt-4">
                            <div className="flex justify-between items-center">
                                <Label className="text-lg font-semibold">Dependentes</Label>
                                <Button type="button" variant="outline" size="sm" onClick={addDependent}>
                                    + Adicionar
                                </Button>
                            </div>

                            {dependents.map((dep, index) => (
                                <div key={index} className="grid gap-4 p-4 border rounded-md bg-slate-50 dark:bg-slate-900 relative">
                                    <div className="absolute top-2 right-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-red-500 hover:text-red-700"
                                            onClick={() => removeDependent(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Nome do Dependente</Label>
                                        <Input
                                            value={dep.nome}
                                            onChange={(e) => updateDependent(index, 'nome', e.target.value)}
                                            placeholder="Nome completo"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>Sexo</Label>
                                            <select
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                                value={dep.sexo}
                                                onChange={(e) => updateDependent(index, 'sexo', e.target.value)}
                                                required
                                            >
                                                <option value="">Selecione</option>
                                                <option value="Masculino">Masculino</option>
                                                <option value="Feminino">Feminino</option>
                                                <option value="Outro">Outro</option>
                                            </select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Parentesco</Label>
                                            <select
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                                value={dep.parentesco}
                                                onChange={(e) => updateDependent(index, 'parentesco', e.target.value)}
                                                required
                                            >
                                                <option value="">Selecione</option>
                                                <option value="Filho(a)">Filho(a)</option>
                                                <option value="Cônjuge">Cônjuge</option>
                                                <option value="Pai/Mãe">Pai/Mãe</option>
                                                <option value="Outro">Outro</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Data de Nascimento</Label>
                                        <Input
                                            type="date"
                                            value={dep.dt_nasc}
                                            onChange={(e) => updateDependent(index, 'dt_nasc', e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            ))}
                            {dependents.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center italic">
                                    Nenhum dependente adicionado.
                                </p>
                            )}
                            <input type="hidden" name="dependentes_json" value={JSON.stringify(dependents)} />
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