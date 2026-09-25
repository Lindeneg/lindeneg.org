import {icon} from "../icons.js";

export function Footer(): string {
    return `
        <footer class="site-footer">
            <div class="site-footer-inner">
                <p class="site-footer-copy">&copy; Christian Lindeneg ${new Date().getFullYear()}</p>
                <div class="site-footer-social">
                    <a href="https://github.com/lindeneg" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="GitHub">${icon("github")}</a>
                    <a href="https://www.linkedin.com/in/christian-l-954960190/" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="LinkedIn">${icon("linkedin")}</a>
                </div>
            </div>
        </footer>
    `;
}
