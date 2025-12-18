"use client";

import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { addDays, differenceInDays, eachDayOfInterval } from "date-fns";

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
    const [formMessage, setFormMessage] = React.useState<{type: 'error' | 'success', text: string} | null>(null);

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

    const processAppointmentsForCalendar = (appointments: Appointment[]) => {
      let pending: Date[] = [];
      let approvedLazer: Date[] = [];
      const approvedCasaCount: { [key: string]: number } = {};

      appointments.forEach(app => {
          if (!app.start_date || !app.end_date) return;
          const interval = eachDayOfInterval({ start: new Date(app.start_date), end: new Date(app.end_date) });
          
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
      
      const fullyBooked = Object.keys(approvedCasaCount).filter(date => approvedCasaCount[date] >= 11).map(dateStr => new Date(dateStr));

      setPendingDates(pending);
      setApprovedLazerDates(approvedLazer);
      setFullyBookedCasaDates(fullyBooked);
  };

    const isDateDisabled = (date: Date): boolean => {
        const dateString = format(date, 'yyyy-MM-dd');
        const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
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
        if (range?.from && range.to) {
            if (differenceInDays(range.to, range.from) > 3) {
                setFormMessage({ type: 'error', text: 'Você só pode selecionar no máximo 4 dias.' });
                setDateRange({ from: range.from, to: addDays(range.from, 3) });
                return;
            }
        }
        setFormMessage(null);
        setDateRange(range);
    }

    const handleBooking = async () => {
        setFormMessage(null);
        setIsSubmitting(true);

        if (!dateRange?.from || !dateRange.to) {
            setFormMessage({ type: 'error', text: "Por favor, selecione um período de datas." });
            setIsSubmitting(false);
            return;
        }
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

        // Fetch user's role to determine initial status
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profileError || !profileData) {
            setFormMessage({ type: 'error', text: 'Erro ao verificar o papel do usuário.' });
            setIsSubmitting(false);
            return;
        }

        const initialStatus = profileData.role === 'admin' ? 'aprovado' : 'pendente';

        try {
            const { error } = await supabase
                .from('appointments')
                .insert({ 
                    user_id: user.id, 
                    start_date: format(dateRange.from, "yyyy-MM-dd"),
                    end_date: format(dateRange.to, "yyyy-MM-dd"),
                    status: initialStatus,
                    type: appointmentType,
                    house_number: appointmentType === 'casa' ? houseNumber : null,
                })
                .single();
            
            if (error) throw error;
            
            setFormMessage({ type: 'success', text: "Solicitação enviada com sucesso!" });
            setDateRange(undefined);
            setHouseNumber(undefined);
            fetchPageData();

        } catch(error: any) {
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
                            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-white border"></div> Livre</div>
                            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full" style={modifiersStyles.pending}></div> Em Análise</div>
                            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full" style={modifiersStyles.approved}></div> Ocupado</div>
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
                                        <input type="radio" name="appointmentType" value="casa" checked={appointmentType === 'casa'} onChange={() => setAppointmentType('casa')} className="sr-only"/>
                                        Uso Casa
                                    </Label>
                                </div>
                            </div>
                            {appointmentType === 'casa' && (
                                <div className="space-y-2">
                                    <Label htmlFor="house-number" className="font-semibold">Número da Casa:</Label>
                                    <select id="house-number" value={houseNumber || ''} onChange={(e) => setHouseNumber(Number(e.target.value))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                        <option value="" disabled>Selecione uma casa</option>
                                        {Array.from({ length: 11 }, (_, i) => i + 1).map(num => (
                                            <option key={num} value={num}>Casa {num}</option>
                                        ))}
                                    </select>
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
                                                    `${format(new Date(app.start_date), "dd/MM/yy")} - ${format(new Date(app.end_date), "dd/MM/yy")}`
                                                    : 'Data Inválida'
                                                }
                                            </TableCell>
                                            <TableCell className="capitalize">{app.type === 'casa' ? `Casa ${app.house_number}` : 'Lazer'}</TableCell>
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
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}