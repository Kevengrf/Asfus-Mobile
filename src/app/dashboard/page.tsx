
"use client";

import { SchedulingSystem } from "@/components/SchedulingSystem";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/admin/actions";

export default function MemberDashboardPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="space-y-2 mb-12">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold">Agendamento de Espaços</h1>
            <p className="text-lg text-muted-foreground">
              Selecione um período de até 4 dias para lazer ou para uma das nossas 11 casas.
            </p>
          </div>
          <div className="flex gap-2">
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
