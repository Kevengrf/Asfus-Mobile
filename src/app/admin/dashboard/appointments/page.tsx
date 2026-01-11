"use client";

import * as React from "react";
import { format, subDays, startOfMonth, startOfWeek, endOfWeek, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import * as XLSX from "xlsx";
import { logAction } from "@/lib/audit";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase/client";
import { Download, Loader2, Car, Users, Eye, User, CalendarRange, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
    profile_image: string | null;
  } | null;
  appointment_guests: { id: number; amount: number; name: string; cpf: string; contact: string; sex: string; }[]; // Relation for counting
};

type FilterType = 'all' | 'last_30' | 'last_7' | 'this_month' | 'last_month' | 'custom';

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [filterType, setFilterType] = React.useState<FilterType>('all');
  const [customStartDate, setCustomStartDate] = React.useState('');
  const [customEndDate, setCustomEndDate] = React.useState('');

  const fetchAppointments = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id, user_id, start_date, end_date, type, house_number, status, license_plate,
          profiles (nome_completo, email, profile_image),
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

      // Log Action
      const app = appointments.find(a => a.id === id);
      const target = `Agendamento #${id} - ${app?.profiles?.nome_completo}`;
      await logAction(status === 'aprovado' ? 'Aprovar Agendamento' : 'Rejeitar Agendamento', target, { appointment_id: id, new_status: status });

    } else {
      alert("Erro ao atualizar o agendamento.");
    }
  };

  const getTypeName = (app: Appointment) => {
    if (app.type === 'dayuse') return 'Day-use';
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

  const filteredAppointments = React.useMemo(() => {
    if (filterType === 'all') return appointments;

    const now = new Date();
    let start: Date;
    let end: Date = endOfDay(now);

    switch (filterType) {
      case 'last_30':
        start = subDays(now, 30);
        break;
      case 'last_7':
        start = subDays(now, 7);
        break;
      case 'this_month':
        start = startOfMonth(now);
        break;
      case 'last_month':
        start = startOfMonth(subDays(startOfMonth(now), 1));
        end = endOfDay(subDays(startOfMonth(now), 1));
        break;
      case 'custom':
        if (!customStartDate || !customEndDate) return appointments;
        start = startOfDay(new Date(customStartDate));
        end = endOfDay(new Date(customEndDate));
        break;
      default:
        return appointments;
    }

    return appointments.filter(app => {
      if (!app.start_date) return false;
      const appDate = new Date(app.start_date); // Filter by start date
      return isWithinInterval(appDate, { start, end });
    });
  }, [appointments, filterType, customStartDate, customEndDate]);

  const totalGuests = React.useMemo(() => {
    return filteredAppointments.reduce((sum, app) => sum + (app.appointment_guests?.length || 0), 0);
  }, [filteredAppointments]);

  const totalCost = React.useMemo(() => {
    return filteredAppointments.reduce((sum, app) => sum + calculateExtraCost(app), 0);
  }, [filteredAppointments]);


  const handleExport = () => {
    const dataToExport = filteredAppointments.map(app => {
      const guestNames = app.appointment_guests?.map(g => `${g.name} (CPF: ${g.cpf})`).join('; ') || '';
      return {
        "Nome do Associado": app.profiles?.nome_completo || "N/A",
        "Email": app.profiles?.email || "N/A",
        "Período": `${app.start_date ? format(new Date(app.start_date), "dd/MM/yyyy") : ''} - ${app.end_date ? format(new Date(app.end_date), "dd/MM/yyyy") : ''}`,
        "Tipo de Uso": getTypeName(app),
        "Placa": app.license_plate || 'N/A',
        "Convidados": app.appointment_guests?.length || 0,
        "Detalhes Convidados": guestNames,
        "Custo Extra (R$)": calculateExtraCost(app),
        "Status": app.status,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Agendamentos");
    XLSX.writeFile(workbook, `relatorio_agendamentos_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const openDetails = (app: Appointment) => {
    setSelectedAppointment(app);
    setIsDetailsOpen(true);
  };

  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [deletePassword, setDeletePassword] = React.useState('');
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Import locally to avoid circular deps if needed, generic import at top is better but this works

  const handleDeleteAll = async () => {
    if (!deletePassword) return alert("Digite sua senha.");
    setIsDeleting(true);
    try {

      const { deleteAllAppointments } = await import("@/app/admin/actions");
      const res = await deleteAllAppointments(deletePassword);
      if (res.error) {
        alert(res.error);
      } else {
        alert(res.message);
        setIsDeleteOpen(false);
        setDeletePassword('');
        fetchAppointments(); // Refresh list
      }
    } catch (e) {
      console.error(e);
      alert("Erro desconhecido.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <CardTitle>Gerenciamento de Agendamentos</CardTitle>
          <CardDescription>Aprove, rejeite e exporte as solicitações de reserva.</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsDeleteOpen(true)} variant="destructive" className="bg-red-600 hover:bg-red-700">
            <span className="mr-2">⚠</span> Excluir Tudo
          </Button>
          <Button onClick={handleExport} disabled={filteredAppointments.length === 0} className="bg-green-600 hover:bg-green-700">
            <Download className="mr-2 h-4 w-4" />
            Exportar XLSX
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 p-4 bg-slate-50 rounded-lg border">
          <div className="w-full md:w-48">
            <label className="text-xs font-medium mb-1 block">Filtrar por Período</label>
            <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo o Histórico</SelectItem>
                <SelectItem value="last_7">Últimos 7 Dias</SelectItem>
                <SelectItem value="last_30">Últimos 30 Dias</SelectItem>
                <SelectItem value="this_month">Este Mês</SelectItem>
                <SelectItem value="last_month">Mês Passado</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filterType === 'custom' && (
            <div className="flex gap-2 items-end">
              <div>
                <label className="text-xs font-medium mb-1 block">Início</label>
                <Input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Fim</label>
                <Input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} />
              </div>
            </div>
          )}
        </div>

        {/* Totals Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Convidados</p>
                <p className="text-2xl font-bold text-blue-800">{totalGuests}</p>
              </div>
              <Users className="h-8 w-8 text-blue-300" />
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Custo Total (Folha)</p>
                <p className="text-2xl font-bold text-green-800">R$ {totalCost.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-300" />
            </CardContent>
          </Card>
        </div>
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
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-slate-100">
                            <AvatarImage src={app.profiles?.profile_image || ''} className="object-cover" />
                            <AvatarFallback><User className="h-5 w-5 text-slate-400" /></AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-bold text-base">{app.profiles?.nome_completo || 'N/A'}</span>
                            <span className="text-xs text-muted-foreground">{app.profiles?.email}</span>
                          </div>
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
                          <div className="flex items-start gap-3">
                            <Avatar className="h-9 w-9 border border-slate-100">
                              <AvatarImage src={app.profiles?.profile_image || ''} className="object-cover" />
                              <AvatarFallback><User className="h-4 w-4 text-slate-400" /></AvatarFallback>
                            </Avatar>
                            <div>
                              <div>{app.profiles?.nome_completo || 'N/A'}</div>
                              <div className="text-sm text-muted-foreground">{app.profiles?.email}</div>
                            </div>
                          </div>
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
                  <div className="font-bold text-sm text-slate-800">{guest.name}</div>
                  <div className="text-xs text-slate-600 flex justify-between">
                    <span>CPF: {guest.cpf}</span>
                    <span>Sexo: {guest.sex}</span>
                  </div>
                  {guest.contact && <div className="text-xs text-slate-600">Contato: {guest.contact}</div>}
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

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md border-red-500 border-2">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <span className="text-2xl">⚠</span> AÇÃO IRREVERSÍVEL
            </DialogTitle>
            <DialogDescription className="text-slate-900 font-medium pt-2">
              Você está prestes a <span className="text-red-600 font-bold uppercase">EXCLUIR TODOS OS AGENDAMENTOS</span> do sistema.
              <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-slate-600 font-normal">
                <li>Todos os históricos serão apagados.</li>
                <li>Dados de teste e produção serão perdidos.</li>
                <li>Esta ação será registrada na auditoria.</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-bold block mb-2">Digite sua senha de administrador para confirmar:</label>
            <Input
              type="password"
              placeholder="Sua senha..."
              value={deletePassword}
              onChange={e => setDeletePassword(e.target.value)}
              className="border-red-200 focus-visible:ring-red-500"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteAll} disabled={isDeleting}>
              {isDeleting ? 'Excluindo...' : 'CONFIRMAR EXCLUSÃO'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}