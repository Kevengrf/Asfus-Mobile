
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Loader2, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Profile {
    id: string;
    nome_completo: string;
    cpf: string;
    email: string;
    profile_image: string | null;
    role: string;
    status: string;
}

export default function FinesPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
    const [amount, setAmount] = useState("");
    const [reason, setReason] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Search Profiles
    useEffect(() => {
        const search = async () => {
            if (searchTerm.length < 3) return;
            setIsLoading(true);
            const { data } = await supabase
                .from("profiles")
                .select("*")
                .or(`nome_completo.ilike.%${searchTerm}%,cpf.ilike.%${searchTerm}%`)
                .eq("role", "user") // Only fine users
                .limit(5);

            setProfiles(data || []);
            setIsLoading(false);
        };

        const debounce = setTimeout(search, 500);
        return () => clearTimeout(debounce);
    }, [searchTerm]);

    const handleApplyFine = async () => {
        if (!selectedProfile || !amount || !reason) {
            alert("Preencha todos os campos.");
            return;
        }

        setIsSubmitting(true);
        const { error } = await supabase.from("fines").insert({
            user_id: selectedProfile.id,
            amount: parseFloat(amount),
            reason,
            status: "pending"
        });

        if (error) {
            console.error(error);
            alert("Erro ao aplicar multa.");
        } else {
            alert("Multa aplicada com sucesso!");
            setAmount("");
            setReason("");
            setSelectedProfile(null);
            setSearchTerm("");
        }
        setIsSubmitting(false);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Aplicar Multa</CardTitle>
                    <CardDescription>Busque o associado e aplique uma multa manual.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* Search */}
                    <div className="space-y-2">
                        <Label>Buscar Associado (Nome ou CPF)</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Digite para buscar..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        {searchTerm.length >= 3 && (
                            <div className="border rounded-md divide-y mt-2 bg-slate-50">
                                {isLoading ? (
                                    <div className="p-4 text-center"><Loader2 className="animate-spin h-4 w-4 mx-auto" /></div>
                                ) : profiles.length > 0 ? (
                                    profiles.map(p => (
                                        <div
                                            key={p.id}
                                            className="p-3 flex items-center justify-between hover:bg-slate-100 cursor-pointer"
                                            onClick={() => { setSelectedProfile(p); setSearchTerm(""); setProfiles([]); }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={p.profile_image || ''} />
                                                    <AvatarFallback>{p.nome_completo.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium text-sm">{p.nome_completo}</p>
                                                    <p className="text-xs text-muted-foreground">CPF: {p.cpf}</p>
                                                </div>
                                            </div>
                                            <Button size="sm" variant="ghost">Selecionar</Button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-sm text-center text-muted-foreground">Nenhum associado encontrado.</div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Selected Profile DTO */}
                    {selectedProfile && (
                        <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg flex items-center gap-4">
                            <Avatar className="h-12 w-12 border-2 border-white">
                                <AvatarImage src={selectedProfile.profile_image || ''} />
                                <AvatarFallback>{selectedProfile.nome_completo.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <h3 className="font-bold text-blue-900">{selectedProfile.nome_completo}</h3>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-blue-700 mt-1">
                                    <span>CPF: {selectedProfile.cpf}</span>
                                    <span>Email: {selectedProfile.email}</span>
                                    <span className="capitalize">Status: {selectedProfile.status}</span>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedProfile(null)}>X</Button>
                        </div>
                    )}

                    {/* Fine Form */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Valor da Multa (R$)</Label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Motivo</Label>
                            <Input
                                placeholder="Ex: Quebra de vidraça..."
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button
                            onClick={handleApplyFine}
                            disabled={!selectedProfile || isSubmitting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                            Aplicar Multa
                        </Button>
                    </div>

                </CardContent>
            </Card>
        </div>
    );
}
