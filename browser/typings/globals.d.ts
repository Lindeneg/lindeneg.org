type Navigation = import('@prisma/client').Navigation;
type NavigationItem = import('@prisma/client').NavigationItem;
type Page = import('@prisma/client').Page;
type PageSection = import('@prisma/client').PageSection;
type Blog = import('@prisma/client').Blog;
type PrismaPost = import('@prisma/client').Post;

type Post = Omit<PrismaPost, 'updatedAt' | 'createdAt'>;

interface NavigationWithItems extends Navigation {
    navItems: NavigationItem[];
}

interface PageWithSections extends Page {
    sections: PageSection[];
}

interface BlogWithPosts extends Blog {
    posts: Post[];
}

interface ClTableApi {
    destroyTable: () => void;
    addRow: (initialValues?: Record<string, any>) => void;
    updateRow: (id: string, column: string, cb: (cell: HTMLTableCellElement) => any) => void;
    deleteRow: (id: string) => void;
    getNewRows: () => HTMLTableRowElement[];
    getEditedRows: () => HTMLTableRowElement[];
    getDeletedRows: () => HTMLTableRowElement[];
    getRootNode: () => HTMLTableElement;
    getPayloadFromRow: <T extends Record<string, any>>(
        row: HTMLTableRowElement,
        payload: T,
        transform: (col: string, val: string) => any
    ) => [payload: string, didAdd: boolean];
}

interface CreateTableCoreOptions {
    onUpdateClick?: (target: HTMLTableRowElement, editingId: string | null) => void;
    onDeleteClick?: (target: HTMLTableRowElement) => void;
    cellToInput?: (cell: HTMLTableCellElement) => string;
    inputToCell?: (input: any) => string;
    transform?: (col: string, val: string) => any;
}

interface CreateTableOptions extends CreateTableCoreOptions {
    id: string;
    columns: string[];
    rows: Record<string, any>;
}

interface ClTableModule {
    createTableApi: (rootNode: HTMLTableElement, opts?: CreateTableCoreOptions) => ClTableApi;
    createTableFromData: (opts: CreateTableOptions) => ClTableApi;
}

interface ClHttpModule {
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
        onSuccess?: (response: Response) => any,
        onError?: (...errors: any) => any
    ) => Promise<null | Response>;

    patchJson: (
        path: string,
        body: RequestInit['body'],
        onSuccess?: (response: Response) => any,
        onError?: (...errors: any) => any
    ) => Promise<null | Response>;

    deleteEntity: (
        path: string,
        onSuccess?: (response: Response) => any,
        onError?: (...errors: any) => any
    ) => Promise<null | Response>;

    getJson: <TResult = unknown>(
        path: string,
        onSuccess?: (response: Response) => TResult,
        onError?: (...errors: any) => any
    ) => Promise<null | TResult>;

    setError: (error: string) => void;

    clearError: () => void;
}

type GetConfirmButtons = (
    onCommit: () => void | Promise<void>,
    onReset: () => void | Promise<void>
) => {
    element: HTMLDivElement;
    toggleState: () => void;
};

interface ClElementsModule {
    getAdminSection: (title: string) => [HTMLElement, HTMLDivElement];
    getInputField: (title: string, value?: string) => HTMLDivElement;
    getAddItemsSection: (title: string, buttonTitle: string, onClick: () => void) => HTMLDivElement;
    getConfirmButtons: GetConfirmButtons;
}

interface Window {
    clHttp: ClHttpModule;
    clTable: ClTableModule;
    clView: Record<string, (app: HTMLElement) => Promise<void> | void>;
    clElements: ClElementsModule;
}
