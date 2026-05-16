(function () {
    try {
        var t = localStorage.getItem('theme');
        var p = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (t === 'dark' || (!t && p)) {
            document.documentElement.classList.add('dark');
        }
    } catch (e) {}
})();
