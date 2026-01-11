
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
import { format } from "date-fns";

type BillingEntry = {
    user_id: string;
    nome_completo: string;
    email: string;
    cpf: string;
    appointments_count: number;
    total_guest_costs: number;
    total_fines: number;
    total_debt: number;
};

export default function BillingPage() {
    const [data, setData] = useState<BillingEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchBilling();
    }, []);

    const fetchBilling = async () => {
        setIsLoading(true);
        // Use the View created by SQL
        const { data: billingData, error } = await supabase
            .from('billing_summary')
            .select('*')
            .gt('total_debt', 0) // Show only who owes money? Or everyone? Assuming debts.
            .order('total_debt', { ascending: false });

        if (error) {
            console.error("Error fetching billing:", error);
            // Fallback or empty if view doesn't exist yet
        }

        setData(billingData as BillingEntry[] || []);
        setIsLoading(false);
    };

    const handleExport = () => {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Cobrança");
        XLSX.writeFile(wb, `cobranca_asfus_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    };

    return (
        <Card>
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <CardTitle>Central de Cobrança</CardTitle>
                    <CardDescription>Resumo de débitos por associado (Convidados + Multas).</CardDescription>
                </div>
                <Button onClick={handleExport} disabled={data.length === 0} className="bg-green-600 hover:bg-green-700">
                    <Download className="mr-2 h-4 w-4" />
                    Exportar XLSX
                </Button>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                ) : (
                    <>
                        {/* Mobile View - Cards */}
                        <div className="md:hidden space-y-4">
                            {data.length > 0 ? (
                                data.map((row) => (
                                    <div key={row.user_id} className="border rounded-lg p-4 space-y-3 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-bold text-lg dark:text-white">{row.nome_completo}</div>
                                                <div className="text-sm text-muted-foreground">{row.email}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs font-mono text-slate-500">{row.cpf}</div>
                                                <div className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded mt-1 inline-block">
                                                    {row.appointments_count} agend.
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 py-2 border-t border-b border-slate-100 dark:border-slate-800">
                                            <div>
                                                <div className="text-xs text-muted-foreground uppercase">Convidados</div>
                                                <div className="font-medium">R$ {row.total_guest_costs?.toFixed(2)}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-muted-foreground uppercase">Multas</div>
                                                <div className="font-medium">R$ {row.total_fines?.toFixed(2)}</div>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center pt-1">
                                            <span className="font-bold text-slate-700 dark:text-slate-300">Total Devido</span>
                                            <span className="font-bold text-xl text-red-600">R$ {row.total_debt?.toFixed(2)}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center p-8 border rounded-lg border-dashed">
                                    Nenhum débito encontrado.
                                </div>
                            )}
                        </div>

                        {/* Desktop View - Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Associado</TableHead>
                                        <TableHead>CPF</TableHead>
                                        <TableHead className="text-center">Agendamentos</TableHead>
                                        <TableHead className="text-right">Taxas Convidados</TableHead>
                                        <TableHead className="text-right">Multas Pendentes</TableHead>
                                        <TableHead className="text-right font-bold text-red-600">Total Devido</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.length > 0 ? (
                                        data.map((row) => (
                                            <TableRow key={row.user_id}>
                                                <TableCell>
                                                    <div className="font-medium">{row.nome_completo}</div>
                                                    <div className="text-xs text-muted-foreground">{row.email}</div>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">{row.cpf}</TableCell>
                                                <TableCell className="text-center">{row.appointments_count}</TableCell>
                                                <TableCell className="text-right">R$ {row.total_guest_costs?.toFixed(2)}</TableCell>
                                                <TableCell className="text-right">R$ {row.total_fines?.toFixed(2)}</TableCell>
                                                <TableCell className="text-right font-bold text-red-600">R$ {row.total_debt?.toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">Nenhum débito encontrado.</TableCell>
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
