"use client";

import * as React from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

type Appointment = {
    id: number;
    booking_date: string;
    status: 'pendente' | 'aprovado' | 'rejeitado';
};

export default function MemberDashboardPage() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [userAppointments, setUserAppointments] = React.useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [formMessage, setFormMessage] = React.useState<{type: 'error' | 'success', text: string} | null>(null);

  const fetchUserData = React.useCallback(async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: appointments, error } = await supabase
            .from('appointments')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        
        if (appointments) {
            setUserAppointments(appointments);
        }
    }
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleBooking = async () => {
    setFormMessage(null);
    if (!date) {
      setFormMessage({ type: 'error', text: "Por favor, selecione uma data." });
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        setFormMessage({ type: 'error', text: "Você precisa estar logado para agendar." });
        return;
    }
    const formattedDate = format(date, "yyyy-MM-dd");
    const { data, error } = await supabase
      .from('appointments')
      .insert({ user_id: user.id, booking_date: formattedDate, status: 'pendente' })
      .select()
      .single();
    
    if (error) {
        setFormMessage({ type: 'error', text: `Erro ao agendar: ${error.message}` });
    } else {
        setFormMessage({ type: 'success', text: "Solicitação enviada com sucesso!" });
        // Adiciona o novo agendamento à lista sem precisar recarregar
        if (data) {
            setUserAppointments(prev => [data as Appointment, ...prev]);
        }
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 space-y-12">
      {/* Seção de Agendamento */}
      <div>
        <h1 className="text-4xl font-bold">Agendamento de Espaços</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Selecione uma data para reservar um de nossos espaços.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-4 flex justify-center">
              <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} />
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Sua Reserva</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="font-semibold">Data Selecionada:</p>
                <p className="text-lg text-blue-600 font-bold">{date ? format(date, "PPP") : "Nenhuma"}</p>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button className="w-full" onClick={handleBooking} disabled={!date || isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar Agendamento
              </Button>
              {formMessage && <p className={`text-sm ${formMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{formMessage.text}</p>}
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Seção de Histórico */}
      <div>
        <h2 className="text-3xl font-bold mb-4">Seu Histórico</h2>
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data Solicitada</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={2} className="h-24 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></TableCell></TableRow>
                        ) : userAppointments.length > 0 ? (
                            userAppointments.map((app) => (
                            <TableRow key={app.id}>
                                <TableCell className="font-medium">{format(new Date(app.booking_date), "PPP")}</TableCell>
                                <TableCell>
                                <Badge variant={app.status === 'aprovado' ? 'default' : (app.status === 'pendente' ? 'secondary' : 'destructive')}
                                        className={app.status === 'aprovado' ? 'bg-green-600' : ''}>
                                    {app.status}
                                </Badge>
                                </TableCell>
                            </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={2} className="h-24 text-center">Nenhum agendamento encontrado.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}