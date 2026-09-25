(function () {
    "use strict";

    function initConfirms() {
        document.querySelectorAll("form[data-confirm]").forEach(function (form) {
            form.addEventListener("submit", function (e) {
                if (!confirm(form.dataset.confirm)) e.preventDefault();
            });
        });
    }

    // an oversized file is rejected mid-upload, dropping every field after it, so it's blocked before submitting
    function initFileLimits() {
        document.querySelectorAll("input[type=file][data-max-bytes]").forEach(function (input) {
            input.addEventListener("change", function () {
                var max = Number(input.dataset.maxBytes);
                var file = input.files && input.files[0];
                var tooLarge = file && file.size > max;
                input.setCustomValidity(tooLarge ? "Image must be " + max / 1024 / 1024 + "MB or smaller" : "");
                if (tooLarge) input.reportValidity();
            });
        });
    }

    function initMobileSidebar() {
        var btn = document.querySelector("[data-admin-mobile-toggle]");
        var sidebar = document.querySelector(".admin-sidebar");
        if (!btn || !sidebar) return;
        btn.addEventListener("click", function () {
            sidebar.classList.toggle("is-open");
        });
    }

    function initMarkdownEditor() {
        var source = document.querySelector("[data-md-source]");
        var preview = document.querySelector("[data-md-preview]");
        if (!source || !preview) return;
        if (typeof window.marked === "undefined") {
            preview.textContent = "(preview unavailable — failed to load marked.js)";
            return;
        }

        if (window.hljs) {
            window.marked.use({
                renderer: {
                    code: function (token) {
                        var lang = token.lang && window.hljs.getLanguage(token.lang) ? token.lang : "plaintext";
                        var highlighted = window.hljs.highlight(token.text, {language: lang}).value;
                        return '<pre><code class="hljs language-' + lang + '">' + highlighted + "</code></pre>";
                    },
                },
            });
        }

        // scrollTop we set programmatically, per pane, so the resulting scroll event is ignored
        var expected = new Map();

        var syncTo = function (from, to) {
            var max = from.scrollHeight - from.clientHeight;
            var ratio = max > 0 ? from.scrollTop / max : 0;
            var before = to.scrollTop;
            to.scrollTop = ratio * (to.scrollHeight - to.clientHeight);
            if (to.scrollTop !== before) expected.set(to, to.scrollTop);
        };

        var render = function () {
            try {
                preview.innerHTML = window.marked.parse(source.value);
            } catch (e) {
                preview.textContent = String(e);
            }
            syncTo(source, preview);
        };

        var raf = null;
        var schedule = function () {
            if (raf) cancelAnimationFrame(raf);
            raf = requestAnimationFrame(render);
        };

        source.addEventListener("input", schedule);
        render();

        var bind = function (from, to) {
            from.addEventListener("scroll", function () {
                if (expected.has(from)) {
                    var echo = Math.abs(from.scrollTop - expected.get(from)) < 1;
                    expected.delete(from);
                    if (echo) return;
                }
                syncTo(from, to);
            });
        };
        bind(source, preview);
        bind(preview, source);

        const TAB_SIZE = 2;
        source.addEventListener("keydown", function (e) {
            if (e.key === "Tab" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                var start = source.selectionStart;
                var end = source.selectionEnd;
                source.value = source.value.slice(0, start) + "  " + source.value.slice(end);
                source.selectionStart = source.selectionEnd = start + TAB_SIZE;
                schedule();
            }
        });
    }

    function init() {
        initConfirms();
        initFileLimits();
        initMobileSidebar();
        initMarkdownEditor();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
