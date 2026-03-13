import {useParams} from "react-router-dom";
import {usePage} from "@/hooks/use-page";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer";
import ErrorState from "@/components/shared/ErrorState";
import {PageSkeleton} from "@/components/shared/PageSkeleton";
import {useDocumentTitle} from "@/hooks/use-document-title";

export default function DynamicPage() {
    const {slug} = useParams<{slug: string}>();
    const {data: page, loading, error, refetch} = usePage(slug!);
    useDocumentTitle(page ? `${page.title} — Lindeneg` : "Lindeneg");

    if (loading) return <PageSkeleton />;

    if (error) {
        return (
            <ErrorState
                error={error}
                onRetry={refetch}
                notFoundTitle="Page not found"
                notFoundMessage="The page you're looking for doesn't exist."
            />
        );
    }

    if (!page) return null;

    const sections = page.sections
        .filter((s) => s.published)
        .sort((a, b) => a.position - b.position);

    return (
        <div>
            <div className="space-y-12">
                {sections.map((section) => (
                    <MarkdownRenderer key={section.id} content={section.content} />
                ))}
            </div>
        </div>
    );
}
