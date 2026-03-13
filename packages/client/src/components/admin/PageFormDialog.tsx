import {useState} from "react";
import {slugify, type PageResponse, type CreatePageInput} from "@shared";
import {ApiError} from "@/lib/errors";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Switch} from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import FormField from "./FormField";

interface PageFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    page: PageResponse | null;
    loading: boolean;
    onSubmit: (input: CreatePageInput) => Promise<void>;
}

function initForm(page: PageResponse | null): CreatePageInput {
    if (page)
        return {
            name: page.name,
            slug: page.slug,
            title: page.title,
            description: page.description,
            published: page.published,
        };
    return {name: "", slug: "", title: "", description: "", published: false};
}

export default function PageFormDialog({
    open,
    onOpenChange,
    page,
    loading,
    onSubmit,
}: PageFormDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                {open && <PageForm page={page} loading={loading} onSubmit={onSubmit} />}
            </DialogContent>
        </Dialog>
    );
}

function PageForm({
    page,
    loading,
    onSubmit,
}: Pick<PageFormDialogProps, "page" | "loading" | "onSubmit">) {
    const [form, setForm] = useState(() => initForm(page));
    const [autoSlug, setAutoSlug] = useState(!page);
    const [error, setError] = useState<ApiError | null>(null);

    const setField = <K extends keyof CreatePageInput>(key: K, value: CreatePageInput[K]) => {
        setForm((prev) => {
            const next = {...prev, [key]: value};
            if (key === "name" && autoSlug) next.slug = slugify(value as string);
            return next;
        });
    };

    const fe = (field: string) =>
        error?.isValidation && error.fields?.[field] ? String(error.fields[field]) : undefined;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await onSubmit(form);
        } catch (err) {
            if (err instanceof ApiError) setError(err);
        }
    };

    return (
        <>
            <DialogHeader>
                <DialogTitle>{page ? "Edit Page" : "Create Page"}</DialogTitle>
            </DialogHeader>
            {error && !error.isValidation && (
                <p className="text-sm text-destructive">{error.message}</p>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormField label="Name" error={fe("name")}>
                    <Input value={form.name} onChange={(e) => setField("name", e.target.value)} />
                </FormField>
                <FormField label="Slug" error={fe("slug")}>
                    <Input
                        value={form.slug}
                        onChange={(e) => {
                            setAutoSlug(false);
                            setField("slug", e.target.value);
                        }}
                    />
                </FormField>
                <FormField label="Title" error={fe("title")}>
                    <Input value={form.title} onChange={(e) => setField("title", e.target.value)} />
                </FormField>
                <FormField label="Description" error={fe("description")}>
                    <Input
                        value={form.description}
                        onChange={(e) => setField("description", e.target.value)}
                    />
                </FormField>
                <div className="flex items-center gap-2">
                    <Switch
                        checked={form.published}
                        onCheckedChange={(v) => setField("published", v)}
                    />
                    <Label>Published</Label>
                </div>
                <DialogFooter>
                    <Button type="submit" disabled={loading}>
                        {loading ? "Saving..." : page ? "Update" : "Create"}
                    </Button>
                </DialogFooter>
            </form>
        </>
    );
}
