
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Logs an admin action from the SERVER side (Server Actions).
 * 
 * @param adminId The ID of the admin performing the action (must be passed explicitly as we might not have context)
 * @param action Description of the action
 * @param target The target of the action
 * @param details Optional details
 */
export async function logActionServer(adminId: string, action: string, target: string, details?: any) {
    try {
        if (!adminId) {
            console.warn("Attempted to log server action without adminId.");
            return;
        }

        const { error } = await supabaseAdmin
            .from('audit_logs')
            .insert({
                action,
                admin_id: adminId,
                target,
                details
            });

        if (error) {
            console.error("Failed to log server action:", error);
        }
    } catch (err) {
        console.error("Unexpected error logging server action:", err);
    }
}
