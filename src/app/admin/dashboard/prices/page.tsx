
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";

type Setting = {
    key: string;
    value: number;
    description: string;
};

const DEFAULT_SETTINGS = [
    { key: 'price_day_use', label: 'Preço Day-use (Base)' },
    { key: 'price_evento', label: 'Preço Evento (Base)' },
    { key: 'price_apartamento', label: 'Preço Apartamento (Base)' },
    { key: 'price_guest', label: 'Preço por Convidado' },
    { key: 'price_fine', label: 'Valor Padrão de Multa' },
];

export default function PricesPage() {
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setIsLoading(true);
        const { data } = await supabase.from('system_settings').select('*');
        if (data) {
            const map: Record<string, string> = {};
            data.forEach((s: Setting) => {
                // If value is 0, show empty string? User asked "comece zerado", possibly meaning empty.
                // Or just show 0 but as text so it can be deleted. 
                // "sem o numero 0" -> If it is 0, show "".
                map[s.key] = s.value === 0 ? "" : s.value.toString();
            });
            setSettings(map);
        }
        setIsLoading(false);
    };

    const handleChange = (key: string, value: string) => {
        // Validate it's a number-like string (allows comma and dot)
        // Allow empty string to delete everything
        // Allow partial inputs like "10," or "10."
        const validChars = /^[0-9.,]*$/;
        if (validChars.test(value)) {
            setSettings(prev => ({ ...prev, [key]: value }));
        }
    };

    const handleSave = async () => {
        setIsSaving(true);

        const updates = Object.entries(settings).map(([key, value]) => {
            // Replace comma with dot for parsing
            const numericValue = parseFloat(value.replace(',', '.')) || 0;
            return {
                key,
                value: numericValue,
                description: DEFAULT_SETTINGS.find(d => d.key === key)?.label || ''
            };
        });

        const { error } = await supabase.from('system_settings').upsert(updates);

        if (error) {
            alert("Erro ao salvar preços.");
            console.error(error);
        } else {
            alert("Preços atualizados com sucesso!");
            // Refresh to clean up format if needed, or just keep as is
            fetchSettings();
        }
        setIsSaving(false);
    };

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Tabela de Preços</CardTitle>
                <CardDescription>Defina os valores cobrados por serviços e multas. Deixe em branco para R$ 0,00.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                    {DEFAULT_SETTINGS.map((item) => (
                        <div key={item.key} className="flex flex-col gap-2">
                            <Label htmlFor={item.key}>{item.label}</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-500">R$</span>
                                <Input
                                    id={item.key}
                                    type="text"
                                    inputMode="decimal"
                                    className="pl-10"
                                    placeholder="0,00"
                                    value={settings[item.key] ?? ""}
                                    onChange={(e) => handleChange(item.key, e.target.value)}
                                />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto">
                        {isSaving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                        Salvar Alterações
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
