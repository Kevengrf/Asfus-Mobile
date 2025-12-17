
"use client";

import { SchedulingSystem } from "@/components/SchedulingSystem";

export default function MemberDashboardPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="space-y-2 mb-12">
        <h1 className="text-4xl font-bold">Agendamento de Espaços</h1>
        <p className="text-lg text-muted-foreground">
          Selecione um período de até 4 dias para lazer ou para uma das nossas 11 casas.
        </p>
      </div>
      <SchedulingSystem showHistory={true} />
    </div>
  );
}
