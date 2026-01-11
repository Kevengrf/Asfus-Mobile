
import { supabase } from "@/lib/supabase/client";

/**
 * Logs an admin action to the audit_logs table.
 * 
 * @param action Description of the action (e.g., "Approve User", "Run Lottery")
 * @param target The target of the action (e.g., "User: John Doe", "Appointment #123")
 * @param details Optional JSON object with more details
 */
export async function logAction(action: string, target: string, details?: any) {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            console.warn("Attempted to log action without authenticated user.");
            return;
        }

        const { error } = await supabase
            .from('audit_logs')
            .insert({
                action,
                admin_id: user.id,
                target,
                details
            });

        if (error) {
            console.error("Failed to log action:", error);
        }
    } catch (err) {
        console.error("Unexpected error logging action:", err);
    }
}


