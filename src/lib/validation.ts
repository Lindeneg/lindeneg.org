import z from "zod";

export const toBool = (v: unknown) => v === "1" || v === "on" || v === "true" || v === true;

// an unchecked checkbox sends no field at all; since zod 4.6 a missing key must be marked optional
export const checkbox = () => z.unknown().optional().transform(toBool);

export const requiredText = () => z.string().trim().min(1, "Required");

export const optStr = (v: unknown) => (typeof v === "string" && v.trim() !== "" ? v : undefined);

export function fieldErrors(error: z.ZodError): Record<string, string> {
    const out: Record<string, string> = {};
    for (const issue of error.issues) {
        const key = issue.path.join(".") || "_";
        if (!out[key]) out[key] = issue.message;
    }
    return out;
}
