"use client";

import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Papa from "papaparse";
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
import { supabase } from "@/lib/supabase/client";
import { Download, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type Appointment = {
  id: number;
  start_date: string;
  end_date: string;
  type: 'lazer' | 'casa';
  house_number: number | null;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  profiles: {
    nome_completo: string;
    email: string;
  } | null;
};

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchAppointments = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`id, start_date, end_date, type, house_number, status, profiles (nome_completo, email)`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) setAppointments(data as unknown as Appointment[]);

    } catch (error: any) {
        alert(`Erro ao buscar agendamentos: ${error.message}`);
    } finally {
        setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleUpdateStatus = async (id: number, status: 'aprovado' | 'rejeitado') => {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (!error) {
      setAppointments(prev => prev.map(app => app.id === id ? { ...app, status } : app));
    } else {
      alert("Erro ao atualizar o agendamento.");
    }
  };

  const handleExport = () => {
    const dataToExport = appointments.map(app => ({
        "Nome do Associado": app.profiles?.nome_completo || "N/A",
        "Email": app.profiles?.email || "N/A",
        "Período": `${app.start_date ? format(new Date(app.start_date), "dd/MM/yyyy") : ''} - ${app.end_date ? format(new Date(app.end_date), "dd/MM/yyyy") : ''}`,
        "Tipo de Uso": app.type === 'casa' ? `Casa ${app.house_number}` : 'Lazer',
        "Status": app.status,
    }));

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_agendamentos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Gerenciamento de Agendamentos</CardTitle>
            <CardDescription>Aprove, rejeite e exporte as solicitações de reserva.</CardDescription>
        </div>
        <Button onClick={handleExport} disabled={appointments.length === 0}>
            <Download className="mr-2 h-4 w-4"/>
            Exportar CSV
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin"/></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Associado</TableHead>
                <TableHead>Período Solicitado</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.length > 0 ? (
                appointments.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">
                      {app.profiles?.nome_completo || 'N/A'}
                      <div className="text-sm text-muted-foreground">{app.profiles?.email}</div>
                    </TableCell>
                    <TableCell>{app.start_date && app.end_date ? `${format(new Date(app.start_date), "dd/MM/yy", { locale: ptBR })} - ${format(new Date(app.end_date), "dd/MM/yy", { locale: ptBR })}` : 'N/A'}</TableCell>
                    <TableCell className="capitalize">{app.type === 'casa' ? `Casa ${app.house_number}` : 'Lazer'}</TableCell>
                    <TableCell>
                      <Badge variant={app.status === 'aprovado' ? 'default' : (app.status === 'pendente' ? 'secondary' : 'destructive')}
                             className={app.status === 'aprovado' ? 'bg-green-600' : ''}>
                        {app.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {app.status === 'pendente' && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(app.id, 'aprovado')}>Aprovar</Button>
                          <Button variant="destructive" size="sm" onClick={() => handleUpdateStatus(app.id, 'rejeitado')}>Rejeitar</Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Nenhum agendamento encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}