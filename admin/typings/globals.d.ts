type Navigation = import('@prisma/client').Navigation;
type NavigationItem = import('@prisma/client').NavigationItem;
type PrismaPage = import('@prisma/client').Page;
type PrismaPageSection = import('@prisma/client').PageSection;
type Blog = import('@prisma/client').Blog;
type PrismaPost = import('@prisma/client').Post;

type Post = Omit<PrismaPost, 'updatedAt' | 'createdAt'>;
type Page = Omit<PrismaPage, 'updatedAt' | 'createdAt'>;
type PageSection = Omit<PrismaPageSection, 'updatedAt' | 'createdAt'>;

interface NavigationWithItems extends Navigation {
    navItems: NavigationItem[];
}

interface PageWithSections extends Page {
    sections: PageSection[];
}

interface BlogWithPosts extends Blog {
    posts: Post[];
}

interface RowTransformSuccessResult<T = any> {
    success: true;
    value: T;
}

interface RowTransformFailureResult {
    success: false;
}

type SectionCallbacks = {
    [id: string]: Array<(pageId: string) => Promise<void>>;
};

type RowTransformResult = RowTransformSuccessResult | RowTransformFailureResult;

interface ClTableApi {
    destroyTable: () => void;
    getEditingId: () => string | null;
    startEditing: (rowId: string) => void;
    stopEditing: () => void;
    freezeActions: () => void;
    freezeNonEditingRows: () => void;
    unfreezeActions: () => void;
    addRow: (initialValues?: Record<string, any>) => string;
    updateRow: (id: string, column: string, cb: (cell: HTMLTableCellElement) => any) => void;
    getRowFromId: (id) => HTMLTableRowElement | null;
    deleteRow: (id: string) => void;
    getNewRows: () => HTMLTableRowElement[];
    getRowColumnCell: (rowId: string, columnName: string) => HTMLTableCellElement | null;
    getEditedRows: () => HTMLTableRowElement[];
    getDeletedRows: () => HTMLTableRowElement[];
    getRootNode: () => HTMLTableElement;
    getPayloadFromRow: <T extends Record<string, any>>(
        row: HTMLTableRowElement,
        payload: T,
        transform: (col: string, val: string) => RowTransformResult
    ) => [payload: string, didAdd: boolean];
}

interface CreateTableCoreOptions {
    onUpdateClick?: (target: HTMLTableRowElement, editingId: string | null) => void;
    onDeleteClick?: (target: HTMLTableRowElement) => void;
    cellToInput?: (cell: HTMLTableCellElement) => string | HTMLElement;
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
    freeze: () => void;
    unfreeze: () => void;
};

interface ClElementsModule {
    appendEditor: (parent: HTMLElement, initialValue?: string) => SimpleMDE;
    getPhotoActions: (
        name: string,
        value?: string,
        onUpload?: (event: Event) => void,
        onDelete?: (event: Event) => void,
        withDiv?: string
    ) => HTMLElement;
    getUserPhotoHtml: (
        src: string,
        onUpload: (event: Event) => void,
        onDelete: (event: Event) => void
    ) => [HTMLDivElement, HTMLImageElement];
    getAdminSection: (title: string) => [HTMLElement, HTMLDivElement];
    getInputField: (title: string, value?: string, tip?: string) => HTMLDivElement;
    getAddItemsSection: (title: string, buttonTitle: string, onClick: () => void) => HTMLDivElement;
    getConfirmButtons: GetConfirmButtons;
}

interface ClCoreModule {
    NEW_ENTRY_REGEX: RegExp;
    handleFileUpload: (target: HTMLInputElement, callback: (fr: FileReader) => void) => void;
    getChangedSectionColumns: <T>(mutated: T, original: T, keys: Array<keyof T>) => Record<keyof T, unknown>;
    setDataSectionsAttribute: (el?: HTMLElement | null, ...elements: string[]) => void;
    getDataSectionsAttribute: (el?: HTMLElement | null) => string[];
}

interface Window {
    clHttp: ClHttpModule;
    clCore: ClCoreModule;
    clTable: ClTableModule;
    clView: Record<string, (app: HTMLElement) => Promise<void> | void>;
    clElements: ClElementsModule;
}
