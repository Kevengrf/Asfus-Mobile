"use client";

import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { addDays, differenceInDays, eachDayOfInterval, areIntervalsOverlapping, isSameDay } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase, getLotteryPeriods } from "@/lib/supabase/client"; // Import getLotteryPeriods
import { Loader2, Plus, Trash2, Car, Users, Home, Trophy } from "lucide-react"; // Added Trophy icon for lottery
import { ProfileHeader } from "./ProfileHeader";
import { AgendamentoCalendar } from "./AgendamentoCalendar"; // Verify this import if separate component, or if inlined. Wait, the previous file was AgendamentoCalendar.tsx, but here it uses Calendar from ui/calendar. I need to replace the usage of Calendar with AgendamentoCalendar.

type AppointmentType = 'dayuse' | 'evento' | 'apartamentos';

type Appointment = {
    id: number;
    start_date: string;
    end_date: string;
    status: 'pendente' | 'aprovado' | 'rejeitado' | 'em_sorteio'; // Added em_sorteio
    type: AppointmentType;
    house_number?: number;
    license_plate?: string;
    is_lottery?: boolean; // Added is_lottery
};

type Guest = {
    name: string;
    cpf: string;
    sex: string;
    contact: string;
};

interface SchedulingSystemProps {
    showHistory?: boolean;
}

