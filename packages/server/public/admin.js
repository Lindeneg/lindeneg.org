(function () {
    'use strict';

    function initConfirms() {
        document.querySelectorAll('form[data-confirm]').forEach(function (form) {
            form.addEventListener('submit', function (e) {
                if (!confirm(form.dataset.confirm)) e.preventDefault();
            });
        });
    }

    function initMobileSidebar() {
        var btn = document.querySelector('[data-admin-mobile-toggle]');
        var sidebar = document.querySelector('.admin-sidebar');
        if (!btn || !sidebar) return;
        btn.addEventListener('click', function () {
            sidebar.classList.toggle('is-open');
        });
    }

    function initMarkdownEditor() {
        var source = document.querySelector('[data-md-source]');
        var preview = document.querySelector('[data-md-preview]');
        if (!source || !preview) return;
        if (typeof window.marked === 'undefined') {
            preview.textContent = '(preview unavailable — failed to load marked.js)';
            return;
        }

        if (window.hljs) {
            window.marked.use({
                renderer: {
                    code: function (token) {
                        var lang = token.lang && window.hljs.getLanguage(token.lang) ? token.lang : 'plaintext';
                        var highlighted = window.hljs.highlight(token.text, {language: lang}).value;
                        return '<pre><code class="hljs language-' + lang + '">' + highlighted + '</code></pre>';
                    },
                },
            });
        }

        var render = function () {
            try {
                preview.innerHTML = window.marked.parse(source.value);
            } catch (e) {
                preview.textContent = String(e);
            }
        };

        var raf = null;
        var schedule = function () {
            if (raf) cancelAnimationFrame(raf);
            raf = requestAnimationFrame(render);
        };

        source.addEventListener('input', schedule);
        render();

        // ---- scroll sync ----
        var syncing = false;
        var bind = function (from, to) {
            from.addEventListener('scroll', function () {
                if (syncing) return;
                syncing = true;
                var max = from.scrollHeight - from.clientHeight;
                var ratio = max > 0 ? from.scrollTop / max : 0;
                var toMax = to.scrollHeight - to.clientHeight;
                to.scrollTop = ratio * toMax;
                requestAnimationFrame(function () {
                    syncing = false;
                });
            });
        };
        bind(source, preview);
        bind(preview, source);

        // ---- tab → 2 spaces ----
        source.addEventListener('keydown', function (e) {
            if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                var start = source.selectionStart;
                var end = source.selectionEnd;
                source.value = source.value.slice(0, start) + '  ' + source.value.slice(end);
                source.selectionStart = source.selectionEnd = start + 2;
                schedule();
            }
        });

        // ---- Cmd/Ctrl+S submits ----
        document.addEventListener('keydown', function (e) {
            if ((e.metaKey || e.ctrlKey) && (e.key === 's' || e.key === 'S')) {
                var form = document.getElementById('md-form');
                if (form) {
                    e.preventDefault();
                    form.requestSubmit ? form.requestSubmit() : form.submit();
                }
            }
        });
    }

    function init() {
        initConfirms();
        initMobileSidebar();
        initMarkdownEditor();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
