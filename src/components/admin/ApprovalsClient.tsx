"use client";

import { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X } from "lucide-react";
import { approveAssociate, rejectAssociate } from '@/app/admin/dashboard/associates/actions';
import { useRouter } from 'next/navigation';

type Profile = {
    id: string;
    nome_completo: string;
    email: string;
    cpf: string | null;
    telefone: string | null;
    status: 'ativo' | 'pendente' | 'rejeitado';
};

interface ApprovalsClientProps {
    pendingProfiles: Profile[];
}

export function ApprovalsClient({ pendingProfiles }: ApprovalsClientProps) {
    const [profiles, setProfiles] = useState(pendingProfiles);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const router = useRouter();

    const handleApprove = async (id: string) => {
        setProcessingId(id);
        await approveAssociate(id);
        setProfiles(prev => prev.filter(p => p.id !== id));
        setProcessingId(null);
        router.refresh();
    };

    const handleReject = async (id: string) => {
        if (!confirm('Tem certeza que deseja rejeitar este associado?')) return;
        setProcessingId(id);
        await rejectAssociate(id);
        setProfiles(prev => prev.filter(p => p.id !== id));
        setProcessingId(null);
        router.refresh();
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Solicitações Pendentes</h1>
                <p className="text-muted-foreground">Aprove ou rejeite novas solicitações de cadastro.</p>
            </div>

            <div className="border rounded-lg overflow-x-auto">
                {profiles.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        Nenhuma solicitação pendente no momento.
                    </div>
                ) : (
                    <Table className="min-w-max">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>CPF</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {profiles.map((profile) => (
                                <TableRow key={profile.id}>
                                    <TableCell className="font-medium">{profile.nome_completo}</TableCell>
                                    <TableCell>{profile.email}</TableCell>
                                    <TableCell>{profile.cpf || 'N/A'}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">
                                            {profile.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700"
                                                onClick={() => handleApprove(profile.id)}
                                                disabled={processingId === profile.id}
                                            >
                                                {processingId === profile.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                                                Aprovar
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleReject(profile.id)}
                                                disabled={processingId === profile.id}
                                            >
                                                {processingId === profile.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 mr-1" />}
                                                Rejeitar
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>
        </div>
    );
}
