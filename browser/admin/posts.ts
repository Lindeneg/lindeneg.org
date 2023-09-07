(() => {
    const DISABLED_BTN_CLASS = 'pure-button-disabled';
    const { app, ...core } = window.funkalleroAdminCore;

    const defaultState = () => ({
        original: null as BlogWithPosts | null,
        blog: null as Editable<Blog> | null,
        posts: null as Editable<Post>[] | null,
        authorPhoto: null as Editable<{ value: string }> | null,
        columnNames: null as string[] | null,
        updatingItemId: null as string | null,
        editor: null as SimpleMDE | null,
        addingRow: false,
    });

    const state = defaultState();

    window.addEventListener('reset-state', () => {
        Object.assign(state, defaultState());
    });

    const handleEditorInput = async () => {
        if (!state.editor) return;
        const value = state.editor.value();
        await handleRowInput({ name: 'content', classList: { contains: () => false }, value } as any);
        state.editor = null;
    };

    const handleRowItemClick = async (target: HTMLSpanElement) => {
        const id = target.dataset.itemId;
        const mode = target.innerText.toLowerCase();

        if (!id || !mode) return;

        if (mode === 'done') {
            await handleEditorInput();
            state.updatingItemId = null;
            state.addingRow = false;
        } else if (mode === 'update') {
            if (state.updatingItemId && state.updatingItemId !== id) await handleEditorInput();
            state.updatingItemId = id;
        } else if (mode === 'delete') {
            const target = state.posts?.find((e) => e.id === id)!;
            target._meta.edited = true;
            target._meta.deleted = true;
            state.updatingItemId = null;
            state.addingRow = false;
        }

        await setPostsHtml();
    };

    const setPostItem = (
        value: any,
        property: keyof Editable<Post>,
        item: Editable<Post>,
        originalItem?: Editable<Post>
    ) => {
        const isOriginalValue = !originalItem || value === originalItem[property];

        item[property] = value as never;
        item._meta.edited = item._meta.changedProperties.length > 0 || !originalItem || !isOriginalValue;

        if (!item._meta.isNew) {
            if (!item._meta.changedProperties.includes(property)) {
                item._meta.changedProperties.push(property);
            } else if (isOriginalValue) {
                item._meta.changedProperties = item._meta.changedProperties.filter((e) => e !== property);
            }
        }
    };

    const handleRowInput = async (target: HTMLInputElement) => {
        const name = target.name;
        let value = target.value as any;

        if (!name || !state.updatingItemId) return;

        const postItem = state.posts?.find((e) => e.id === state.updatingItemId)!;
        const originalPostItem = state.original?.posts?.find((e) => e.id === state.updatingItemId);

        if (name === 'thumbnail' && target.files?.length) {
            const fileReader: FileReader = new FileReader();

            fileReader.onload = async () => {
                setPostItem(fileReader.result?.toString(), name as any, postItem, originalPostItem);
                state.editor = null;
                await setPostsHtml();
            };

            fileReader.readAsDataURL(target.files[0]);

            return;
        }

        if (name === 'published') {
            value = (target as HTMLInputElement).checked;
        }

        setPostItem(value, name as any, postItem, originalPostItem);
    };

    const addRow = async () => {
        state.addingRow = !state.addingRow;
        state.updatingItemId = core.createTempId();

        state.posts!.push(
            core.withMeta(
                {
                    id: state.updatingItemId,
                    blogId: state.blog!.id,
                    title: 'Some Name',
                    name: 'some-name',
                    content: 'Some Content',
                    published: false,
                    thumbnail: '',
                    thumbnailId: '',
                },
                {
                    edited: true,
                    isNew: true,
                    changedProperties: ['title', 'content', 'published', 'thumbnail', 'blogId'],
                }
            )
        );

        await setPostsHtml();
    };

    const resetChanges = async () => {
        state.posts = state.original!.posts.map((item) => ({
            ...core.withMeta(item),
        }));
        state.blog = {
            ...core.withMeta(state.original!),
        };

        await setPostsHtml();
    };

    const removeThumbnail = () => {
        const postItem = state.posts?.find((e) => e.id === state.updatingItemId)!;
        const originalPostItem = state.original?.posts?.find((e) => e.id === state.updatingItemId);

        setPostItem('', 'thumbnail', postItem, originalPostItem);
        state.editor = null;
        setPostsHtml();
    };

    const setPostsListeners = () => {
        const actionElements = document.querySelectorAll('.update-table-btn,.delete-table-btn');
        const editableRowElements = document.querySelectorAll('.editable-row');
        const addPostButton = document.getElementById('add-post-btn') as HTMLButtonElement;
        const blogPathField = document.getElementById('blog-path-field') as HTMLInputElement;
        const removeThumbnailButton = document.getElementById('remove-thumbnail-button') as HTMLButtonElement;
        const commitBtn = document.getElementById('post-commit-btn') as HTMLButtonElement;
        const resetBtn = document.getElementById('post-reset-btn') as HTMLButtonElement;

        actionElements.forEach((element) => {
            element.addEventListener('click', ({ target }) => handleRowItemClick(target as any));
        });

        editableRowElements.forEach((element) => {
            element.addEventListener('input', ({ target }) => handleRowInput(target as any));
        });

        blogPathField.addEventListener('input', ({ target }) => {
            if (!state.blog) return;

            state.blog.path = (target as any).value;
            state.blog._meta.edited = state.blog.path !== state.original?.path;
            if (state.blog._meta.edited && !state.blog._meta.changedProperties.includes('path')) {
                state.blog._meta.changedProperties.push('path');
            }

            updateConfirmButtonState();
        });

        removeThumbnailButton?.addEventListener('click', removeThumbnail);
        addPostButton.addEventListener('click', addRow);
        commitBtn.addEventListener('click', commitChanges);
        resetBtn.addEventListener('click', resetChanges);
    };

    const getEditedPostItems = () => {
        const editedItems = state.posts?.filter((e) => {
            const isNew = core.NEW_ENTRY_REGEX.test(e.id);

            if (e._meta.deleted && isNew) return false;

            return e._meta.edited || e._meta.deleted;
        });

        return editedItems || [];
    };

    const updateConfirmButtonState = () => {
        const commitBtn = document.getElementById('post-commit-btn') as HTMLButtonElement;
        const resetBtn = document.getElementById('post-reset-btn') as HTMLButtonElement;

        const hasEdited = state.blog?._meta.edited || getEditedPostItems().length > 0;

        if (hasEdited && !state.updatingItemId && !state.addingRow) {
            commitBtn.classList.remove(DISABLED_BTN_CLASS);
            resetBtn.classList.remove(DISABLED_BTN_CLASS);
            return;
        }

        commitBtn.classList.add(DISABLED_BTN_CLASS);
        resetBtn.classList.add(DISABLED_BTN_CLASS);
    };

    const getEditableRowHtml = (row: Post, name: keyof Post): string => {
        const value = row[name];

        if (name === 'title') {
            return `<input name='${name}' class='editable-row' value='${value}'></input>`;
        }

        if (name === 'published') {
            return `<input name='${name}' class='editable-row' type='checkbox' ${value ? 'checked' : ''}></input>`;
        }

        if (name === 'thumbnail') {
            if (value) {
                return `<button id="remove-thumbnail-button" class="pure-button">Remove File</button>`;
            }
            return `<input id="thumbnail" name='${name}' accept="image/*" class='editable-row hidden' type='file'></input><label class="pure-button" for="thumbnail">${
                value ? 'Remove File' : 'Select File'
            }</label>`;
        }

        return String(value);
    };

    const initializeEditor = async () => {
        if ((state.updatingItemId || state.addingRow) && !state.editor) {
            state.editor = new SimpleMDE({
                element: document.getElementById('editor')!,
                initialValue: state.posts?.find((e) => e.id === state.updatingItemId)?.content ?? '',
            });
        }
    };

    const getEditorTextArea = () => {
        if (!state.updatingItemId && !state.addingRow) return '';
        return `
<h3>Section Content</h3>
<small>Use fullscreen mode for better editing</small>
<textarea id='editor'>
</textarea>`;
    };

    const getPostsHtml = () => {
        return `
<section class='admin-section'>
    <h1>User</h1>

    <label style='margin-bottom:1rem;' for='blog-path-field'>Blog Path</label>
    <input id='blog-path-field' type='text' placeholder='Blog Path' value='${state.blog?.path}' />
    <small>Commit an empty field to disable blog and posts</small>

    <h1>Blog & Posts</h1>

    <div class='admin-section-content'>
        <div class='admin-blog-name'>
            <label style='margin-bottom:1rem;' for='blog-path-field'>Blog Path</label>
            <input id='blog-path-field' type='text' placeholder='Blog Path' value='${state.blog?.path}' />
            <small>Commit an empty field to disable blog and posts</small>
        </div>
        <div>

        <h1>Posts</h1>
        <button 
            id='add-post-btn' 
            style='margin-bottom:1rem;'
            class='pure-button pure-button-primary'
        >
            Add Post
        </button>

        ${core.getTableHtml(
            state.columnNames || [],
            core.withoutDeleted(state.posts).sort((a) => (a.published ? -1 : 1)),
            state.updatingItemId,
            true,
            getEditableRowHtml
        )}

        </div>

        ${getEditorTextArea()}

        <div class='pure-button-group admin-confirm-actions' role='group' aria-label='...'>
            <button id='post-commit-btn' class='pure-button pure-button-disabled pure-button-primary'>Commit Changes</button>
            <button id='post-reset-btn' class='pure-button pure-button-disabled button-error'>Reset Changes</button>
        </div>
    </div>
</section>`;
    };

    const setPostsHtml = async () => {
        if (!state.blog || !state.posts || !state.columnNames) {
            const [blog, blogColumns] = await Promise.all([
                core.getJson<BlogWithPosts>('/blog', undefined, () => {}),
                core.getJson<string[]>('/blog-columns'),
            ]);

            if (blog) {
                const { posts, ...mainBlog } = core.deepClone(blog);

                state.original = blog;
                state.posts = posts.map((item) => ({
                    ...core.withMeta(item),
                }));
                state.blog = {
                    ...core.withMeta(mainBlog),
                };
            } else {
                state.blog = {
                    ...core.withMeta(
                        {
                            id: core.createTempId(),
                            path: '',
                            enabled: false,
                        },
                        { isNew: true }
                    ),
                };
                state.posts = [];
            }

            state.columnNames = blogColumns ?? [];
        }

        app.innerHTML = getPostsHtml();

        await initializeEditor();
        updateConfirmButtonState();
        setPostsListeners();
    };

    const sendRequest = async (item: Editable<any>, name: '/blog' | '/blog-post') => {
        if (item._meta.isNew) {
            const response = await core.postJson(name, core.getCommitPayload(item));
            if (!response?.ok) return;
            item.id = await response?.json();
            if (name === '/blog') {
                state.posts?.forEach((e) => (e.blogId = item.id));
            }
        } else if (item._meta.deleted) {
            await core.deleteJson(`${name}/${item.id}`);
        } else if (item._meta.edited) {
            await core.patchJson(`${name}/${item.id}`, core.getCommitPayload(item));
        }
        return Promise.resolve();
    };

    const commitChanges = async () => {
        if (!state.blog || !state.posts) return;

        if (state.blog._meta.edited) {
            await sendRequest(state.blog, '/blog');
        }

        await Promise.all(getEditedPostItems().map(async (item) => sendRequest(item, '/blog-post')));

        Object.assign(state, defaultState());

        await setPostsHtml();
    };

    window.funkalleroCoreViews.posts = setPostsHtml;
})();
