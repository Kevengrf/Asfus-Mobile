"use client";

import { SchedulingSystem } from "@/components/SchedulingSystem";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/admin/actions";
import { ProfileHeader } from "@/components/ProfileHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LogOut, Settings, CalendarDays } from "lucide-react";

export default function MemberDashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Decorative Header Background */}
      <div className="bg-slate-900 h-48 w-full absolute top-0 left-0 z-0"></div>

      <div className="container mx-auto px-4 pt-8 relative z-10">

        {/* Header Title Space */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center text-white">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Painel do Associado</h1>
            <p className="text-blue-200 text-sm md:text-base">Gerencie sua carteirinha e faça agendamentos.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT COLUMN: ID Card & Actions (Fixed on Desktop?) */}
          <div className="lg:col-span-4 space-y-6 force-light">
            {/* ID Card Component */}
            <div className="flex justify-center lg:justify-start w-full">
              <ProfileHeader />
            </div>

            {/* Quick Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><Settings className="w-5 h-5 text-slate-500" /> Conta</CardTitle>
                <CardDescription>Gerencie suas credenciais</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="w-full">
                  <ChangePasswordForm />
                </div>
                <div className="w-full border-t pt-3">
                  <form action={logout}>
                    <Button type="submit" variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sair do Sistema
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>

            {/* Support / Info Card (Optional placeholder) */}
            <Card className="bg-blue-50 border-blue-100">
              <CardContent className="p-4 text-sm text-blue-800">
                <p>Precisa de ajuda? Entre em contato com a secretaria administrativa para atualizar seus dados cadastrais.</p>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: Scheduling System */}
          <div className="lg:col-span-8 force-light">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="mb-6 border-b pb-4">
                <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                  <CalendarDays className="w-6 h-6 text-blue-600" />
                  Agendamento de Espaços
                </h2>
                Reserve Day-use, Eventos ou Apartamentos.
              </div>

              <SchedulingSystem showHistory={true} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
