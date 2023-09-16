(async () => {
    const { clElements, clTable, clHttp, clCore } = window;

    const [blogRes, blogColumnsRes, profilePhotoRes] = await Promise.all([
        clHttp.getJson<BlogWithPosts>('/blog'),
        clHttp.getJson<string[]>('/blog-columns'),
        clHttp.getJson<string>('/user-photo'),
    ]);

    if (!profilePhotoRes) {
        clHttp.clearError();
    }

    const blog = blogRes ?? ({ id: 'default-blog-id', path: '/blog', enabled: true, posts: [] } as BlogWithPosts);
    const blogColumns = blogColumnsRes ?? [];

    let profilePhoto = profilePhotoRes ?? '';
    let editor: SimpleMDE | null = null;

    const originalProfilePhoto = profilePhoto;
    const originalBlog: BlogWithPosts = JSON.parse(JSON.stringify(blog));

    const getUserPhotoWrapper = () => adminSection.querySelector('#user-photo-wrapper');

    const getThumbnailHtml = (src?: string) => {
        return src ? `<img width="64px" height="64px" src='${src}' />` : 'None';
    };

    const blogTable = clTable.createTableFromData({
        id: 'blog-table',
        columns: blogColumns,
        rows: blog.posts,

        cellToInput(cell) {
            const columnName = cell.dataset.columnName;

            if (columnName === 'thumbnail') {
                return getPhotoActions(columnName, cell.querySelector('img')?.src);
            }

            const value = cell.innerText;

            if (columnName === 'title') {
                return `<input name='${columnName}' class='editable-row' value='${value}'></input>`;
            }

            if (columnName === 'published') {
                return `<input name='${columnName}' class='editable-row' type='checkbox' ${
                    value === 'true' ? 'checked' : ''
                }></input>`;
            }

            return String(value);
        },

        inputToCell(input) {
            if (input?.type === 'checkbox') {
                return input.checked ? 'true' : 'false';
            }

            if (input?.name === 'thumbnail' || input?.className === 'admin-post-thumbnail-actions') {
                return getThumbnailHtml(input?.dataset.src);
            }

            return input?.value || input.innerText;
        },

        transform(col, val) {
            if (col === 'thumbnail') {
                return getThumbnailHtml(val);
            }

            return val;
        },

        onUpdateClick(target, editingId) {
            if (target.id === editingId) return saveEditorChanges(editingId);

            disableActions();
            clearEditorFromDom();

            const post = blog.posts.find((p) => p.id === target.id);

            editor = clElements.appendEditor(adminSectionContent, post?.content);
        },

        onDeleteClick() {
            enableActions();
            clearEditorFromDom();
        },
    });

    const saveEditorChanges = (postId: string) => {
        const value = editor?.value() || '';

        const post = blog.posts.find((p) => p.id === postId);

        if (post) {
            post.content = value;
        }

        enableActions();
        clearEditorFromDom();
    };

    const clearEditorFromDom = () => {
        adminSectionContent?.querySelector('#main-editor-section')?.remove();
        editor = null;
    };

    const disableActions = () => {
        commitBtns.freeze();
        addPostItem.querySelector('button')?.classList.add('pure-button-disabled');
        adminSection.querySelector('.admin-photo-actions label')?.classList.add('pure-button-disabled');
    };

    const enableActions = () => {
        commitBtns.unfreeze();
        addPostItem.querySelector('button')?.classList.remove('pure-button-disabled');
        adminSection.querySelector('.admin-photo-actions label')?.classList.remove('pure-button-disabled');
    };

    const getPhotoActions = (name: string, src?: string) => {
        return clElements.getPhotoActions(
            name,
            src,
            (ev) => handleThumbnailUpload(ev.target as HTMLInputElement),
            (ev) => handleThumbnailDelete(ev.target as HTMLInputElement),
            'admin-post-thumbnail-actions'
        );
    };

    const getUserPhotoHtml = () => {
        const [el, img] = clElements.getUserPhotoHtml(
            profilePhoto,
            (event) => handleUserPhotoUpload(event.target as HTMLInputElement),
            () => handleUserPhotoDelete()
        );
        el.id = 'user-photo-wrapper';
        img.setAttribute('style', 'display: block; margin-bottom: 0.5rem;');
        return el;
    };

    const handleUserPhotoUpload = (target: HTMLInputElement) => {
        return clCore.handleFileUpload(target, (fr) => {
            profilePhoto = fr.result?.toString() || '';
            getUserPhotoWrapper()?.remove();
            adminSection.prepend(getUserPhotoHtml());
        });
    };

    const handleUserPhotoDelete = () => {
        profilePhoto = '';
        getUserPhotoWrapper()?.remove();
        adminSection.prepend(getUserPhotoHtml());
    };

    const handleThumbnailUpload = (target: HTMLInputElement) => {
        const id = target.parentElement?.parentElement?.parentElement?.id;

        if (!id) return;

        return clCore.handleFileUpload(target, (fr) => {
            blogTable.updateRow(id, 'thumbnail', () => {
                const src = fr.result?.toString() || '';
                const post = blog.posts.find((p) => p.id === id);
                post!.thumbnail = src;

                return getPhotoActions('thumbnail', src);
            });
        });
    };

    const handleThumbnailDelete = (target: HTMLInputElement) => {
        const id = target.parentElement?.parentElement?.id;

        if (!id) return;

        blogTable.updateRow(id, 'thumbnail', () => {
            const post = blog.posts.find((p) => p.id === id);
            post!.thumbnail = '';

            return getPhotoActions('thumbnail');
        });
    };

    const sendBlogPostRequest = (mode: string, rows: HTMLTableRowElement[]) => {
        return rows.map(async (row) => {
            if (mode === 'remove') {
                return clHttp.deleteEntity(`/blog-post/${row.id}`);
            }

            const mutatedItem = blog.posts.find((p) => p.id === row.id);
            const originalItem = originalBlog.posts.find((p) => p.id === row.id);
            const initialPayload: Record<string, unknown> = {};

            let isContentMutated = mutatedItem?.content !== originalItem?.content;
            let isThumbnailMutated =
                mutatedItem?.thumbnail !== originalItem?.thumbnail &&
                !(mode === 'add' && mutatedItem?.thumbnail === '');

            if (isContentMutated) {
                initialPayload.content = mutatedItem?.content;
            }

            if (isThumbnailMutated) {
                initialPayload.thumbnail = mutatedItem?.thumbnail;
            }

            const [payload, didAdd] = blogTable.getPayloadFromRow(row, initialPayload, (col, val) => {
                if (col === 'thumbnail' || col === 'content') return { success: false };

                let value: unknown = val;

                if (col === 'published') {
                    value = val === 'true';
                }

                if (originalItem && value === originalItem[<keyof typeof originalItem>col]) {
                    return { success: false };
                }

                return { success: true, value };
            });

            const haveMutations = didAdd || isContentMutated || isThumbnailMutated;

            if (!haveMutations) return Promise.resolve();

            if (mode === 'add') {
                return clHttp.postJson('/blog-post', payload);
            } else if (mode === 'edit') {
                return clHttp.patchJson(`/blog-post/${row.id}`, payload);
            }
        });
    };

    const handleUserPhoto = async (mode: string) => {
        if (mode === 'remove') {
            return clHttp.deleteEntity('/user-photo');
        }
        return clHttp.postJson('/user-photo', JSON.stringify({ image: profilePhoto }));
    };

    const commitChanges = async () => {
        const blogPath = adminSection.querySelector<HTMLInputElement>('#admin-input-field')?.value || '';

        if (blogPath !== originalBlog.path) {
            await clHttp.patchJson('/blog/' + blog.id, JSON.stringify({ path: blogPath }));
        }

        if (profilePhoto !== originalProfilePhoto) {
            await handleUserPhoto(profilePhoto === '' ? 'remove' : 'upload');
        }

        await Promise.all([
            ...sendBlogPostRequest('add', blogTable.getNewRows()),
            ...sendBlogPostRequest('edit', blogTable.getEditedRows()),
            ...sendBlogPostRequest('remove', blogTable.getDeletedRows()),
        ]);

        return window.location.reload();
    };

    const resetChanges = () => {
        return window.location.reload();
    };

    const commitBtns = clElements.getConfirmButtons(commitChanges, resetChanges);
    const [adminSection, adminSectionContent] = clElements.getAdminSection('Blog & Posts');
    const addPostItem = clElements.getAddItemsSection('Posts', 'Add Post', () => {
        const post = {
            title: 'Jazz',
            published: false,
            blogId: blog.id,
            content: 'Miles Davis',
            thumbnail: '',
        } as Post;
        const id = blogTable.addRow(post);
        blog.posts.push({ ...post, id });
    });

    window.clView.posts = (app) => {
        adminSection.prepend(getUserPhotoHtml());
        adminSection.appendChild(
            clElements.getInputField('Blog Path', blog.path || '', 'Commit an empty field to disable blog and posts')
        );

        adminSectionContent.appendChild(addPostItem);
        adminSectionContent.appendChild(blogTable.getRootNode());
        adminSection.appendChild(adminSectionContent);
        adminSection.appendChild(commitBtns.element);
        app.appendChild(adminSection);
    };

    window.dispatchEvent(new CustomEvent('core-view-initialized'));
})();
