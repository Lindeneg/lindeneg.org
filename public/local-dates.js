(function () {
    "use strict";

    // must match the formats in formatDate (src/ui/lib.ts), minus the UTC timezone
    var FORMATS = {
        short: {month: "short", day: "numeric", year: "numeric"},
        long: {month: "long", day: "numeric", year: "numeric"},
    };

    function localizeDates() {
        document.querySelectorAll("time[data-local-date]").forEach(function (el) {
            var format = FORMATS[el.dataset.localDate];
            var date = new Date(el.getAttribute("datetime"));
            if (!format || isNaN(date.getTime())) return;
            el.textContent = date.toLocaleDateString("en-US", format);
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", localizeDates);
    } else {
        localizeDates();
    }
})();
