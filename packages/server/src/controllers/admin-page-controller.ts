import type { Request, Response, NextFunction } from 'express';
import z from 'zod';
import type { Paginated, PageResponse, PageSectionResponse } from '@lindeneg/shared';
import { HttpException } from '../lib/http-exception.js';
import { parsePagination } from '../lib/pagination.js';
import { parseRequestObj } from '../lib/parse.js';
import { PageError } from '../services/page-service.js';
import type PageService from '../services/page-service.js';

const createPageSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  published: z.boolean(),
});

const updatePageSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  published: z.boolean().optional(),
});

const createSectionSchema = z.object({
  pageId: z.string().min(1),
  content: z.string().min(1),
  position: z.number().int(),
  published: z.boolean(),
});

const updateSectionSchema = z.object({
  content: z.string().min(1).optional(),
  position: z.number().int().optional(),
  published: z.boolean().optional(),
});

function mapPageError(req: Request, error: string): HttpException {
  req.log.error(error);
  if (error === PageError.NOT_FOUND) return HttpException.notFound();
  return HttpException.internal();
}

class AdminPageController {
  constructor(private readonly pageService: PageService) {}

  listPages = async (req: Request, res: Response<Paginated<PageResponse>>, next: NextFunction) => {
    const pagination = parsePagination(req);
    const result = await this.pageService.listPages(pagination);
    if (!result.ok) return next(mapPageError(req, result.ctx));

    res.json(result.data);
  };

  createPage = async (req: Request, res: Response<PageResponse>, next: NextFunction) => {
    const parsed = await parseRequestObj(req.body, createPageSchema);
    if (!parsed.ok) return next(parsed.ctx);

    const result = await this.pageService.createPage(parsed.data);
    if (!result.ok) return next(mapPageError(req, result.ctx));

    res.json(result.data);
  };

  updatePage = async (req: Request, res: Response<PageResponse>, next: NextFunction) => {
    const id = req.params.id as string;
    const parsed = await parseRequestObj(req.body, updatePageSchema);
    if (!parsed.ok) return next(parsed.ctx);

    const result = await this.pageService.updatePage(id, parsed.data);
    if (!result.ok) return next(mapPageError(req, result.ctx));

    res.json(result.data);
  };

  deletePage = async (req: Request, res: Response<{ success: true }>, next: NextFunction) => {
    const id = req.params.id as string;
    const result = await this.pageService.deletePage(id);
    if (!result.ok) return next(mapPageError(req, result.ctx));

    res.json({ success: true });
  };

  createSection = async (req: Request, res: Response<PageSectionResponse>, next: NextFunction) => {
    const parsed = await parseRequestObj(req.body, createSectionSchema);
    if (!parsed.ok) return next(parsed.ctx);

    const result = await this.pageService.createSection(parsed.data);
    if (!result.ok) return next(mapPageError(req, result.ctx));

    res.json(result.data);
  };

  updateSection = async (req: Request, res: Response<PageSectionResponse>, next: NextFunction) => {
    const id = req.params.id as string;
    const parsed = await parseRequestObj(req.body, updateSectionSchema);
    if (!parsed.ok) return next(parsed.ctx);

    const result = await this.pageService.updateSection(id, parsed.data);
    if (!result.ok) return next(mapPageError(req, result.ctx));

    res.json(result.data);
  };

  deleteSection = async (req: Request, res: Response<{ success: true }>, next: NextFunction) => {
    const id = req.params.id as string;
    const result = await this.pageService.deleteSection(id);
    if (!result.ok) return next(mapPageError(req, result.ctx));

    res.json({ success: true });
  };
}

export default AdminPageController;
