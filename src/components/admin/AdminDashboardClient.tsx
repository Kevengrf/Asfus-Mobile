"use client";

import { ProfileHeader } from "@/components/ProfileHeader";
import { ApprovalsClient } from "@/components/admin/ApprovalsClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck } from "lucide-react";

// Types need to be consistent with ApprovalsClient props
type PendingProfile = {
    id: string;
    nome_completo: string;
    email: string;
    cpf: string | null;
    telefone: string | null;
    status: 'pendente'; // We know they are pending
    created_at: string;
    role: string;
};

export default function AdminDashboardPage({ pendingProfiles }: { pendingProfiles: PendingProfile[] }) {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Left Column: Admin ID Card */}
                <div className="lg:col-span-4 lg:sticky lg:top-8">
                    <div className="flex justify-center w-full">
                        <ProfileHeader />
                    </div>
                </div>

                {/* Right Column: Approvals */}
                <div className="lg:col-span-8">
                    <Card className="border-none shadow-none bg-transparent">
                        <CardHeader className="px-0 pt-0">
                            <CardTitle className="text-2xl font-bold flex items-center gap-2 text-slate-800">
                                <UserCheck className="w-6 h-6 text-blue-600" />
                                Aprovações Pendentes
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-0">
                            <ApprovalsClient pendingProfiles={pendingProfiles} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
