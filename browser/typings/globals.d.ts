type Navigation = import('@prisma/client').Navigation;
type NavigationItem = import('@prisma/client').NavigationItem;

interface NavigationWithItems extends Navigation {
    navItems: NavigationItem[];
}

interface FunkalleroCore {
    sendRequest: (
        path: string,
        method: string,
        headers?: RequestInit['headers'],
        body?: RequestInit['body'],
        onSuccess?: (response: Response) => any
    ) => Promise<null | Response>;

    postJson: (
        path: string,
        body: RequestInit['body'],
        onSuccess?: (response: Response) => any
    ) => Promise<null | Response>;

    patchJson: (
        path: string,
        body: RequestInit['body'],
        onSuccess?: (response: Response) => any
    ) => Promise<null | Response>;

    getJson: <TResult = unknown>(
        path: string,
        onSuccess?: (response: Response) => TResult
    ) => Promise<null | TResult>;

    setError: (error: string) => void;

    getInputFieldValue: (field: HTMLElement | null) => HTMLInputElement['value'] | null;

    setKeyPressHandler: (key: string, handler: () => void) => void;

    debounce: (fn: (...args: any[]) => any, ms?: number) => any;
}

interface FunkalleroAdminCore extends FunkalleroCore {
    getTableHtml: (
        columns: string[],
        rows: any[],
        updatingId?: string | null,
        withActions?: boolean,
        editableColumnHtml?: ((row: any, column: any) => string) | null
    ) => string;
    app: HTMLElement;
}

interface Window {
    funkalleroCore: FunkalleroCore;
    funkalleroAdminCore: FunkalleroAdminCore;
    funkalleroCoreViews: Record<string, () => Promise<void>>;
}
