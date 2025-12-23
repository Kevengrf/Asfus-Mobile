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
import { deleteAdmin, demoteAdmin } from '../../app/admin/actions';
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

    const refreshAdmins = async () => {
        window.location.reload();
    };

    async function handleDelete(id: string) {
        if (confirm('ATENÇÃO: Você deseja remover as permissões de administrador deste usuário?\n\nEle CONTINUARÁ na lista de associados como um usuário comum ("user") e terá acesso normal ao aplicativo.')) {
            setIsLoading(true);
            const result = await demoteAdmin(id);
            if (result.error) {
                alert(result.error);
            } else {
                // Sucesso
            }
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
                    {isLoading ? (
                        <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                    ) : (
                        <>
                            {/* Mobile View: Cards */}
                            <div className="grid grid-cols-1 gap-4 md:hidden">
                                {admins.map((admin) => (
                                    <Card key={admin.id} className="shadow-sm border">
                                        <CardHeader className="p-4 pb-2">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-base font-bold">{admin.nome_completo || 'N/A'}</CardTitle>
                                                    <p className="text-sm text-muted-foreground">{admin.email}</p>
                                                </div>
                                                <Badge variant={admin.status === 'ativo' ? 'default' : 'secondary'}>
                                                    {admin.status}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-2 text-sm space-y-2">
                                            <div className="grid grid-cols-2 gap-2 text-gray-600">
                                                <div><span className="font-semibold block">CPF:</span> {admin.cpf || 'N/A'}</div>
                                                <div><span className="font-semibold block">Telefone:</span> {admin.telefone || 'N/A'}</div>
                                            </div>
                                            <div className="pt-4 border-t mt-2 flex justify-end">
                                                <Button size="sm" variant="outline" className="text-red-500 border-red-200 hover:bg-red-50" onClick={() => handleDelete(admin.id)}>Rebaixar p/ Associado</Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {/* Desktop View: Table */}
                            <div className="hidden md:block border rounded-lg overflow-x-auto">
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
                                                    <Button size="sm" variant="outline" className="text-red-500 border-red-200 hover:bg-red-50" onClick={() => handleDelete(admin.id)}>Rebaixar p/ Associado</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
