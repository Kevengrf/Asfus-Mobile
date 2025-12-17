
"use client";

import * as React from "react";
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { deleteAdmin } from '../../app/admin/actions'; 
import { Loader2, UserPlus } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreateAdminForm } from '@/components/admin/CreateAdminForm';

// A "Admin" type mais simples, pois os dados completos virão do Server Component
type Admin = {
    id: string;
    email: string | undefined;
    nome_completo: string | null;
    cpf: string | null;
    telefone: string | null;
    status: 'ativo' | 'pendente' | 'rejeitado' | undefined;
};

interface AdminsClientProps {
    initialAdmins: Admin[];
}

export function AdminsClient({ initialAdmins }: AdminsClientProps) {
  const [admins, setAdmins] = useState(initialAdmins);
  const [isLoading, setIsLoading] = useState(false);

  // A função de recarregar pode ser chamada após uma ação
  const refreshAdmins = async () => {
      // Para simplicidade, vamos apenas recarregar a página para obter novos dados do servidor
      window.location.reload();
  };

  async function handleDelete(id: string) {
    if (confirm('Tem certeza que deseja remover este administrador? Esta ação é irreversível.')) {
        setIsLoading(true);
        await deleteAdmin(id);
        // Após deletar, recarrega a página para pegar a lista atualizada do Server Component
        refreshAdmins();
        setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Gerenciar Administradores</h1>
            <Dialog>
                <DialogTrigger asChild>
                    <Button>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Criar Novo Admin
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Criar Novo Administrador</DialogTitle>
                        <DialogDescription>
                            Preencha os dados abaixo. O novo usuário terá permissões de administrador.
                        </DialogDescription>
                    </DialogHeader>
                    {/* O formulário agora vive por si só e revalida o path com a Server Action */}
                    <CreateAdminForm />
                </DialogContent>
            </Dialog>
        </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Lista de Administradores</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <Loader2 className="mx-auto h-8 w-8 animate-spin" /> :
            <div className="border rounded-lg overflow-x-auto">
                <Table className="min-w-max">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>CPF</TableHead>
                            <TableHead>Telefone</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {admins.map((admin) => (
                            <TableRow key={admin.id}>
                                <TableCell>{admin.nome_completo || 'N/A'}</TableCell>
                                <TableCell>{admin.email}</TableCell>
                                <TableCell>{admin.cpf || 'N/A'}</TableCell>
                                <TableCell>{admin.telefone || 'N/A'}</TableCell>
                                <TableCell>
                                    <Badge variant={admin.status === 'ativo' ? 'default' : 'secondary'}>
                                        {admin.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button size="sm" variant="destructive" onClick={() => handleDelete(admin.id)}>Remover</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
          }
        </CardContent>
      </Card>
    </div>
  );
}
