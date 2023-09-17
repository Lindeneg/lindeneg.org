import Handlebars from 'handlebars';
import { BaseHandlebarTemplateService } from '@lindeneg/funkallero';
import TEMPLATES from './templates';

export const toKebabCase = (s: string) => {
    if (!s) return '';
    const match = s.match(/[A-Z]{2,}(?=[A-Z][a-z]+\d*|\b)|[A-Z]?[a-z]+\d*|[A-Z]|\d+/g);
    if (match) {
        return match.join('-').toLowerCase();
    }
    return s;
};

Handlebars.registerHelper('kebabCase', function (s: string) {
    return new Handlebars.SafeString(toKebabCase(s));
});

class TemplateService extends BaseHandlebarTemplateService<typeof TEMPLATES> {
    constructor() {
        super(Handlebars, TEMPLATES);
    }
}

export default TemplateService;
