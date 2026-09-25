// letters that don't decompose into an ascii base letter plus a diacritic
const TRANSLITERATE: Record<string, string> = {æ: "ae", ø: "oe", å: "aa", ß: "ss", đ: "d", ł: "l", œ: "oe", þ: "th"};

// e.g. "Blåbær & Crème Brûlée" -> "blaabaer-creme-brulee"
export function slugify(text: string): string {
    return text
        .trim()
        .toLowerCase()
        .replace(/[æøåßđłœþ]/g, (c) => TRANSLITERATE[c])
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}
