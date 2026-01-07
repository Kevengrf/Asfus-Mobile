
"use client";

import { SchedulingSystem } from "@/components/SchedulingSystem";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/admin/actions";

export default function MemberDashboardPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="space-y-2 mb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Agendamento de Espaços</h1>
            <p className="text-base md:text-lg text-muted-foreground">
              Selecione um período de até 7 dias para lazer ou para uma das nossas 11 apartamentos.
            </p>
          </div>
          <div className="flex gap-2 w-full md:w-auto justify-start md:justify-end">
            <ChangePasswordForm />
            <form action={logout}>
              <Button type="submit" variant="destructive">
                Sair
              </Button>
            </form>
          </div>
        </div>
      </div>
      <SchedulingSystem showHistory={true} />
    </div>
  );
}
