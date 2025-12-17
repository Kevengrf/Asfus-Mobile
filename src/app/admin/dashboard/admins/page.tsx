"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { inviteAdmin, getAdmins, updateAdminStatus, deleteAdmin } from './actions';
import { Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type Admin = {
    id: string;
    email: string | undefined;
    status: 'ativo' | 'pendente' | undefined;
    created_at: string;
}

export default function AdminsPage() {
  const [isPending, setIsPending] = useState(false);
  const [state, setState] = useState<{error?: string, message?: string} | null>(null);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);

  async function loadAdmins() {
    setLoadingAdmins(true);
    const adminsData = await getAdmins();
    // @ts-ignore
    setAdmins(adminsData);
    setLoadingAdmins(false);
  }

  useEffect(() => {
    loadAdmins();
  }, []);
  
  const handleInvite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);
    setState(null);
    const formData = new FormData(event.currentTarget);
    // @ts-ignore
    const result = await inviteAdmin(null, formData);
    setState(result);
    setIsPending(false);
    if(result.message){
        loadAdmins();
        (event.target as HTMLFormElement).reset();
    }
  }

  useEffect(() => {
    if (state?.message) {
      loadAdmins();
    }
  }, [state]);

  async function handleStatusUpdate(id: string, status: 'ativo' | 'pendente') {
    await updateAdminStatus(id, status);
    loadAdmins();
  }

  async function handleDelete(id: string) {
    if (confirm('Tem certeza que deseja remover este administrador?')) {
        await deleteAdmin(id);
        loadAdmins();
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gerenciar Administradores</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Convidar Novo Administrador</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row items-start gap-4">
            <div className="w-full sm:w-auto flex-grow grid gap-2">
              <Label htmlFor="email">Email do Novo Administrador</Label>
              <Input id="email" name="email" type="email" placeholder="email@exemplo.com" required/>
            </div>
            <Button type="submit" disabled={isPending} className="self-end">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Convite
            </Button>
          </form>
          {state?.error && <p className="text-sm text-red-500 mt-2">{state.error}</p>}
          {state?.message && <p className="text-sm text-green-500 mt-2">{state.message}</p>}
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Administradores</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingAdmins ? <Loader2 className="mx-auto h-8 w-8 animate-spin" /> :
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {admins.map((admin) => (
                        <TableRow key={admin.id}>
                            <TableCell>{admin.email}</TableCell>
                            <TableCell>
                                <Badge variant={admin.status === 'ativo' ? 'default' : 'secondary'}>
                                    {admin.status === 'ativo' ? 'Ativo' : 'Pendente'}
                                </Badge>
                            </TableCell>
                            <TableCell className="space-x-2">
                                {admin.status === 'pendente' && (
                                    <>
                                        <Button size="sm" onClick={() => handleStatusUpdate(admin.id, 'ativo')}>Aprovar</Button>
                                        <Button size="sm" variant="destructive" onClick={() => handleDelete(admin.id)}>Rejeitar</Button>
                                    </>
                                )}
                                {admin.status === 'ativo' && (
                                    <Button size="sm" variant="destructive" onClick={() => handleDelete(admin.id)}>Remover</Button>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          }
        </CardContent>
      </Card>
    </div>
  );
}
