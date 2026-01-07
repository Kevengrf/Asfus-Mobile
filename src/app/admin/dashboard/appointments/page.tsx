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
import { Download, Loader2, Car, Users, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type Appointment = {
  id: number;
  start_date: string;
  end_date: string;
  type: 'lazer' | 'casa' | 'dayuse' | 'evento' | 'apartamentos';
  house_number: number | null;
  license_plate: string | null;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  user_id: string;
  profiles: {
    nome_completo: string;
    email: string;
  } | null;
  appointment_guests: { id: number; amount: number; name: string; cpf: string; contact: string; sex: string; }[]; // Relation for counting
};

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);

  const fetchAppointments = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id, user_id, start_date, end_date, type, house_number, status, license_plate,
          profiles (nome_completo, email),
          appointment_guests (id, amount, name, cpf, contact, sex)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) setAppointments(data as unknown as Appointment[]);

    } catch (error: any) {
      alert(`Erro ao buscar agendamentos: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const [selectedAppointment, setSelectedAppointment] = React.useState<Appointment | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);

  React.useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    checkUser();
    fetchAppointments();
  }, [fetchAppointments]);

  const handleUpdateStatus = async (id: number, status: 'aprovado' | 'rejeitado') => {
    // Self-approval check
    if (status === 'aprovado') {
      const appointment = appointments.find(app => app.id === id);
      if (appointment && appointment.user_id === currentUserId) {
        alert("Você não pode aprovar seu próprio agendamento.");
        return;
      }
    }

    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (!error) {
      setAppointments(prev => prev.map(app => app.id === id ? { ...app, status } : app));
    } else {
      alert("Erro ao atualizar o agendamento.");
    }
  };

  const getTypeName = (app: Appointment) => {
    if (app.type === 'dayuse') return 'Dayuse';
    if (app.type === 'evento') return 'Evento';
    if (app.type === 'lazer') return 'Evento (Legado)';
    if (app.type === 'apartamentos') return `Apto ${app.house_number}`;
    if (app.type === 'casa') return `Apto ${app.house_number}`;
    return app.type;
  };

  const calculateExtraCost = (app: Appointment) => {
    // Default 10.00 per guest
    if (!app.appointment_guests) return 0;
    return app.appointment_guests.reduce((sum, g) => sum + (g.amount || 10), 0);
  };

  const handleExport = () => {
    const dataToExport = appointments.map(app => {
      const guestNames = app.appointment_guests?.map(g => `${g.name} (CPF: ${g.cpf})`).join('; ') || '';
      return {
        "Nome do Associado": app.profiles?.nome_completo || "N/A",
        "Email": app.profiles?.email || "N/A",
        "Período": `${app.start_date ? format(new Date(app.start_date), "dd/MM/yyyy") : ''} - ${app.end_date ? format(new Date(app.end_date), "dd/MM/yyyy") : ''}`,
        "Tipo de Uso": getTypeName(app),
        "Placa": app.license_plate || 'N/A',
        "Convidados": app.appointment_guests?.length || 0,
        "Detalhes Convidados": guestNames,
        "Custo Extra (R$)": calculateExtraCost(app).toFixed(2),
        "Status": app.status,
      };
    });

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

  const openDetails = (app: Appointment) => {
    setSelectedAppointment(app);
    setIsDetailsOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gerenciamento de Agendamentos</CardTitle>
          <CardDescription>Aprove, rejeite e exporte as solicitações de reserva.</CardDescription>
        </div>
        <Button onClick={handleExport} disabled={appointments.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          <>
            {/* Mobile View: Cards */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {appointments.length > 0 ? (
                appointments.map((app) => (
                  <Card key={app.id} className="shadow-sm border">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className="font-bold text-base">{app.profiles?.nome_completo || 'N/A'}</span>
                          <span className="text-xs text-muted-foreground">{app.profiles?.email}</span>
                        </div>
                        <Badge variant={app.status === 'aprovado' ? 'default' : (app.status === 'pendente' ? 'secondary' : 'destructive')}
                          className={app.status === 'aprovado' ? 'bg-green-600' : ''}>
                          {app.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2 text-sm space-y-2">
                      <div>
                        <span className="font-semibold block text-gray-600">Período / Tipo:</span>
                        {app.start_date ? format(new Date(app.start_date), "dd/MM/yy") : 'N/A'} - <span className="capitalize">{getTypeName(app)}</span>
                      </div>
                      {app.license_plate && (
                        <div className="flex gap-2 items-center">
                          <Car className="w-3 h-3 text-muted-foreground" />
                          <span>{app.license_plate}</span>
                        </div>
                      )}
                      {(app.appointment_guests?.length || 0) > 0 && (
                        <div className="flex justify-between items-center">
                          <div className="flex gap-2 items-center text-blue-600">
                            <Users className="w-3 h-3" />
                            <span>{app.appointment_guests.length} conv. (R$ {calculateExtraCost(app)})</span>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => openDetails(app)} className="h-8 w-8">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                      {app.status === 'pendente' && (
                        <div className="pt-4 flex gap-2 justify-end border-t mt-2">
                          <Button variant="outline" size="sm" className="w-full" onClick={() => handleUpdateStatus(app.id, 'aprovado')}>Aprovar</Button>
                          <Button variant="destructive" size="sm" className="w-full" onClick={() => handleUpdateStatus(app.id, 'rejeitado')}>Rejeitar</Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground border rounded-lg bg-slate-50">
                  Nenhum agendamento.
                </div>
              )}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Associado</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Infos</TableHead>
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
                        <TableCell>
                          {app.start_date && app.end_date ? `${format(new Date(app.start_date), "dd/MM/yy")} - ${format(new Date(app.end_date), "dd/MM/yy")}` : 'N/A'}
                        </TableCell>
                        <TableCell className="capitalize">{getTypeName(app)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 text-xs">
                            {app.license_plate && <span className="flex items-center gap-1"><Car className="w-3 h-3" /> {app.license_plate}</span>}
                            {(app.appointment_guests?.length || 0) > 0 && (
                              <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1 text-blue-600 font-bold" title="Custo Extra em Folha">
                                  <Users className="w-3 h-3" /> {app.appointment_guests.length} (R$ {calculateExtraCost(app)})
                                </span>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openDetails(app)}>
                                  <Eye className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </TableCell>
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
                      <TableCell colSpan={6} className="h-24 text-center">
                        Nenhum agendamento encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes dos Convidados</DialogTitle>
            <DialogDescription>
              Lista de convidados para o agendamento de <span className="font-bold">{selectedAppointment?.profiles?.nome_completo}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-4">
            {selectedAppointment?.appointment_guests && selectedAppointment.appointment_guests.length > 0 ? (
              selectedAppointment.appointment_guests.map((guest, index) => (
                <div key={index} className="p-3 border rounded-md bg-slate-50 flex flex-col gap-1">
                  <div className="font-bold text-sm">{guest.name}</div>
                  <div className="text-xs text-muted-foreground flex justify-between">
                    <span>CPF: {guest.cpf}</span>
                    <span>Sexo: {guest.sex}</span>
                  </div>
                  {guest.contact && <div className="text-xs text-muted-foreground">Contato: {guest.contact}</div>}
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground">Nenhum convidado registrado.</p>
            )}
          </div>
          <DialogFooter>
            <div className="flex justify-between items-center w-full text-sm font-bold">
              <span>Total Convidados: {selectedAppointment?.appointment_guests?.length || 0}</span>
              <span>Total R$: {selectedAppointment ? calculateExtraCost(selectedAppointment).toFixed(2) : '0.00'}</span>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}