
"use client";

import { SchedulingSystem } from "@/components/SchedulingSystem";

export default function MakeBookingPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Fazer um Agendamento</h1>
      <p className="text-muted-foreground">
        Use o sistema abaixo para fazer um agendamento como se fosse um associado.
      </p>
      <SchedulingSystem showHistory={false} />
    </div>
  );
}
