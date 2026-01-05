"use client";

import * as React from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createAdminUser, type FormState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Salvar Administrador
    </Button>
  );
}

import { useRouter } from 'next/navigation';

export function CreateAdminForm() {
  const router = useRouter(); // Initialize router
  const formRef = React.useRef<HTMLFormElement>(null);
  const initialState: FormState = { message: "", type: "error" };
  const [state, formAction] = useFormState(createAdminUser, initialState);

  React.useEffect(() => {
    if (state?.type === 'success') {
      formRef.current?.reset();
      router.refresh(); // Refresh the page/data
    }
  }, [state, router]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Nome Completo</Label>
        <Input id="name" name="name" placeholder="Nome completo do administrador" required />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="cpf">CPF</Label>
          <Input id="cpf" name="cpf" placeholder="000.000.000-00" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="dt_nasc">Data de Nascimento</Label>
          <Input id="dt_nasc" name="dt_nasc" type="date" required />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="codtipo">Código do Tipo</Label>
          <Input id="codtipo" name="codtipo" placeholder="Código do Tipo" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="chapa">Chapa</Label>
          <Input id="chapa" name="chapa" placeholder="Número da Chapa" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="sexo">Sexo</Label>
          <select id="sexo" name="sexo" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
            <option value="">Selecione</option>
            <option value="Masculino">Masculino</option>
            <option value="Feminino">Feminino</option>
            <option value="Outro">Outro</option>
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="telefone1">Telefone</Label>
          <Input id="telefone1" name="telefone1" placeholder="(XX) XXXXX-XXXX" />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="email@admin.com" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Senha Provisória</Label>
        <Input id="password" name="password" type="password" required minLength={8} />
      </div>

      <SubmitButton />

      {state?.message && (
        <p className={`mt-2 text-sm ${state.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}