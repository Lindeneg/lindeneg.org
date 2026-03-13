import {Link} from "react-router-dom";
import {useDocumentTitle} from "@/hooks/use-document-title";

export default function NotFound() {
    useDocumentTitle("Not Found — Lindeneg");
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
            <h1 className="mb-2 text-6xl font-bold tracking-tight">404</h1>
            <p className="mb-8 text-lg text-muted-foreground">This page doesn't exist.</p>
            <Link
                to="/"
                className="text-sm font-medium text-foreground underline underline-offset-4 hover:text-foreground/80">
                Go home
            </Link>
        </div>
    );
}
