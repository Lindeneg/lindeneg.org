(function () {
    'use strict';

    // ---- theme toggle -----------------------------------------------------

    function applyTheme(theme) {
        var root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        try {
            localStorage.setItem('theme', theme);
        } catch (e) {}
    }

    function currentTheme() {
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }

    function initThemeToggle() {
        var buttons = document.querySelectorAll('[data-theme-toggle]');
        buttons.forEach(function (btn) {
            btn.addEventListener('click', function () {
                applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
            });
        });
    }

    // ---- mobile drawer ----------------------------------------------------

    function openDrawer() {
        var drawer = document.querySelector('[data-mobile-drawer]');
        if (!drawer) return;
        drawer.hidden = false;
        // force reflow so the transition runs
        void drawer.offsetWidth;
        drawer.classList.add('is-open');
        document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
        var drawer = document.querySelector('[data-mobile-drawer]');
        if (!drawer) return;
        drawer.classList.remove('is-open');
        document.body.style.overflow = '';
        var onEnd = function () {
            drawer.hidden = true;
            drawer.removeEventListener('transitionend', onEnd);
        };
        drawer.addEventListener('transitionend', onEnd);
    }

    function initMobileDrawer() {
        document.querySelectorAll('[data-mobile-open]').forEach(function (btn) {
            btn.addEventListener('click', openDrawer);
        });
        document.querySelectorAll('[data-mobile-close]').forEach(function (btn) {
            btn.addEventListener('click', closeDrawer);
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeDrawer();
        });
        // close drawer when a nav link is clicked
        var drawer = document.querySelector('[data-mobile-drawer]');
        if (drawer) {
            drawer.addEventListener('click', function (e) {
                var target = e.target;
                while (target && target !== drawer) {
                    if (target.tagName === 'A') {
                        closeDrawer();
                        return;
                    }
                    target = target.parentNode;
                }
            });
        }
    }

    // ---- copy code buttons -----------------------------------------------

    var COPY_ICON =
        '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
    var CHECK_ICON =
        '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';

    function initCopyButtons() {
        var pres = document.querySelectorAll('.markdown pre');
        pres.forEach(function (pre) {
            if (pre.parentElement && pre.parentElement.classList.contains('code-wrap')) return;
            var wrap = document.createElement('div');
            wrap.className = 'code-wrap';
            pre.parentNode.insertBefore(wrap, pre);
            wrap.appendChild(pre);

            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'copy-btn';
            btn.setAttribute('aria-label', 'Copy code');
            btn.innerHTML = COPY_ICON;

            btn.addEventListener('click', function () {
                var code = pre.querySelector('code');
                var text = (code || pre).innerText;
                navigator.clipboard.writeText(text).then(function () {
                    btn.classList.add('is-copied');
                    btn.innerHTML = CHECK_ICON;
                    setTimeout(function () {
                        btn.classList.remove('is-copied');
                        btn.innerHTML = COPY_ICON;
                    }, 1500);
                });
            });

            wrap.appendChild(btn);
        });
    }

    // ---- heading anchors -------------------------------------------------

    var LINK_ICON =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';

    function slugify(text) {
        return text
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }

    function initHeadingAnchors() {
        var headings = document.querySelectorAll('.markdown h1, .markdown h2, .markdown h3, .markdown h4');
        headings.forEach(function (h) {
            if (h.querySelector('.heading-anchor')) return;
            var id = h.id || slugify(h.textContent || '');
            if (!id) return;
            h.id = id;
            var a = document.createElement('a');
            a.href = '#' + id;
            a.className = 'heading-anchor';
            a.setAttribute('aria-label', 'Link to ' + (h.textContent || '').trim());
            a.innerHTML = LINK_ICON;
            h.appendChild(a);
        });
    }

    // ---- boot ------------------------------------------------------------

    function init() {
        initThemeToggle();
        initMobileDrawer();
        initCopyButtons();
        initHeadingAnchors();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
