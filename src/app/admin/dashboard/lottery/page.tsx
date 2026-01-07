"use client";

import { AdminContentManager } from "@/components/admin/AdminContentManager";
import { getLotteryPeriods, createLotteryPeriod, deleteLotteryPeriod } from "@/lib/supabase/client";

interface LotteryPeriod {
    id: string; // UUID
    name: string;
    start_date: string;
    end_date: string;
    created_at: string;
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

    return (
        <AdminContentManager<LotteryPeriod>
            contentType="Períodos de Sorteio"
            fetchFunction={getLotteryPeriods}
            createFunction={createLotteryPeriod}
            deleteFunction={deleteLotteryPeriod}
            fields={lotteryFields}
            displayFields={lotteryDisplayFields}
        />
    );
}
