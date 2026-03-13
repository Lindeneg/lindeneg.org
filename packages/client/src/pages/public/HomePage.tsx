import {usePage} from "@/hooks/use-page";
import {useDocumentTitle} from "@/hooks/use-document-title";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer";
import FadeInSection from "@/components/shared/FadeInSection";
import ErrorState from "@/components/shared/ErrorState";
import {HeroSkeleton, SectionSkeleton} from "@/components/shared/PageSkeleton";

export default function HomePage() {
    useDocumentTitle("Lindeneg");
    const {data: page, loading, error, refetch} = usePage("home");

    if (loading) {
        return (
            <div className="space-y-12">
                <HeroSkeleton />
                <SectionSkeleton />
                <SectionSkeleton />
            </div>
        );
    }

    if (error) return <ErrorState error={error} onRetry={refetch} />;
    if (!page) return null;

    const sections = page.sections
        .filter((s) => s.published)
        .sort((a, b) => a.position - b.position);

    return (
        <div>
            <div className="space-y-12">
                {sections.map((section, i) => (
                    <FadeInSection key={section.id} delay={i * 100}>
                        <MarkdownRenderer content={section.content} />
                    </FadeInSection>
                ))}
            </div>
        </div>
    );
}
