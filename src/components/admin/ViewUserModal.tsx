"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

type Dependent = {
    nome: string;
    sexo: string;
    parentesco: string;
    dt_nasc: string;
};

type Profile = {
    id: string;
    nome_completo: string;
    email: string;
    cpf: string | null;
    telefone: string | null;
    matricula: string | null;
    status: 'ativo' | 'pendente' | 'rejeitado';
    role: 'admin' | 'user';
    codtipo: string | null;
    chapa: string | null;
    dt_nasc: string | null;
    sexo: string | null;
    dependentes: Dependent[] | null;
};

interface ViewUserModalProps {
    user: Profile | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ViewUserModal({ user, open, onOpenChange }: ViewUserModalProps) {
    if (!user) return null;

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "N/A";
        try {
            return format(new Date(dateString), "dd/MM/yyyy");
        } catch (e) {
            return dateString;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Detalhes do Associado</DialogTitle>
                    <DialogDescription>Informações completas do cadastro.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Main Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-4">
                        <div>
                            <span className="text-sm font-semibold text-muted-foreground block">Nome Completo</span>
                            <span className="text-lg font-medium">{user.nome_completo}</span>
                        </div>
                        <div>
                            <span className="text-sm font-semibold text-muted-foreground block">Email</span>
                            <span>{user.email}</span>
                        </div>
                        <div>
                            <span className="text-sm font-semibold text-muted-foreground block">CPF</span>
                            <span>{user.cpf || "N/A"}</span>
                        </div>
                        <div>
                            <span className="text-sm font-semibold text-muted-foreground block">Telefone</span>
                            <span>{user.telefone || "N/A"}</span>
                        </div>
                        <div>
                            <span className="text-sm font-semibold text-muted-foreground block">Status</span>
                            <Badge variant={user.status === 'ativo' ? 'default' : (user.status === 'pendente' ? 'secondary' : 'destructive')}>
                                {user.status}
                            </Badge>
                        </div>
                        <div>
                            <span className="text-sm font-semibold text-muted-foreground block">Role</span>
                            <Badge variant="outline">{user.role}</Badge>
                        </div>
                    </div>

                    {/* Secondary Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-b pb-4">
                        <div>
                            <span className="text-sm font-semibold text-muted-foreground block">Matrícula</span>
                            <span>{user.matricula || "N/A"}</span>
                        </div>
                        <div>
                            <span className="text-sm font-semibold text-muted-foreground block">Chapa</span>
                            <span>{user.chapa || "N/A"}</span>
                        </div>
                        <div>
                            <span className="text-sm font-semibold text-muted-foreground block">Cód. Tipo</span>
                            <span>{user.codtipo || "N/A"}</span>
                        </div>
                        <div>
                            <span className="text-sm font-semibold text-muted-foreground block">Sexo</span>
                            <span>{user.sexo || "N/A"}</span>
                        </div>
                        <div>
                            <span className="text-sm font-semibold text-muted-foreground block">Data Nasc.</span>
                            <span>{formatDate(user.dt_nasc)}</span>
                        </div>
                    </div>

                    {/* Dependents */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                            Dependentes
                            {user.dependentes && user.dependentes.length > 0 && (
                                <Badge variant="secondary">{user.dependentes.length}</Badge>
                            )}
                        </h3>

                        {!user.dependentes || user.dependentes.length === 0 ? (
                            <div className="p-4 border rounded bg-slate-50 text-center text-muted-foreground">
                                Nenhum dependente cadastrado.
                            </div>
                        ) : (
                            <div className="border rounded-md overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-100 dark:bg-slate-800 text-muted-foreground font-medium">
                                        <tr>
                                            <th className="p-3">Nome</th>
                                            <th className="p-3">Parentesco</th>
                                            <th className="p-3">Data Nasc.</th>
                                            <th className="p-3">Sexo</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {user.dependentes.map((dep, idx) => (
                                            <tr key={idx} className="bg-white dark:bg-slate-950">
                                                <td className="p-3 font-medium">{dep.nome}</td>
                                                <td className="p-3">{dep.parentesco}</td>
                                                <td className="p-3">{formatDate(dep.dt_nasc)}</td>
                                                <td className="p-3">{dep.sexo}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    );
}