export function SchedulingSystem({ showHistory = true }: SchedulingSystemProps) {
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>();
    const [appointmentType, setAppointmentType] = React.useState<AppointmentType>('dayuse');
    const [houseNumber, setHouseNumber] = React.useState<number | undefined>();
    const [licensePlate, setLicensePlate] = React.useState('');
    const [guests, setGuests] = React.useState<Guest[]>([]);

    // Lottery State
    const [lotteryPeriods, setLotteryPeriods] = React.useState<any[]>([]);

    // Guest Form State
    const [newGuest, setNewGuest] = React.useState<Guest>({ name: '', cpf: '', sex: '', contact: '' });

    const [userAppointments, setUserAppointments] = React.useState<Appointment[]>([]);
    const [allAppointments, setAllAppointments] = React.useState<Appointment[]>([]);
    const [pendingDates, setPendingDates] = React.useState<Date[]>([]);
    const [blockedEventoDates, setBlockedEventoDates] = React.useState<Date[]>([]);
    const [fullyBookedApartamentoDates, setFullyBookedApartamentoDates] = React.useState<Date[]>([]);

    const [isLoading, setIsLoading] = React.useState(true);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [formMessage, setFormMessage] = React.useState<{ type: 'error' | 'success', text: string } | null>(null);


    // ... (rest of state)

    // Price State
    const [prices, setPrices] = React.useState({
        guest: 10.00,
        dayuse: 0.00,
        evento: 0.00,
        apartamento: 0.00
    });

    const fetchPageData = React.useCallback(async () => {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        // 0. Fetch Prices
        const { data: validSettings } = await supabase.from('system_settings').select('*');
        if (validSettings) {
            const priceMap: any = {};
            validSettings.forEach((s: any) => priceMap[s.key] = Number(s.value));
            setPrices({
                guest: priceMap['price_guest'] ?? 10.00,
                dayuse: priceMap['price_day_use'] ?? 0.00,
                evento: priceMap['price_evento'] ?? 0.00,
                apartamento: priceMap['price_apartamento'] ?? 0.00
            });
        }

        // 1. Fetch Lottery Periods
        const periods = await getLotteryPeriods();
        setLotteryPeriods(periods);

        if (user && showHistory) {
            const { data: userAppointmentsData } = await supabase
                .from('appointments')
                .select('*, appointment_guests(id, amount)')
                .eq('user_id', user.id)
                .order('start_date', { ascending: false });
            if (userAppointmentsData) setUserAppointments(userAppointmentsData as any);
        }

        const { data: allAppointmentsData, error } = await supabase
            .from('appointments')
            .select('*')
            .in('status', ['aprovado', 'pendente', 'em_sorteio']); // Added em_sorteio

        if (error) {
            alert(`Erro ao buscar agendamentos: ${error.message}`);
        } else if (allAppointmentsData) {
            setAllAppointments(allAppointmentsData as any);
            processAppointmentsForCalendar(allAppointmentsData as any);
        }

        setIsLoading(false);
    }, [showHistory]);

    React.useEffect(() => {
        fetchPageData();
    }, [fetchPageData]);

    const parseSupabaseDate = (dateString: string) => {
        if (!dateString) return new Date();
        const parts = dateString.split('-');
        if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            return new Date(year, month, day, 12, 0, 0);
        }
        return new Date(dateString);
    };

    const isDateInLottery = (date: Date) => {
        return lotteryPeriods.some(period => {
            const d = new Date(date);
            d.setHours(0, 0, 0, 0);
            // Assuming period dates are strings YYYY-MM-DD
            // Construct dates with time set to noon to avoid timezone shift issues when just comparing dates
            const start = new Date(period.start_date + 'T12:00:00');
            const end = new Date(period.end_date + 'T12:00:00');
            start.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);
            return d >= start && d <= end;
        });
    };

    const processAppointmentsForCalendar = (appointments: Appointment[]) => {
        let pending: Date[] = [];
        let blockedEvento: Date[] = [];
        const approvedApartamentoCount: { [key: string]: number } = {};

        appointments.forEach(app => {
            if (!app.start_date || !app.end_date) return;
            // Skip lottery appointments for blockage logic (they don't block)
            // But we might want to highlight them if they are mine? Handled by AgendamentoCalendar via 'agendamentos' prop.

            const interval = eachDayOfInterval({
                start: parseSupabaseDate(app.start_date),
                end: parseSupabaseDate(app.end_date)
            });

            if (app.status === 'pendente') {
                pending.push(...interval);
            }

            if (app.status === 'aprovado' || app.status === 'pendente') {
                if (app.type === 'evento') {
                    blockedEvento.push(...interval);
                } else if (app.type === 'apartamentos') {
                    interval.forEach(date => {
                        // IF this date is a lottery date, do NOT count towards blockage limit (11)
                        // because lottery allows unlimited applicants until the draw.
                        if (!isDateInLottery(date)) {
                            const dateString = format(date, 'yyyy-MM-dd');
                            approvedApartamentoCount[dateString] = (approvedApartamentoCount[dateString] || 0) + 1;
                        }
                    });
                }
            }
        });

        const fullyBookedApto = Object.keys(approvedApartamentoCount)
            .filter(date => approvedApartamentoCount[date] >= 11)
            .map(dateStr => parseSupabaseDate(dateStr));

        setPendingDates(pending);
        setBlockedEventoDates(blockedEvento);
        setFullyBookedApartamentoDates(fullyBookedApto);
    };

    const isDateDisabled = (date: Date): boolean => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (date < today) return true;

        if (appointmentType === 'evento') {
            return blockedEventoDates.some(d => isSameDay(d, date));
        }

        if (appointmentType === 'apartamentos') {
            return fullyBookedApartamentoDates.some(d => isSameDay(d, date));
        }

        return false;
    };

    const modifiers = {
        pending: pendingDates,
        booked: [...blockedEventoDates, ...fullyBookedApartamentoDates],
    };

    const modifiersStyles = {
        pending: { backgroundColor: '#E2E8F0', color: '#4A5568' },
        booked: { backgroundColor: '#FECACA', color: '#991B1B' },
    };

    const handleDateSelect = (range: DateRange | undefined) => {
        setFormMessage(null);

        if ((appointmentType === 'dayuse' || appointmentType === 'evento') && range?.from) {
            setDateRange({ from: range.from, to: range.from });
            return;
        }

        if (appointmentType === 'apartamentos' && range?.from && range.to) {
            if (differenceInDays(range.to, range.from) > 6) {
                setFormMessage({ type: 'error', text: 'Você só pode selecionar no máximo 7 dias para apartamentos.' });
                setDateRange({ from: range.from, to: addDays(range.from, 6) });
                return;
            }
        }
        setDateRange(range);
    }

    const handleAddGuest = () => {
        if (!newGuest.name || !newGuest.cpf) {
            alert("Nome e CPF são obrigatórios para o convidado.");
            return;
        }
        setGuests([...guests, newGuest]);
        setNewGuest({ name: '', cpf: '', sex: '', contact: '' });
    };

    const handleRemoveGuest = (index: number) => {
        const updated = [...guests];
        updated.splice(index, 1);
        setGuests(updated);
    };

    const handleBooking = async () => {
        setFormMessage(null);
        setIsSubmitting(true);

        if (!dateRange?.from) {
            setFormMessage({ type: 'error', text: "Por favor, selecione uma data." });
            setIsSubmitting(false);
            return;
        }

        const startDate = dateRange.from;
        const endDate = dateRange.to || dateRange.from;

        if (appointmentType === 'apartamentos' && !houseNumber) {
            setFormMessage({ type: 'error', text: "Por favor, selecione o número do apartamento." });
            setIsSubmitting(false);
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setFormMessage({ type: 'error', text: "Você precisa estar logado para agendar." });
            setIsSubmitting(false);
            return;
        }

        try {
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profileError || !profileData) throw new Error('Erro ao verificar o papel do usuário.');

            // Determine if this is a lottery booking
            const isLottery = isDateInLottery(startDate);
            const initialStatus = isLottery ? 'em_sorteio' : 'pendente';

            // Skip strict validation for Lottery periods (except maybe duplicate by SAME user, but user allowed multiple?)
            // For now, if lottery, skip the "conflicting" checks blocks

            if (!isLottery) {
                if (profileData.role !== 'admin') {
                    const now = new Date();
                    const day = now.getDay();
                    const hour = now.getHours();
                    const isWeekend = day === 0 || day === 5 || day === 6;
                    const isLateThursday = day === 4 && hour >= 17;

                    if (isWeekend || isLateThursday) {
                        throw new Error('Os agendamentos só podem ser realizados de Segunda a Quinta-feira, até às 17h.');
                    }
                }

                if (appointmentType === 'evento') {
                    const { data: existingEvents, error: eventError } = await supabase
                        .from('appointments')
                        .select('id')
                        .eq('type', 'evento')
                        .in('status', ['aprovado', 'pendente'])
                        .lte('start_date', format(endDate, "yyyy-MM-dd"))
                        .gte('end_date', format(startDate, "yyyy-MM-dd"));

                    if (eventError) throw eventError;
                    if (existingEvents && existingEvents.length > 0) {
                        throw new Error(`Já existe um Evento agendado/pendente para esta data.`);
                    }
                }

                if (appointmentType === 'apartamentos') {
                    const { data: conflictingCasa, error: conflictingCasaError } = await supabase
                        .from('appointments')
                        .select('id')
                        .eq('type', 'apartamentos')
                        .eq('house_number', houseNumber)
                        .in('status', ['aprovado', 'pendente'])
                        .lte('start_date', format(endDate, "yyyy-MM-dd"))
                        .gte('end_date', format(startDate, "yyyy-MM-dd"));

                    if (conflictingCasaError) throw conflictingCasaError;
                    if (conflictingCasa && conflictingCasa.length > 0) {
                        throw new Error(`O Apartamento ${houseNumber} já possui uma reserva ou solicitação para este período.`);
                    }
                }
            }

            const normalizeDate = (date: Date) => {
                const newDate = new Date(date);
                newDate.setHours(12, 0, 0, 0);
                return newDate;
            };
            const normalizedStart = normalizeDate(startDate);
            const normalizedEnd = normalizeDate(endDate);

            // 1. Create Appointment
            const { data: appointmentData, error: insertError } = await supabase
                .from('appointments')
                .insert({
                    user_id: user.id,
                    start_date: format(normalizedStart, "yyyy-MM-dd"),
                    end_date: format(normalizedEnd, "yyyy-MM-dd"),
                    booking_date: format(normalizedStart, "yyyy-MM-dd"),
                    status: initialStatus,
                    type: appointmentType,
                    house_number: appointmentType === 'apartamentos' ? houseNumber : null,
                    license_plate: licensePlate || null,
                    is_lottery: isLottery,
                })
                .select()
                .single();

            if (insertError) throw insertError;
            if (!appointmentData) throw new Error("Erro ao criar agendamento.");

            // 2. Insert Guests (if any)
            if (guests.length > 0) {
                const guestsToInsert = guests.map(guest => ({
                    appointment_id: appointmentData.id,
                    name: guest.name,
                    cpf: guest.cpf,
                    sex: guest.sex,
                    contact: guest.contact,
                    amount: prices.guest // Dynamic price
                }));

                const { error: guestsError } = await supabase
                    .from('appointment_guests')
                    .insert(guestsToInsert);

                if (guestsError) {
                    console.error("Error inserting guests:", guestsError);
                    // Optional: Rollback appointment? Or just warn?
                    // For now, warning user.
                    throw new Error("Agendamento criado, mas houve erro ao salvar convidados. Contate o admin.");
                }
            }

            setFormMessage({ type: 'success', text: isLottery ? "Inscrição no Sorteio realizada com sucesso!" : "Solicitação enviada com sucesso!" });
            setDateRange(undefined);
            setHouseNumber(undefined);
            setLicensePlate('');
            setGuests([]);
            fetchPageData();

        } catch (error: any) {
            console.error("Booking error:", error);
            setFormMessage({ type: 'error', text: `Erro ao agendar: ${error.message}` });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Card className="h-full">
                        <CardContent className="p-4 flex flex-col items-center">
                            {/* Calendar is slightly complex to center perfectly without full width logic, sticking to flex center */}
                            <Calendar
                                mode="range"
                                selected={dateRange}
                                onSelect={handleDateSelect}
                                className="rounded-md border p-4 pointer-events-auto"
                                disabled={isDateDisabled}
                                modifiers={modifiers}
                                modifiersStyles={modifiersStyles}
                                numberOfMonths={1}
                                locale={ptBR}
                            />
                        </CardContent>
                        <CardFooter className="flex flex-wrap gap-4 text-sm justify-center bg-slate-50 p-4 border-t">
                            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-green-100 border border-green-200"></div> Livre</div>
                            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-slate-200 border border-slate-300"></div> Em Análise</div>
                            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-red-200 border border-red-300"></div> Ocupado</div>
                        </CardFooter>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Configurar Reserva</CardTitle></CardHeader>
                        <CardContent className="space-y-5">
                            {/* Date Display */}
                            <div>
                                <Label>Período Selecionado</Label>
                                <div className="text-lg text-blue-600 font-bold border p-2 rounded-md bg-blue-50 text-center">
                                    {dateRange?.from ? format(dateRange.from, "PPP", { locale: ptBR }) : 'Selecione no calendário'}
                                    {dateRange?.to && appointmentType === 'apartamentos' ? ` - ${format(dateRange.to, "PPP", { locale: ptBR })}` : ''}
                                </div>
                            </div>

                            {/* Type Selection */}
                            <div className="space-y-2">
                                <Label>Tipo de Uso</Label>
                                <div className="grid grid-cols-1 gap-2">
                                    <Label className={`flex items-center gap-3 cursor-pointer p-3 rounded-md border transition-all ${appointmentType === 'dayuse' ? 'bg-blue-100 border-blue-400 ring-1 ring-blue-400' : 'hover:bg-slate-50'}`}>
                                        <input type="radio" name="appointmentType" value="dayuse" checked={appointmentType === 'dayuse'} onChange={() => { setAppointmentType('dayuse'); setDateRange(undefined); }} className="w-4 h-4 text-blue-600" />
                                        <span className="font-semibold text-lg">Day-use</span>
                                    </Label>
                                    <Label className={`flex items-center gap-3 cursor-pointer p-3 rounded-md border transition-all ${appointmentType === 'evento' ? 'bg-blue-100 border-blue-400 ring-1 ring-blue-400' : 'hover:bg-slate-50'}`}>
                                        <input type="radio" name="appointmentType" value="evento" checked={appointmentType === 'evento'} onChange={() => { setAppointmentType('evento'); setDateRange(undefined); }} className="w-4 h-4 text-blue-600" />
                                        <span>Evento (Exclusivo)</span>
                                    </Label>
                                    <Label className={`flex items-center gap-3 cursor-pointer p-3 rounded-md border transition-all ${appointmentType === 'apartamentos' ? 'bg-blue-100 border-blue-400 ring-1 ring-blue-400' : 'hover:bg-slate-50'}`}>
                                        <input type="radio" name="appointmentType" value="apartamentos" checked={appointmentType === 'apartamentos'} onChange={() => { setAppointmentType('apartamentos'); setDateRange(undefined); }} className="w-4 h-4 text-blue-600" />
                                        <span>Apartamentos (11 un.)</span>
                                    </Label>
                                </div>
                            </div>

                            {/* License Plate (Optional for all) */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2"><Car className="w-4 h-4" /> Placa do Veículo (Opcional)</Label>
                                <Input
                                    placeholder="ABC-1234"
                                    value={licensePlate}
                                    onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                                    maxLength={8}
                                />
                            </div>

                            {/* Apartments Grid */}
                            {appointmentType === 'apartamentos' && (
                                <div className="space-y-2 animate-in fade-in zoom-in duration-300">
                                    <Label>Escolha o Apartamento</Label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {Array.from({ length: 11 }, (_, i) => i + 1).map(num => {
                                            let status: 'livre' | 'ocupado' | 'pendente' = 'livre';

                                            if (dateRange?.from) {
                                                const checkStart = dateRange.from;
                                                const checkEnd = dateRange.to || dateRange.from;

                                                for (const app of allAppointments) {
                                                    if (app.type === 'apartamentos' && app.house_number === num && app.status !== 'rejeitado' && app.start_date && app.end_date) {
                                                        const appStart = parseSupabaseDate(app.start_date);
                                                        const appEnd = parseSupabaseDate(app.end_date);
                                                        const isOverlapping = areIntervalsOverlapping({ start: checkStart, end: checkEnd }, { start: appStart, end: appEnd }, { inclusive: true });
                                                        if (isOverlapping) {
                                                            if (app.status === 'aprovado') status = 'ocupado';
                                                            else if (app.status === 'pendente' && status !== 'ocupado') status = 'pendente';
                                                        }
                                                    }
                                                }
                                            }

                                            return (
                                                <button
                                                    key={num}
                                                    onClick={() => status === 'livre' && setHouseNumber(num)}
                                                    disabled={status !== 'livre'}
                                                    className={`
                                                        flex flex-col items-center justify-center py-2 h-auto rounded-md border text-sm font-bold transition-all relative
                                                        ${houseNumber === num ? 'ring-2 ring-blue-600 border-blue-600 bg-blue-50 text-blue-700' : ''}
                                                        ${status === 'livre' && houseNumber !== num ? 'bg-white hover:bg-slate-100 text-slate-700' : ''}
                                                        ${status === 'ocupado' ? 'bg-red-100 border-red-200 text-red-400 opacity-60 cursor-not-allowed' : ''}
                                                        ${status === 'pendente' ? 'bg-slate-200 border-slate-300 text-slate-500 cursor-not-allowed' : ''}
                                                    `}
                                                >
                                                    <Home className="w-5 h-5 md:w-6 md:h-6 mb-1" />
                                                    <span className="text-xs md:text-sm">{num}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Guest Form (All Types) */}
                            {(appointmentType === 'dayuse' || appointmentType === 'evento' || appointmentType === 'apartamentos') && (
                                <div className="space-y-4 border-t pt-4">
                                    <Label className="flex items-center gap-2 font-bold text-base"><Users className="w-4 h-4" /> Convidados</Label>
                                    <p className="text-xs text-muted-foreground">Cada convidado gera uma cobrança de R$ {prices.guest.toFixed(2).replace('.', ',')} na sua folha.</p>

                                    <div className="grid grid-cols-2 gap-2">
                                        <Input placeholder="Nome" value={newGuest.name} onChange={e => setNewGuest({ ...newGuest, name: e.target.value })} className="col-span-2" />
                                        <Input placeholder="CPF" value={newGuest.cpf} onChange={e => setNewGuest({ ...newGuest, cpf: e.target.value })} />
                                        <Input placeholder="Contato" value={newGuest.contact} onChange={e => setNewGuest({ ...newGuest, contact: e.target.value })} />
                                        <Select onValueChange={v => setNewGuest({ ...newGuest, sex: v })} value={newGuest.sex}>
                                            <SelectTrigger><SelectValue placeholder="Sexo" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="M">Masculino</SelectItem>
                                                <SelectItem value="F">Feminino</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button onClick={handleAddGuest} size="icon" variant="secondary"><Plus className="w-4 h-4" /></Button>
                                    </div>

                                    {guests.length > 0 && (
                                        <div className="bg-slate-50 rounded-md p-2 space-y-2">
                                            {guests.map((g, i) => (
                                                <div key={i} className="flex justify-between items-center text-sm border-b pb-1 last:border-0">
                                                    <span>{g.name} <span className="text-muted-foreground text-xs">({g.cpf})</span></span>
                                                    <Button variant="ghost" size="sm" onClick={() => handleRemoveGuest(i)} className="h-6 w-6 p-0 text-red-500"><Trash2 className="w-3 h-3" /></Button>
                                                </div>
                                            ))}
                                            <div className="flex justify-between items-center font-bold pt-2 text-blue-700">
                                                <span>Total Extra:</span>
                                                <span>R$ {(guests.length * prices.guest).toFixed(2).replace('.', ',')}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleBooking} disabled={!dateRange?.from || isSubmitting || isLoading}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirmar Agendamento
                            </Button>
                            {formMessage && <p className={`text-sm ${formMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{formMessage.text}</p>}
                        </CardFooter>
                    </Card>
                </div>
            </div>

            {showHistory && (
                <div>
                    <h2 className="text-2xl font-bold mb-4 text-slate-800">Seu Histórico</h2>
                    <Card className="bg-white border-slate-200">
                        <CardContent className="p-0">
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-slate-50">
                                            <TableHead className="text-slate-600">Período</TableHead>
                                            <TableHead className="text-slate-600">Tipo</TableHead>
                                            <TableHead className="text-slate-600">Custos</TableHead>
                                            <TableHead className="text-slate-600">Placa</TableHead>
                                            <TableHead className="text-slate-600">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {userAppointments.length > 0 ? (
                                            userAppointments.map((app) => (
                                                <TableRow key={app.id} className="hover:bg-slate-50 border-b border-slate-100 text-slate-700">
                                                    <TableCell>{app.start_date ? format(parseSupabaseDate(app.start_date), "dd/MM/yy") : ''}</TableCell>
                                                    <TableCell className="capitalize">{app.type === 'apartamentos' ? `Apto ${app.house_number}` : app.type}</TableCell>
                                                    <TableCell>
                                                        {(app as any).appointment_guests?.length > 0 ? (
                                                            <div className="flex flex-col text-xs">
                                                                <span className="font-bold text-blue-600">
                                                                    {(app as any).appointment_guests.length} conv.
                                                                </span>
                                                                <span>
                                                                    R$ {((app as any).appointment_guests.reduce((acc: number, curr: any) => acc + (curr.amount || 10), 0)).toFixed(2)}
                                                                </span>
                                                            </div>
                                                        ) : '-'}
                                                    </TableCell>
                                                    <TableCell className="uppercase text-muted-foreground text-sm">{app.license_plate || '-'}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={app.status === 'aprovado' ? 'default' : (app.status === 'pendente' ? 'secondary' : (app.status === 'em_sorteio' ? 'outline' : 'destructive'))}
                                                            className={
                                                                app.status === 'aprovado' ? 'bg-green-600 hover:bg-green-700' :
                                                                    app.status === 'em_sorteio' ? 'border-amber-500 text-amber-600 bg-amber-50' : ''
                                                            }>
                                                            {app.status === 'em_sorteio' ? 'Sorteio' : app.status}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow><TableCell colSpan={4} className="h-24 text-center text-slate-500">Nenhum agendamento.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}