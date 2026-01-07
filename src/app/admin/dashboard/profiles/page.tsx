"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Profile = {
    id: string;
    nome_completo: string;
    email: string;
    profile_image: string | null;
    pending_profile_image: string | null;
};

export default function ProfilesApprovalsPage() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    async function fetchPendingProfiles() {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .not('pending_profile_image', 'is', null);

        if (error) {
            console.error(error);
            alert("Erro ao buscar perfis.");
        } else {
            setProfiles(data || []);
        }
        setIsLoading(false);
    }

    useEffect(() => {
        fetchPendingProfiles();
    }, []);

    async function handleApprove(profile: Profile) {
        if (!confirm(`Aprovar a foto de ${profile.nome_completo}?`)) return;
        setProcessingId(profile.id);

        try {
            // 1. Move pending to active
            const { error } = await supabase
                .from('profiles')
                .update({
                    profile_image: profile.pending_profile_image,
                    pending_profile_image: null
                })
                .eq('id', profile.id);

            if (error) throw error;

            // Remove from local list
            setProfiles(prev => prev.filter(p => p.id !== profile.id));

        } catch (error: any) {
            alert(`Erro ao aprovar: ${error.message}`);
        } finally {
            setProcessingId(null);
        }
    }

    async function handleReject(profile: Profile) {
        if (!confirm(`Rejeitar a foto de ${profile.nome_completo}?`)) return;
        setProcessingId(profile.id);

        try {
            // 1. Clear pending
            const { error } = await supabase
                .from('profiles')
                .update({
                    pending_profile_image: null
                })
                .eq('id', profile.id);

            if (error) throw error;

            // Remove from local list
            setProfiles(prev => prev.filter(p => p.id !== profile.id));

        } catch (error: any) {
            alert(`Erro ao rejeitar: ${error.message}`);
        } finally {
            setProcessingId(null);
        }
    }

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">Aprovação de Fotos de Perfil</h1>

            {profiles.length === 0 ? (
                <div className="text-center p-8 bg-white rounded-lg shadow border border-dashed text-slate-500">
                    Nenhuma solicitação pendente.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {profiles.map(profile => (
                        <Card key={profile.id} className="overflow-hidden">
                            <CardHeader className="bg-slate-50 border-b pb-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <User className="w-5 h-5 text-slate-500" />
                                    {profile.nome_completo}
                                </CardTitle>
                                <p className="text-xs text-slate-500 font-normal">{profile.email}</p>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-around gap-4">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Atual</div>
                                        <Avatar className="w-24 h-24 border-2 border-slate-200">
                                            <AvatarImage src={profile.profile_image || ''} className="object-cover" />
                                            <AvatarFallback><User className="w-10 h-10 text-slate-300" /></AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="text-xs font-bold text-blue-600 uppercase tracking-wider animate-pulse">Nova</div>
                                        <Avatar className="w-24 h-24 border-4 border-blue-500 shadow-lg">
                                            <AvatarImage src={profile.pending_profile_image || ''} className="object-cover" />
                                            <AvatarFallback><Loader2 className="w-10 h-10 animate-spin" /></AvatarFallback>
                                        </Avatar>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-slate-50 border-t p-4 flex gap-3">
                                <Button
                                    className="flex-1 bg-red-100 text-red-700 hover:bg-red-200 border-red-200"
                                    variant="outline"
                                    onClick={() => handleReject(profile)}
                                    disabled={!!processingId}
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Rejeitar
                                </Button>
                                <Button
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => handleApprove(profile)}
                                    disabled={!!processingId}
                                >
                                    {processingId === profile.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                                    Aprovar
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
