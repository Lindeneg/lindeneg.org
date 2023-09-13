(async () => {
    const { clElements, clTable, clHttp } = window;

    const [blogRes, blogColumnsRes, profilePhotoRes] = await Promise.all([
        clHttp.getJson<BlogWithPosts>('/blog'),
        clHttp.getJson<string[]>('/blog-columns'),
        clHttp.getJson<string>('/user-photo'),
    ]);

    if (!profilePhotoRes) {
        clHttp.clearError();
    }

    const blog = blogRes ?? { path: '/blog', enabled: true, posts: [] };
    const blogColumns = blogColumnsRes ?? [];
    const profilePhoto = profilePhotoRes ?? '';
    const originalBlog: BlogWithPosts = JSON.parse(JSON.stringify(blog));

    const getPhotoHtml = (name: string, value?: string) => {
        if (value) {
            return `<button id="remove-${name}-button" name='${name}' data-src="${value}" class="pure-button">Remove File</button>`;
        }
        return `<input id="${name}" name='${name}' accept="image/*" class='editable-row hidden' type='file'></input><label class="pure-button" for="${name}">Select File</label>`;
    };

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
                return getPhotoHtml(columnName, cell.querySelector('img')?.src);
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

            if (input?.name === 'thumbnail') {
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
            if (editingId) {
                commitBtns.unfreeze();
                //return removeMainSection();
            }

            commitBtns.freeze();
            addPostItem.querySelector('button')?.classList.add('pure-button-disabled');
            //adminSectionContent.appendChild(createPagesSectionContainer(editingId || target.id));
        },

        onDeleteClick() {
            commitBtns.unfreeze();
            //removeMainSection();
        },
    });

    const commitChanges = async () => {};

    const resetChanges = () => {
        return window.location.reload();
    };

    const commitBtns = clElements.getConfirmButtons(commitChanges, resetChanges);
    const [adminSection, adminSectionContent] = clElements.getAdminSection('Blog & Posts');
    const addPostItem = clElements.getAddItemsSection('Posts', 'Add Post', () => {
        // const page = {
        //     name: 'Jazz',
        //     slug: '/jazz',
        //     title: 'Jazz',
        //     description: 'Kind of Blue',
        //     published: false,
        //     sections: [],
        // };
        // const id = pagesTable.addRow({
        //     ...page,
        //     sections: page.sections.length,
        // });
        // pages.push({ ...page, id });
    });

    window.clView.posts = (app) => {
        adminSectionContent.innerHTML = `<div class='admin-input-name'>
        <label style='margin-bottom:1rem;' for='blog-path-field'>Blog Path</label>
        <input id='blog-path-field' type='text' placeholder='Blog Path' value='${blog.path || ''}' />
        <small>Commit an empty field to disable blog and posts</small>
    </div>`;

        adminSection.innerHTML = `    <div class='admin-section-content'>
    <h1>User Photo</h1>

    <img width="120px" src='${profilePhoto}' />
    <div>${getPhotoHtml('authorPhoto', profilePhoto)}</div>
</div>`;

        adminSectionContent.appendChild(addPostItem);
        adminSectionContent.appendChild(blogTable.getRootNode());
        adminSection.appendChild(adminSectionContent);
        adminSection.appendChild(commitBtns.element);
        app.appendChild(adminSection);
    };

    window.dispatchEvent(new CustomEvent('core-view-initialized'));
})();
