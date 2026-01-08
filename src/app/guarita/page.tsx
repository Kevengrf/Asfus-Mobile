"use client";

import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Car, Users, CalendarCheck, AlertTriangle, Eye, User, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { LicensePlate } from "@/components/LicensePlate";

type Appointment = {
    id: number;
    start_date: string;
    end_date: string;
    type: string;
    house_number: number | null;
    license_plate: string | null;
    status: string;
    profiles: {
        nome_completo: string;
        email: string;
        cpf: string;
        telefone: string;
    } | null;
    appointment_guests: {
        id: number;
        name: string;
        cpf: string;
        sex: string;
    }[];
};

export default function GuaritaPage() {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [filterDate, setFilterDate] = React.useState('');
    const [appointments, setAppointments] = React.useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [selectedAppointment, setSelectedAppointment] = React.useState<Appointment | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);

    const fetchAppointments = React.useCallback(async () => {
        setIsLoading(true);
        const today = new Date().toISOString().split('T')[0];

        let query = supabase
            .from('appointments')
            .select(`
                *,
                profiles (nome_completo, email, cpf, telefone),
                appointment_guests (id, name, cpf, sex)
            `)
            .in('status', ['aprovado', 'pendente'])

        if (filterDate) {
            // Specific Date: Must be active coverage (start <= date <= end)
            // Actually, usually users want "Starts on" or "Covers". active coverage is best.
            query = query
                .lte('start_date', filterDate)
                .gte('end_date', filterDate);
        } else {
            // Default: "All future or ongoing"
            // Start date doesn't matter as long as End date is in future/today.
            query = query.gte('end_date', today);
        }

        // Sort by start_date ascending (nearest first)
        query = query.order('start_date', { ascending: true });

        const { data, error } = await query;

        if (error) {
            console.error(error);
        } else {
            setAppointments(data as any);
        }
        setIsLoading(false);
    }, [filterDate]);

    const handleSearch = async () => {
        if (!searchTerm) {
            fetchAppointments();
            return;
        }

        setIsLoading(true);

        const today = new Date().toISOString().split('T')[0];

        let query = supabase
            .from('appointments')
            .select(`
                *,
                profiles (nome_completo, email, cpf, telefone),
                appointment_guests (id, name, cpf, sex)
            `)
            .gte('end_date', today) // Search only future/active by default to avoid huge lists
            .in('status', ['aprovado', 'pendente'])
            .order('start_date', { ascending: false });

        const { data, error } = await query;

        if (data) {
            const lowerTerm = searchTerm.toLowerCase();
            const filtered = (data as any).filter((app: any) => {
                const plateMatch = app.license_plate?.toLowerCase().includes(lowerTerm);
                const nameMatch = app.profiles?.nome_completo?.toLowerCase().includes(lowerTerm);
                const cpfMatch = app.profiles?.cpf?.includes(lowerTerm);
                const guestMatch = app.appointment_guests?.some((g: any) => g.name.toLowerCase().includes(lowerTerm) || g.cpf.includes(lowerTerm));

                return plateMatch || nameMatch || cpfMatch || guestMatch;
            });
            setAppointments(filtered);
        }
        setIsLoading(false);
    };

    React.useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    const openDetails = (app: Appointment) => {
        setSelectedAppointment(app);
        setIsDetailsOpen(true);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 pb-20 md:pb-4">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
                    <div className="mb-4 md:mb-0">
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <AlertTriangle className="text-orange-500" />
                            Controle de Portaria
                        </h1>
                        <p className="text-muted-foreground text-sm">Verifique o acesso de associados e veículos.</p>
                    </div>
                    <Button variant="outline" onClick={() => { supabase.auth.signOut(); window.location.href = '/login'; }}>
                        Sair
                    </Button>
                </div>

                {/* Search & Filter */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Buscar Acesso</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 flex gap-2">
                            <Input
                                placeholder="Placa, Nome, CPF..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <Button onClick={handleSearch}><Search className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">Buscar</span></Button>
                        </div>
                        <div className="w-full md:w-48">
                            <Input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className="w-full"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* List */}
                <div className="space-y-4">
                    <h2 className="font-bold text-lg text-slate-700 flex items-center gap-2">
                        <CalendarCheck className="w-5 h-5" />
                        {searchTerm ? 'Resultados da Pesquisa' : (filterDate ? `Agendamentos para ${format(new Date(filterDate), 'dd/MM')}` : 'Próximos Agendamentos')}
                    </h2>

                    {isLoading ? (
                        <div className="text-center p-8 text-muted-foreground">Carregando...</div>
                    ) : appointments.length > 0 ? (
                        appointments.map(app => (
                            <Card key={app.id} className="overflow-hidden border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => openDetails(app)}>
                                <CardContent className="p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg">{app.profiles?.nome_completo || 'Sem Nome'}</h3>
                                        <div className="text-sm text-muted-foreground flex flex-col md:flex-row gap-1 md:gap-4 mt-1">
                                            <span className="flex items-center gap-1"><User className="w-3 h-3" /> CPF: {app.profiles?.cpf}</span>
                                            <div className="flex items-center gap-2 mt-1 md:mt-0">
                                                <Car className="w-3 h-3 text-muted-foreground" />
                                                <LicensePlate plate={app.license_plate} size="sm" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-row md:flex-col items-center gap-4 md:gap-2 w-full md:w-auto justify-between md:justify-end">
                                        <div className="text-right">
                                            <Badge variant={app.status === 'aprovado' ? 'default' : 'secondary'} className={app.status === 'aprovado' ? 'bg-green-600' : ''}>
                                                {app.status.toUpperCase()}
                                            </Badge>
                                            <div className="text-xs text-muted-foreground mt-1 capitalize">{app.type} {app.house_number ? `- Casa ${app.house_number}` : ''}</div>
                                        </div>
                                        <Button size="icon" variant="ghost" className="md:hidden"><Eye /></Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center p-12 bg-white rounded-lg border border-dashed">
                            Nenhum registro encontrado.
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Detalhes do Acesso</DialogTitle>
                        <DialogDescription>Confira os dados abaixo.</DialogDescription>
                    </DialogHeader>

                    {selectedAppointment && (
                        <div className="space-y-6">
                            {/* Associate Info */}
                            <div className="bg-slate-50 p-3 rounded-md border">
                                <h4 className="text-sm font-bold text-slate-500 mb-2 uppercase flex items-center gap-2"><User className="w-4 h-4" /> Titular</h4>
                                <div className="text-lg font-bold">{selectedAppointment.profiles?.nome_completo}</div>
                                <div className="grid grid-cols-2 gap-2 text-sm mt-1">
                                    <span>CPF: {selectedAppointment.profiles?.cpf}</span>
                                    <span>Tel: {selectedAppointment.profiles?.telefone}</span>
                                </div>
                            </div>

                            {/* Booking Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="border p-3 rounded-md flex flex-col items-center justify-center bg-slate-100">
                                    <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase w-full text-left">Veículo</h4>
                                    <LicensePlate plate={selectedAppointment.license_plate} size="md" />
                                </div>
                                <div className="border p-3 rounded-md">
                                    <h4 className="text-xs font-bold text-slate-500 mb-1 uppercase">Período</h4>
                                    <div className="text-sm font-semibold">
                                        {format(new Date(selectedAppointment.start_date), 'dd/MM')} até {format(new Date(selectedAppointment.end_date), 'dd/MM')}
                                    </div>
                                    <div className="mt-2">
                                        <h4 className="text-xs font-bold text-slate-500 mb-1 uppercase">Tipo</h4>
                                        <div className="text-sm capitalize">{selectedAppointment.type}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Guests */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-500 mb-2 uppercase flex items-center gap-2"><Users className="w-4 h-4" /> Convidados ({selectedAppointment.appointment_guests.length})</h4>
                                <div className="max-h-40 overflow-y-auto border rounded-md divide-y">
                                    {selectedAppointment.appointment_guests.length > 0 ? (
                                        selectedAppointment.appointment_guests.map(guest => (
                                            <div key={guest.id} className="p-2 text-sm flex justify-between items-center">
                                                <span className="font-semibold">{guest.name}</span>
                                                <span className="text-xs text-muted-foreground font-mono">{guest.cpf}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-sm text-muted-foreground">Sem convidados.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button className="w-full" size="lg" onClick={() => setIsDetailsOpen(false)}>Fechar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
