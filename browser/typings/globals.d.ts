type Navigation = import('@prisma/client').Navigation;
type NavigationItem = import('@prisma/client').NavigationItem;
type Page = import('@prisma/client').Page;
type PageSection = import('@prisma/client').PageSection;

interface NavigationWithItems extends Navigation {
    navItems: NavigationItem[];
}

interface PageWithSections extends Page {
    sections: PageSection[];
}

interface FunkalleroCore {
    sendRequest: (
        path: string,
        method: string,
        headers?: RequestInit['headers'],
        body?: RequestInit['body'],
        onSuccess?: (response: Response) => any,
        onError?: (...errors: any) => any
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

    deleteJson: (path: string, onSuccess?: (response: Response) => any) => Promise<null | Response>;

    getJson: <TResult = unknown>(
        path: string,
        onSuccess?: (response: Response) => TResult,
        onError?: (...errors: any) => any
    ) => Promise<null | TResult>;

    setError: (error: string) => void;

    getInputFieldValue: (field: HTMLElement | null) => HTMLInputElement['value'] | null;

    setKeyPressHandler: (key: string, handler: () => void) => void;

    debounce: (fn: (...args: any[]) => any, ms?: number) => any;
}

type EditMeta = { edited: boolean; deleted: boolean; isNew?: boolean; changedProperties: any[] };

type Editable<T> = T & {
    _meta: EditMeta;
};

interface EditablePageWithEditableSections extends Page {
    sections: Editable<PageSection>[];
}

interface FunkalleroAdminCore extends FunkalleroCore {
    getTableHtml: (
        columns: string[],
        rows: any[],
        updatingId?: string | null,
        withActions?: boolean,
        editableColumnHtml?: ((row: any, column: any) => string) | null,
        context?: string | null
    ) => string;
    app: HTMLElement;
    withMeta: <T>(
        item: T,
        overrides?: Partial<EditMeta>
    ) => T & {
        _meta: { edited: boolean; deleted: boolean; changedProperties: any[] };
    };
    NEW_ENTRY_REGEX: RegExp;
    createTempId: () => string;
    getColumns: (rows: any[], exclude?: string[]) => string[];
    withoutDeleted: <T extends Editable<any>[]>(rows?: T | null) => T;
    deepClone: <T>(obj: T) => T;
    getCommitPayload: (rows: Editable<any>) => string;
}

interface Window {
    funkalleroCore: FunkalleroCore;
    funkalleroAdminCore: FunkalleroAdminCore;
    funkalleroCoreViews: Record<string, () => Promise<void>>;
}
