(() => {
    const getAdminSection: Window['clElements']['getAdminSection'] = (title) => {
        const adminSection = document.createElement('section');
        adminSection.className = 'admin-section';
        adminSection.innerHTML = `<h1>${title}</h1>`;

        const adminSectionContent = document.createElement('div');
        adminSectionContent.className = 'admin-section-content';

        adminSection.appendChild(adminSectionContent);

        return [adminSection, adminSectionContent];
    };

    const getPhotoActions: Window['clElements']['getPhotoActions'] = (name, value, onUpload, onDelete, divClass) => {
        let html: HTMLElement;

        if (value) {
            const button = document.createElement('button');
            button.id = `photo-${name}-remove`;
            button.name = name;
            button.className = 'pure-button pure-button';
            button.innerText = 'Remove File';
            button.dataset.src = value;
            if (onDelete) button.addEventListener('click', onDelete);

            html = button;
        } else {
            const input = document.createElement('input');
            input.id = name;
            input.name = name;
            input.className = 'editable-row hidden';
            input.type = 'file';
            input.accept = 'image/*';

            if (divClass) {
                const div = document.createElement('div');
                div.className = divClass;
                div.innerHTML = `<label class="pure-button" for="${name}">Select File</label>`;
                div.appendChild(input);
                html = div;
            } else {
                input.innerHTML = `<label class="pure-button" for="${name}">Select File</label>`;
                html = input;
            }

            if (onUpload) input.addEventListener('input', onUpload);
        }

        return html;
    };

    const getUserPhotoHtml: Window['clElements']['getUserPhotoHtml'] = (src, onUpload, onDelete) => {
        const container = document.createElement('div');
        container.className = 'admin-section-content';
        container.innerHTML = '<h1>User Photo</h1>';

        const img = document.createElement('img');
        img.width = 120;
        img.src = src;

        const photoActions = getPhotoActions('user-photo', src, onUpload, onDelete, 'admin-photo-actions');

        container.appendChild(img);
        container.appendChild(photoActions);

        return [container, img];
    };

    const getInputField: Window['clElements']['getInputField'] = (title, value = '', tip = '') => {
        const wrapper = document.createElement('div');
        wrapper.className = 'admin-input-name';

        const adminNavigationNameLabel = document.createElement('label');
        adminNavigationNameLabel.style.marginBottom = '1rem';
        adminNavigationNameLabel.innerText = title;
        adminNavigationNameLabel.htmlFor = 'admin-input-field';

        const adminNavigationNameInput = document.createElement('input');
        adminNavigationNameInput.id = 'admin-input-field';
        adminNavigationNameInput.type = 'text';
        adminNavigationNameInput.placeholder = title;
        adminNavigationNameInput.value = value;

        wrapper.appendChild(adminNavigationNameLabel);
        wrapper.appendChild(adminNavigationNameInput);

        if (tip) {
            const tipElement = document.createElement('small');
            tipElement.innerText = tip;
            wrapper.appendChild(tipElement);
        }

        return wrapper;
    };

    const getAddItemsSection: Window['clElements']['getAddItemsSection'] = (title, buttonTitle, onClick) => {
        const section = document.createElement('div');
        if (title) {
            section.innerHTML = `<h1>${title}</h1>`;
        }

        const btn = document.createElement('button');
        btn.style.marginBottom = '1rem';
        btn.className = 'pure-button pure-button-primary';
        btn.innerText = buttonTitle;
        btn.addEventListener('click', onClick);

        section.appendChild(btn);

        return section;
    };

    const getConfirmButtons: Window['clElements']['getConfirmButtons'] = (onCommit, onReset) => {
        const confirmActions = document.createElement('div');
        confirmActions.className = 'pure-button-group admin-confirm-actions';
        confirmActions.setAttribute('role', 'group');
        confirmActions.setAttribute('aria-label', 'Change or reset changes');

        const confirmButton = document.createElement('button');
        confirmButton.className = 'pure-button pure-button-primary';
        confirmButton.style.marginRight = '1rem';
        confirmButton.innerText = 'Commit Changes';
        confirmButton.addEventListener('click', onCommit);

        const resetButton = document.createElement('button');
        resetButton.className = 'pure-button button-error';
        resetButton.innerText = 'Reset Changes';
        resetButton.addEventListener('click', onReset);
        confirmActions.appendChild(confirmButton);
        confirmActions.appendChild(resetButton);

        const freeze = () => {
            if (!confirmButton.classList.contains('pure-button-disabled')) {
                confirmButton.classList.add('pure-button-disabled');
            }

            if (!resetButton.classList.contains('pure-button-disabled')) {
                resetButton.classList.add('pure-button-disabled');
            }
        };

        const unfreeze = () => {
            if (confirmButton.classList.contains('pure-button-disabled')) {
                confirmButton.classList.remove('pure-button-disabled');
            }

            if (resetButton.classList.contains('pure-button-disabled')) {
                resetButton.classList.remove('pure-button-disabled');
            }
        };

        return {
            element: confirmActions,
            freeze,
            unfreeze,
        };
    };

    const appendEditor: ClElementsModule['appendEditor'] = (parent, initialValue = '') => {
        const wrapper = document.createElement('div');
        wrapper.id = 'main-editor-section';
        wrapper.innerHTML = `<h3>Section Content</h3>
        <small>Use fullscreen mode for better editing</small>
        <textarea id='editor'>
        </textarea>`;

        parent.appendChild(wrapper);

        return new SimpleMDE({
            element: wrapper.querySelector<HTMLTextAreaElement>('#editor')!,
            initialValue,
        });
    };

    window.clElements = {
        appendEditor,
        getPhotoActions,
        getUserPhotoHtml,
        getConfirmButtons,
        getAdminSection,
        getInputField,
        getAddItemsSection,
    };
})();
