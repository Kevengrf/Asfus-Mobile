"use client";

import React, { useState, useEffect } from 'react';
import { AdminContentManager } from "@/components/admin/AdminContentManager";
import { getLotteryPeriods, createLotteryPeriod, deleteLotteryPeriod, supabase } from "@/lib/supabase/client";
import { logAction } from "@/lib/audit";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy, Play, Users, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LotteryPeriod {
    id: string; // UUID
    name: string;
    start_date: string;
    end_date: string;
    created_at: string;
}

interface Participant {
    id: number;
    user_id: string;
    profiles: { nome_completo: string; cpf: string };
    status: string;
    house_number?: number;
}

export default function AdminLotteryPage() {
    const lotteryFields = [
        { name: 'name', label: 'Nome do Sorteio', type: 'text', required: true, placeholder: 'Ex: Carnaval 2026' },
        { name: 'start_date', label: 'Data de Início', type: 'date', required: true },
        { name: 'end_date', label: 'Data de Término', type: 'date', required: true },
    ];

    const lotteryDisplayFields = [
        { key: 'name', label: 'Nome' },
        { key: 'start_date', label: 'Início', type: 'date' },
        { key: 'end_date', label: 'Término', type: 'date' },
    ];

    // Execution State
    const [periods, setPeriods] = useState<LotteryPeriod[]>([]);
    const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [winners, setWinners] = useState<Participant[]>([]);
    const [loadingParticipants, setLoadingParticipants] = useState(false);
    const [isSpinning, setIsSpinning] = useState(false);
    const [currentName, setCurrentName] = useState<string>('');
    const [spinRound, setSpinRound] = useState(0);

    useEffect(() => {
        loadPeriods();
    }, []);

    const loadPeriods = async () => {
        const data = await getLotteryPeriods();
        setPeriods(data as any);
    };

    const fetchParticipants = async () => {
        if (!selectedPeriodId) return;
        setLoadingParticipants(true);
        setWinners([]);
        setSpinRound(0);

        const period = periods.find(p => p.id === selectedPeriodId);
        if (!period) return;

        // Fetch appointments that are 'em_sorteio' and overlap with period OR are just in that range?
        // Assuming 'em_sorteio' status is key.
        // We filter by date range to ensure they belong to THIS lottery if there are multiple overlapping (unlikely but safe).

        const { data, error } = await supabase
            .from('appointments')
            .select(`
                id, 
                user_id, 
                status,
                profiles:user_id (nome_completo, cpf)
            `)
            .eq('status', 'em_sorteio')
            .gte('start_date', period.start_date)
            .lte('end_date', period.end_date);

        if (error) {
            console.error(error);
            alert("Erro ao buscar participantes.");
        } else {
            // Remove duplicates (same user multiple requests? Or treat each request as a ticket?)
            // User requirement: "multiple associates can book... if bookings exceed availability, lottery".
            // Assuming each booking is a ticket.
            setParticipants(data as any);
        }
        setLoadingParticipants(false);
    };

    const runLottery = async () => {
        if (participants.length === 0) return;
        setIsSpinning(true);
        setWinners([]); // Reset winners

        // We need to pick 11 winners unique by USER (or booking? usually user).
        // Let's assume unique USERS should win.
        // Convert participants to unique users list? Or just unique users win?
        // Let's assume Unique Users.
        const uniqueUsers = Array.from(new Set(participants.map(p => p.user_id)))
            .map(id => participants.find(p => p.user_id === id)!);

        const totalApartments = 11;
        const totalWinners = Math.min(uniqueUsers.length, totalApartments);

        let availableCandidates = [...uniqueUsers];
        let selectedWinners: Participant[] = [];

        // Animation Loop for EACH winner (1 to 11)
        // Actually, running 11 separate spins might be too long.
        // Let's run a faster unified animation.

        for (let i = 1; i <= totalWinners; i++) {
            setSpinRound(i);
            // Spin animation for this house
            await spinForWinner(availableCandidates, i);

            // Actually pick winner
            const randomIndex = Math.floor(Math.random() * availableCandidates.length);
            const winner = availableCandidates[randomIndex];

            // Assign House Number
            winner.house_number = i;
            selectedWinners.push(winner);

            // Remove from candidates
            availableCandidates.splice(randomIndex, 1);
            setWinners([...selectedWinners]);
        }

        setIsSpinning(false);
        setSpinRound(0);
        setCurrentName('Sorteio Finalizado!');

        // Update DB
        if (confirm(`Confirmar o sorteio de ${selectedWinners.length} ganhadores? Isso atualizará o status no banco de dados.`)) {
            await finalizeLottery(selectedWinners, uniqueUsers);
        }
    };

    const spinForWinner = (candidates: Participant[], houseNum: number) => {
        return new Promise<void>(resolve => {
            let duration = 1500; // 1.5s per winner
            let interval = 50;
            let elapsed = 0;

            const timer = setInterval(() => {
                const randomName = candidates[Math.floor(Math.random() * candidates.length)].profiles.nome_completo;
                setCurrentName(`Apto ${houseNum}: ${randomName}`);
                elapsed += interval;
                if (elapsed >= duration) {
                    clearInterval(timer);
                    resolve();
                }
            }, interval);
        });
    };

    const finalizeLottery = async (winners: Participant[], allUniqueCandidates: Participant[]) => {
        // 1. Update Winners -> 'aprovado', house_number
        // 2. Update Losers -> 'rejeitado'

        setLoadingParticipants(true);
        const winnerIds = winners.map(w => w.id);
        const loserIds = allUniqueCandidates.filter(c => !winnerIds.includes(c.id)).map(c => c.id);

        // We need to match the winner to the specific APPOINTMENT ID. We have it in 'winners'.

        for (const w of winners) {
            await supabase
                .from('appointments')
                .update({ status: 'aprovado', house_number: w.house_number, is_lottery: true }) // Keep is_lottery true
                .eq('id', w.id);
        }

        // For losers, we update ALL 'em_sorteio' appointments for those users in this period?
        // Or just the specific ones we fetched?
        // Let's update the fetched ones that didn't win.
        // Wait, 'allUniqueCandidates' only has ONE appointment per user.
        // If a user made multiple requests, we should technically Reject the others?
        // Simple approach: Reject all 'em_sorteio' appointments for the losers in this period id list.

        // Actually simplest: Reject ALL appointments that are currently 'em_sorteio' 
        // AND belong to the period AND are NOT in the winner list?
        // Or just iterate the 'participants' list.

        const allParticipantIds = participants.map(p => p.id);
        const loserAppointmentIds = allParticipantIds.filter(id => !winnerIds.includes(id));

        if (loserAppointmentIds.length > 0) {
            await supabase
                .from('appointments')
                .update({ status: 'rejeitado' })
                .in('id', loserAppointmentIds);
        }

        alert("Sorteio finalizado e dados atualizados!");

        // Log Action
        await logAction('Executar Sorteio', `Periodo: ${periods.find(p => p.id === selectedPeriodId)?.name}`, {
            winners_count: winners.length,
            period_id: selectedPeriodId
        });

        setLoadingParticipants(false);
        setParticipants([]); // Clear
        setWinners([]);
    };

    return (
        <div className="space-y-12 pb-20">
            {/* Gerenciar Períodos */}
            <AdminContentManager<LotteryPeriod>
                contentType="Períodos de Sorteio"
                fetchFunction={getLotteryPeriods}
                createFunction={createLotteryPeriod}
                deleteFunction={deleteLotteryPeriod}
                fields={lotteryFields}
                displayFields={lotteryDisplayFields}
            />

            <hr className="border-gray-200" />

            {/* Executar Sorteio */}
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Trophy className="text-yellow-500" /> Executar Sorteio
                    </h2>
                    <p className="text-gray-500">Selecione um período para visualizar os inscritos e realizar o sorteio.</p>
                </div>

                <div className="flex gap-4 items-end">
                    <div className="space-y-2 w-full max-w-xs">
                        <label className="text-sm font-medium">Período</label>
                        <Select onValueChange={setSelectedPeriodId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                {periods.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={fetchParticipants} disabled={!selectedPeriodId || loadingParticipants} className="mb-0.5">
                        {loadingParticipants ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Users className="w-4 h-4 mr-2" />}
                        Carregar Participantes
                    </Button>
                </div>

                {participants.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">
                        {/* Lista de Participantes */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex justify-between items-center">
                                    Participantes <Badge>{participants.length}</Badge>
                                </CardTitle>
                                <CardDescription>Inscrições &quot;Em Sorteio&quot;</CardDescription>
                            </CardHeader>
                            <CardContent className="h-96 overflow-y-auto">
                                <ul className="space-y-2">
                                    {participants.map((p, i) => (
                                        <li key={p.id} className="flex justify-between items-center p-2 bg-slate-50 rounded border text-sm">
                                            <span>{p.profiles?.nome_completo || 'Sem nome'}</span>
                                            <span className="text-muted-foreground text-xs">{p.profiles?.cpf}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        {/* Área do Sorteio */}
                        <Card className="bg-slate-900 text-white border-slate-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-yellow-500">
                                    <RefreshCw className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
                                    Roleta da Sorte
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center justify-center space-y-8 min-h-[300px]">

                                {/* Current Spin Display */}
                                <div className="text-center space-y-2">
                                    <div className="text-sm p-4 text-slate-400">
                                        {spinRound > 0 ? `Sorteando Apartamento ${spinRound}...` : (winners.length > 0 ? "Sorteio Finalizado!" : "Aguardando início...")}
                                    </div>
                                    <div className="text-2xl md:text-4xl font-black text-yellow-400 h-16 flex items-center justify-center bg-slate-800 rounded-xl px-6 border-2 border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
                                        {currentName || "---"}
                                    </div>
                                </div>

                                <Button
                                    size="lg"
                                    onClick={runLottery}
                                    disabled={isSpinning || winners.length > 0}
                                    className="bg-yellow-500 text-slate-900 hover:bg-yellow-400 font-bold px-8 text-lg"
                                >
                                    {winners.length > 0 ? "Sorteio Realizado" : "INICIAR SORTEIO"}
                                </Button>

                                {/* Winners List */}
                                {winners.length > 0 && (
                                    <div className="w-full space-y-2 mt-4">
                                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Ganhadores</p>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            {winners.map((w, i) => (
                                                <div key={w.id} className="flex items-center gap-2 bg-green-900/40 p-2 rounded border border-green-500/30">
                                                    <div className="w-6 h-6 rounded-full bg-green-500 text-slate-900 font-bold flex items-center justify-center shrink-0">
                                                        {w.house_number}
                                                    </div>
                                                    <span className="truncate">{w.profiles?.nome_completo}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
