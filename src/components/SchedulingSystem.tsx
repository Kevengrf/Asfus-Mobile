"use client";

import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { addDays, differenceInDays, eachDayOfInterval, areIntervalsOverlapping } from "date-fns";

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
import { supabase } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

type Appointment = {
    id: number;
    start_date: string;
    end_date: string;
    status: 'pendente' | 'aprovado' | 'rejeitado';
    type: 'lazer' | 'casa';
    house_number?: number;
};

interface SchedulingSystemProps {
    showHistory?: boolean;
}

export function SchedulingSystem({ showHistory = true }: SchedulingSystemProps) {
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>();
    const [appointmentType, setAppointmentType] = React.useState<'lazer' | 'casa'>('lazer');
    const [houseNumber, setHouseNumber] = React.useState<number | undefined>();
    const [userAppointments, setUserAppointments] = React.useState<Appointment[]>([]);

    const [allAppointments, setAllAppointments] = React.useState<Appointment[]>([]);
    const [pendingDates, setPendingDates] = React.useState<Date[]>([]);
    const [approvedLazerDates, setApprovedLazerDates] = React.useState<Date[]>([]);
    const [fullyBookedCasaDates, setFullyBookedCasaDates] = React.useState<Date[]>([]);

    const [isLoading, setIsLoading] = React.useState(true);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [formMessage, setFormMessage] = React.useState<{ type: 'error' | 'success', text: string } | null>(null);

    const fetchPageData = React.useCallback(async () => {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user && showHistory) {
            const { data: userAppointmentsData } = await supabase
                .from('appointments')
                .select('*')
                .eq('user_id', user.id)
                .order('start_date', { ascending: false });
            if (userAppointmentsData) setUserAppointments(userAppointmentsData as any);
        }

        const { data: allAppointmentsData, error } = await supabase
            .from('appointments')
            .select('*')
            .in('status', ['aprovado', 'pendente']);

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

    // Helper to parse "YYYY-MM-DD" as local date at 12:00 to avoid UTC shifts
    const parseSupabaseDate = (dateString: string) => {
        if (!dateString) return new Date();
        const parts = dateString.split('-');
        if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            return new Date(year, month, day, 12, 0, 0);
        }
        return new Date(dateString); // Fallback
    };

    const processAppointmentsForCalendar = (appointments: Appointment[]) => {
        let pending: Date[] = [];
        let approvedLazer: Date[] = [];
        const approvedCasaCount: { [key: string]: number } = {};

        appointments.forEach(app => {
            if (!app.start_date || !app.end_date) return;
            // distinct fix: use parseSupabaseDate
            const interval = eachDayOfInterval({
                start: parseSupabaseDate(app.start_date),
                end: parseSupabaseDate(app.end_date)
            });

            if (app.status === 'pendente') {
                pending.push(...interval);
            } else if (app.status === 'aprovado') {
                if (app.type === 'lazer') {
                    approvedLazer.push(...interval);
                } else if (app.type === 'casa') {
                    interval.forEach(date => {
                        const dateString = format(date, 'yyyy-MM-dd');
                        approvedCasaCount[dateString] = (approvedCasaCount[dateString] || 0) + 1;
                    });
                }
            }
        });

        const fullyBooked = Object.keys(approvedCasaCount).filter(date => approvedCasaCount[date] >= 11).map(dateStr => parseSupabaseDate(dateStr));

        setPendingDates(pending);
        setApprovedLazerDates(approvedLazer);
        setFullyBookedCasaDates(fullyBooked);
    };

    const isDateDisabled = (date: Date): boolean => {
        const dateString = format(date, 'yyyy-MM-dd');
        // Compare with today set to 00:00:00 to disable past dates correctly
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const isPast = date < today;
        const isLazerBooked = approvedLazerDates.some(d => format(d, 'yyyy-MM-dd') === dateString);
        const isCasaFull = fullyBookedCasaDates.some(d => format(d, 'yyyy-MM-dd') === dateString);
        return isPast || isLazerBooked || isCasaFull;
    };

    const modifiers = {
        pending: pendingDates,
        approved: [...approvedLazerDates, ...fullyBookedCasaDates],
    };

    const modifiersStyles = {
        pending: { backgroundColor: '#E2E8F0', color: '#4A5568' }, // gray-200
        approved: { backgroundColor: '#FECACA', color: '#991B1B' },   // red-200
    };

    const handleDateSelect = (range: DateRange | undefined) => {
        if (appointmentType === 'lazer' && range?.from) {
            // For Lazer, force a single day selection
            range.to = range.from;
        }
        else if (range?.from && range.to) {
            if (differenceInDays(range.to, range.from) > 6) {
                setFormMessage({ type: 'error', text: 'Você só pode selecionar no máximo 7 dias para apartamentos.' });
                setDateRange({ from: range.from, to: addDays(range.from, 6) });
                return;
            }
        }
        setFormMessage(null);
        setDateRange(range);
    }

    const handleBooking = async () => {
        setFormMessage(null);
        setIsSubmitting(true);

        if (!dateRange?.from) { // 'to' is not required for single day
            setFormMessage({ type: 'error', text: "Por favor, selecione uma data." });
            setIsSubmitting(false);
            return;
        }

        // Define end_date, if it's not present in a range, it's the same as from
        const startDate = dateRange.from;
        const endDate = dateRange.to || dateRange.from;

        if (appointmentType === 'casa' && !houseNumber) {
            setFormMessage({ type: 'error', text: "Por favor, selecione o número da casa." });
            setIsSubmitting(false);
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setFormMessage({ type: 'error', text: "Você precisa estar logado para agendar." });
            setIsSubmitting(false);
            return;
        }

        // --- CONFLICT CHECK ---
        try {
            // 1. Check Lazer: One per user per day
            if (appointmentType === 'lazer') {
                const { data: existingLazer, error: lazerError } = await supabase
                    .from('appointments')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('type', 'lazer')
                    .in('status', ['aprovado', 'pendente'])
                    // Check if there is any overlapping lazer appointment for this user
                    // Since lazer is forced to single day, checking overlap is essentially checking exact date match
                    // but using lte/gte covers future range possibilities too.
                    .lte('start_date', format(endDate, "yyyy-MM-dd"))
                    .gte('end_date', format(startDate, "yyyy-MM-dd"));

                if (lazerError) throw lazerError;
                if (existingLazer && existingLazer.length > 0) {
                    throw new Error(`Você já possui uma solicitação de Lazer para esta data (${format(startDate, "dd/MM/yyyy")}).`);
                }
            }

            // 2. Check Casa: Unit availability
            if (appointmentType === 'casa') {
                const { data: conflictingCasa, error: conflictingCasaError } = await supabase
                    .from('appointments')
                    .select('id')
                    .eq('type', 'casa')
                    .eq('house_number', houseNumber)
                    .in('status', ['aprovado', 'pendente'])
                    .lte('start_date', format(endDate, "yyyy-MM-dd"))
                    .gte('end_date', format(startDate, "yyyy-MM-dd"));

                if (conflictingCasaError) throw conflictingCasaError;
                if (conflictingCasa && conflictingCasa.length > 0) {
                    throw new Error(`O Apartamento ${houseNumber} já possui uma reserva ou solicitação para este período.`);
                }
            }
            // The general check for 'lazer' and 'casa' full capacity is already handled by isDateDisabled visually
            // but a server-side check is always good practice. We can add it if needed.

            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profileError || !profileData) {
                throw new Error('Erro ao verificar o papel do usuário.');
            }

            const initialStatus = profileData.role === 'admin' ? 'aprovado' : 'pendente';

            // Normalize date to noon to avoid timezone issues
            const normalizeDate = (date: Date) => {
                const newDate = new Date(date);
                newDate.setHours(12, 0, 0, 0);
                return newDate;
            };

            const normalizedStart = normalizeDate(startDate);
            const normalizedEnd = normalizeDate(endDate);

            const { error: insertError } = await supabase
                .from('appointments')
                .insert({
                    user_id: user.id,
                    start_date: format(normalizedStart, "yyyy-MM-dd"),
                    end_date: format(normalizedEnd, "yyyy-MM-dd"),
                    // Fix: DB still requires booking_date, map it to start_date
                    booking_date: format(normalizedStart, "yyyy-MM-dd"),
                    status: initialStatus,
                    type: appointmentType,
                    house_number: appointmentType === 'casa' ? houseNumber : null,
                })
                .single();

            if (insertError) throw insertError;

            setFormMessage({ type: 'success', text: "Solicitação enviada com sucesso!" });
            setDateRange(undefined);
            setHouseNumber(undefined);
            fetchPageData();

        } catch (error: any) {
            console.error("Booking error:", error);
            setFormMessage({ type: 'error', text: `Erro ao agendar: ${error.message}` });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Card>
                        <CardContent className="p-4 flex justify-center">
                            <Calendar
                                mode="range"
                                selected={dateRange}
                                onSelect={handleDateSelect}
                                className="rounded-md border"
                                disabled={isDateDisabled}
                                modifiers={modifiers}
                                modifiersStyles={modifiersStyles}
                                numberOfMonths={2}
                                locale={ptBR}
                            />
                        </CardContent>
                        <CardFooter className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-green-100 border border-green-200"></div> Livre</div>
                            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-slate-200 border border-slate-300"></div> Em Análise</div>
                            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-red-200 border border-red-300"></div> Ocupado</div>
                        </CardFooter>
                    </Card>
                </div>

                <div>
                    <Card>
                        <CardHeader><CardTitle>Sua Reserva</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="font-semibold">Período Selecionado:</p>
                                <p className="text-lg text-blue-600 font-bold">
                                    {dateRange?.from ? format(dateRange.from, "PPP", { locale: ptBR }) : 'Selecione o início'}
                                    {dateRange?.to ? ` - ${format(dateRange.to, "PPP", { locale: ptBR })}` : ''}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <p className="font-semibold">Tipo de Uso:</p>
                                <div className="flex gap-4">
                                    <Label className="flex items-center gap-2 cursor-pointer p-2 rounded-md has-[:checked]:bg-blue-100 has-[:checked]:border-blue-300 border-2 border-transparent transition-all">
                                        <input type="radio" name="appointmentType" value="lazer" checked={appointmentType === 'lazer'} onChange={() => setAppointmentType('lazer')} className="sr-only" />
                                        Uso Lazer
                                    </Label>
                                    <Label className="flex items-center gap-2 cursor-pointer p-2 rounded-md has-[:checked]:bg-blue-100 has-[:checked]:border-blue-300 border-2 border-transparent transition-all">
                                        <input type="radio" name="appointmentType" value="casa" checked={appointmentType === 'casa'} onChange={() => setAppointmentType('casa')} className="sr-only" />
                                        Uso Apartamento
                                    </Label>
                                </div>
                            </div>
                            {appointmentType === 'casa' && (
                                <div className="space-y-2">
                                    <Label htmlFor="house-number" className="font-semibold">Número do Apartamento:</Label>
                                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                        {Array.from({ length: 11 }, (_, i) => i + 1).map(num => {
                                            // Check status for this specific house in the selected range
                                            let status: 'livre' | 'ocupado' | 'pendente' = 'livre';

                                            if (dateRange?.from) {
                                                const checkStart = dateRange.from;
                                                const checkEnd = dateRange.to || dateRange.from;

                                                // Check against allAppointments
                                                for (const app of allAppointments) {
                                                    if (app.type === 'casa' && app.house_number === num && app.status !== 'rejeitado' && app.start_date && app.end_date) {
                                                        const appStart = parseSupabaseDate(app.start_date);
                                                        const appEnd = parseSupabaseDate(app.end_date);

                                                        // Check overlap using date-fns helper for accuracy
                                                        const isOverlapping = areIntervalsOverlapping(
                                                            { start: checkStart, end: checkEnd },
                                                            { start: appStart, end: appEnd },
                                                            { inclusive: true }
                                                        );

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
                                                        flex flex-col items-center justify-center p-2 rounded-md border text-sm font-medium transition-all
                                                        ${houseNumber === num ? 'ring-2 ring-blue-600 border-blue-600 z-10' : ''}
                                                        ${status === 'livre' ? 'bg-green-100 border-green-200 text-green-800 hover:bg-green-200 cursor-pointer' : ''}
                                                        ${status === 'ocupado' ? 'bg-red-200 border-red-300 text-red-900 opacity-80 cursor-not-allowed' : ''}
                                                        ${status === 'pendente' ? 'bg-slate-200 border-slate-300 text-slate-700 opacity-90 cursor-not-allowed' : ''}
                                                    `}
                                                    title={`Apartamento ${num} - ${status.charAt(0).toUpperCase() + status.slice(1)}`}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                                                    Apto {num}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            <Button className="w-full" onClick={handleBooking} disabled={!dateRange?.from || isSubmitting || isLoading}>
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
                    <h2 className="text-3xl font-bold mb-4">Seu Histórico</h2>
                    <Card>
                        <CardContent className="p-0">
                            {/* Mobile View: Cards */}
                            <div className="grid grid-cols-1 gap-4 md:hidden p-4">
                                {isLoading ? (
                                    <div className="flex justify-center p-4"><Loader2 className="h-8 w-8 animate-spin" /></div>
                                ) : userAppointments.length > 0 ? (
                                    userAppointments.map((app) => (
                                        <Card key={app.id} className="shadow-sm border">
                                            <CardHeader className="p-4 pb-2">
                                                <div className="flex justify-between items-start">
                                                    <CardTitle className="text-base font-bold">
                                                        {app.start_date && app.end_date ?
                                                            `${format(parseSupabaseDate(app.start_date), "dd/MM/yy")} - ${format(parseSupabaseDate(app.end_date), "dd/MM/yy")}`
                                                            : 'Data Inválida'
                                                        }
                                                    </CardTitle>
                                                    <Badge variant={app.status === 'aprovado' ? 'default' : (app.status === 'pendente' ? 'secondary' : 'destructive')} className={app.status === 'aprovado' ? 'bg-green-600' : ''}>
                                                        {app.status}
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-4 pt-2 text-sm">
                                                <span className="font-semibold text-gray-600">Tipo: </span>
                                                <span className="capitalize">{app.type === 'casa' ? `Apto ${app.house_number}` : 'Lazer'}</span>
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                    <p className="text-center text-muted-foreground">Nenhum agendamento encontrado.</p>
                                )}
                            </div>

                            {/* Desktop View: Table */}
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader><TableRow><TableHead>Período</TableHead><TableHead>Tipo</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            <TableRow><TableCell colSpan={3} className="h-24 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></TableCell></TableRow>
                                        ) : userAppointments.length > 0 ? (
                                            userAppointments.map((app) => (
                                                <TableRow key={app.id}>
                                                    <TableCell className="font-medium">
                                                        {app.start_date && app.end_date ?
                                                            `${format(parseSupabaseDate(app.start_date), "dd/MM/yy")} - ${format(parseSupabaseDate(app.end_date), "dd/MM/yy")}`
                                                            : 'Data Inválida'
                                                        }
                                                    </TableCell>
                                                    <TableCell className="capitalize">{app.type === 'casa' ? `Apto ${app.house_number}` : 'Lazer'}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={app.status === 'aprovado' ? 'default' : (app.status === 'pendente' ? 'secondary' : 'destructive')} className={app.status === 'aprovado' ? 'bg-green-600' : ''}>
                                                            {app.status}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow><TableCell colSpan={3} className="h-24 text-center">Nenhum agendamento encontrado.</TableCell></TableRow>
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