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

    const getInputField: Window['clElements']['getInputField'] = (title, value = '') => {
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

        const toggleState = () => {
            if (confirmButton.classList.contains('pure-button-disabled')) {
                confirmButton.classList.remove('pure-button-disabled');
                resetButton.classList.remove('pure-button-disabled');
                return;
            }
            confirmButton.classList.add('pure-button-disabled');
            resetButton.classList.add('pure-button-disabled');
        };

        return {
            element: confirmActions,
            toggleState,
        };
    };

    window.clElements = {
        getConfirmButtons,
        getAdminSection,
        getInputField,
        getAddItemsSection,
    };
})();
