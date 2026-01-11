"use client";

import * as React from "react";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import { Download, Loader2, Shield, User, Clock, Target, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type AuditLog = {
    id: string;
    action: string;
    admin_id: string;
    target: string;
    details: any;
    created_at: string;
    profiles?: {
        nome_completo: string;
        email: string;
    }
};

export default function AuditPage() {
    const [logs, setLogs] = React.useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    const fetchLogs = React.useCallback(async () => {
        setIsLoading(true);
        // Assuming 'profiles' relation exists on admin_id
        const { data, error } = await supabase
            .from('audit_logs')
            .select(`
                *,
                profiles:admin_id (nome_completo, email)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error);
            // alert("Erro ao buscar logs de auditoria."); // Suppress alert for cleaner UX
        } else {
            setLogs(data as any);
        }
        setIsLoading(false);
    }, []);

    React.useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleExport = () => {
        const dataToExport = logs.map(log => ({
            "Data/Hora": format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss"),
            "Ação": log.action,
            "Admin": log.profiles?.nome_completo || log.admin_id,
            "Alvo": log.target,
            "Detalhes": JSON.stringify(log.details || {})
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Auditoria");
        XLSX.writeFile(workbook, `relatorio_auditoria_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    };

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between px-0 pt-0 pb-6 gap-4">
                <div>
                    <CardTitle className="flex items-center gap-2 text-2xl font-bold text-slate-800">
                        <Shield className="w-6 h-6 text-blue-600" /> Auditoria do Sistema
                    </CardTitle>
                    <CardDescription className="text-slate-500 mt-1">
                        Registro de ações críticas realizadas por administradores.
                    </CardDescription>
                </div>
                <Button onClick={handleExport} disabled={logs.length === 0} variant="outline" className="w-full md:w-auto">
                    <Download className="mr-2 h-4 w-4" />
                    Exportar XLSX
                </Button>
            </CardHeader>
            <CardContent className="p-0">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
                ) : (
                    <>
                        {/* Mobile View: Cards */}
                        <div className="md:hidden space-y-4">
                            {logs.length > 0 ? (
                                logs.map((log) => (
                                    <div key={log.id} className="bg-white p-4 rounded-lg border shadow-sm space-y-3">
                                        <div className="flex justify-between items-start">
                                            <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200">
                                                {log.action}
                                            </Badge>
                                            <div className="flex items-center text-xs text-muted-foreground">
                                                <Clock className="w-3 h-3 mr-1" />
                                                {format(new Date(log.created_at), "dd/MM HH:mm")}
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                                                <User className="w-4 h-4 text-slate-400" />
                                                {log.profiles?.nome_completo || 'Admin Desconhecido'}
                                            </div>
                                            <div className="flex items-start gap-2 text-sm text-slate-600 break-all">
                                                <Target className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                                {log.target}
                                            </div>
                                        </div>

                                        {log.details && Object.keys(log.details).length > 0 && (
                                            <div className="bg-slate-50 p-2 rounded text-xs font-mono text-slate-600 overflow-x-auto">
                                                <div className="flex items-center gap-1 mb-1 text-slate-400 font-sans font-bold uppercase tracking-wider text-[10px]">
                                                    <Info className="w-3 h-3" /> Detalhes
                                                </div>
                                                {JSON.stringify(log.details)}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center p-8 text-muted-foreground bg-slate-50 rounded-lg border">
                                    Nenhum registro encontrado.
                                </div>
                            )}
                        </div>

                        {/* Desktop View: Table */}
                        <div className="hidden md:block rounded-md border bg-white shadow-sm overflow-hidden">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead className="w-[140px]">Data</TableHead>
                                        <TableHead>Ação</TableHead>
                                        <TableHead>Admin</TableHead>
                                        <TableHead>Alvo</TableHead>
                                        <TableHead>Detalhes</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.length > 0 ? (
                                        logs.map((log) => (
                                            <TableRow key={log.id} className="hover:bg-slate-50/50">
                                                <TableCell className="text-xs text-muted-foreground whitespace-nowrap font-mono">
                                                    {format(new Date(log.created_at), "dd/MM/yy HH:mm")}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    <Badge variant="outline" className="whitespace-nowrap bg-blue-50 text-blue-700 border-blue-200">
                                                        {log.action}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-slate-700">{log.profiles?.nome_completo}</span>
                                                        <span className="text-xs text-muted-foreground">{log.profiles?.email}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-slate-600 max-w-[200px] truncate" title={log.target}>
                                                    {log.target}
                                                </TableCell>
                                                <TableCell className="text-xs font-mono text-muted-foreground max-w-[250px] truncate" title={JSON.stringify(log.details)}>
                                                    {JSON.stringify(log.details)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">
                                                Nenhum registro encontrado.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
