
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserPlus } from "lucide-react";
import { addAssociate } from "@/app/admin/dashboard/associates/actions";

export function AddAssociateModal({ onAssociateAdded }: { onAssociateAdded: () => void }) {
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const result = await addAssociate(formData);

    setIsPending(false);

    if (result?.error) {
      setError(result.error);
    } else {
      setIsModalOpen(false); // Close modal on success
      onAssociateAdded(); // Refresh the associates list
      formRef.current?.reset(); // Reset form
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Adicionar Associado
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Associado</DialogTitle>
          <DialogDescription>
            Preencha os dados para adicionar um novo associado. A senha será enviada para o email informado.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <Input id="nome" name="nome" placeholder="Nome completo do associado" required />
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
                <Input id="codtipo" name="codtipo" placeholder="Código do Tipo" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="chapa">Chapa</Label>
                <Input id="chapa" name="chapa" placeholder="Número da Chapa" required />
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
                <Input id="telefone1" name="telefone1" placeholder="(XX) XXXXX-XXXX" required />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="email@associado.com" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha Provisória</Label>
              <Input id="password" name="password" type="text" placeholder="Asfus@ + 6 primeiros digitos do CPF" readOnly className="bg-muted" />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Salvar Associado
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
