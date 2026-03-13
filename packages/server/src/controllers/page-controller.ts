import type { Request, Response, NextFunction } from 'express';
import type { PageResponse } from '@lindeneg/shared';
import { HttpException } from '../lib/http-exception.js';
import { PageError } from '../services/page-service.js';
import type PageService from '../services/page-service.js';

export function mapPageError(req: Request, error: string): HttpException {
  req.log.error(error);
  switch (error) {
    case PageError.NOT_FOUND:
      return HttpException.notFound();
  }
  return HttpException.internal();
}

class PageController {
  constructor(private readonly pageService: PageService) {}

  getBySlug = async (req: Request, res: Response<PageResponse>, next: NextFunction) => {
    const slug = req.params.slug as string;
    const result = await this.pageService.getPageBySlug(slug, true);
    if (!result.ok) return next(mapPageError(req, result.ctx));

    res.json(result.data);
  };
}

export default PageController;
