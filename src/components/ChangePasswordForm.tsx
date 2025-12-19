"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, KeyRound } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export function ChangePasswordForm() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setMessage(null);

        const formData = new FormData(event.currentTarget);
        const newPassword = formData.get("newPassword") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        if (newPassword !== confirmPassword) {
            setMessage({ text: "As senhas não coincidem.", type: 'error' });
            setIsLoading(false);
            return;
        }

        if (newPassword.length < 6) {
            setMessage({ text: "A senha deve ter pelo menos 6 caracteres.", type: 'error' });
            setIsLoading(false);
            return;
        }

        const { error } = await supabase.auth.updateUser({ password: newPassword });

        if (error) {
            setMessage({ text: error.message, type: 'error' });
        } else {
            setMessage({ text: "Senha alterada com sucesso!", type: 'success' });
            setTimeout(() => setIsOpen(false), 2000);
        }
        setIsLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <KeyRound className="mr-2 h-4 w-4" />
                    Alterar Senha
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Alterar Senha</DialogTitle>
                    <DialogDescription>
                        Defina sua nova senha de acesso.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="newPassword">Nova Senha</Label>
                            <Input id="newPassword" name="newPassword" type="password" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                            <Input id="confirmPassword" name="confirmPassword" type="password" required />
                        </div>
                        {message && (
                            <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                                {message.text}
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar Nova Senha
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
