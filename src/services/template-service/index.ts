import Handlebars from 'handlebars';
import { Converter } from 'showdown';
import { BaseHandlebarTemplateService } from '@lindeneg/funkallero';
import TEMPLATES from './templates';

const markdownToHtmlConverter = new Converter();

Handlebars.registerHelper('markdownToHtml', function (markdown) {
    return new Handlebars.SafeString(markdownToHtmlConverter.makeHtml(markdown));
}); 

class TemplateService extends BaseHandlebarTemplateService<typeof TEMPLATES> {
    constructor() {
        super(Handlebars, TEMPLATES);
    }
}

export default TemplateService;
