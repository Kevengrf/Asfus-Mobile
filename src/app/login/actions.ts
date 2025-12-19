'use server';

import { supabaseAdmin } from "@/lib/supabase/admin";

export async function getEmailByCpf(cpf: string) {
    // Normalize CPF: remove non-numeric characters
    const cleanCpf = cpf.replace(/\D/g, '');

    // Calculate possibilities: Original, Clean, and Formatted (if 11 digits)
    let possibilities = [cpf, cleanCpf];

    if (cleanCpf.length === 11) {
        const formatted = cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        possibilities.push(formatted);
    }

    // Remove duplicates
    possibilities = Array.from(new Set(possibilities));

    console.log(`[getEmailByCpf] Searching possibilities: ${JSON.stringify(possibilities)}`);

    // Use .in() for clean syntax and flexible matching
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('email, cpf')
        .in('cpf', possibilities)
        .maybeSingle();

    if (error) {
        console.error('[getEmailByCpf] Error fetching email by CPF:', error);
        return null;
    }

    if (!data) {
        console.log('[getEmailByCpf] No profile found for given CPF.');
    } else {
        console.log(`[getEmailByCpf] Found profile: ${data.email}`);
    }

    return data?.email;
}
