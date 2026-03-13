import type { Request, Response, NextFunction } from 'express';
import z from 'zod';
import type { NavigationResponse, NavigationItemResponse } from '@lindeneg/shared';
import { HttpException } from '../lib/http-exception.js';
import { parseRequestObj } from '../lib/parse.js';
import { NavigationError } from '../services/navigation-service.js';
import type NavigationService from '../services/navigation-service.js';

const updateNavigationSchema = z.object({
  brandName: z.string().min(1),
});

const createNavItemSchema = z.object({
  navigationId: z.string().min(1),
  name: z.string().min(1),
  href: z.string().min(1),
  position: z.number().int(),
  alignment: z.string().min(1),
  newTab: z.boolean(),
});

const updateNavItemSchema = z.object({
  name: z.string().min(1).optional(),
  href: z.string().min(1).optional(),
  position: z.number().int().optional(),
  alignment: z.string().min(1).optional(),
  newTab: z.boolean().optional(),
});

function mapNavigationError(req: Request, error: string): HttpException {
  req.log.error(error);
  if (error === NavigationError.NOT_FOUND) return HttpException.notFound();
  return HttpException.internal();
}

class AdminNavigationController {
  constructor(private readonly navigationService: NavigationService) {}

  updateNavigation = async (req: Request, res: Response<NavigationResponse>, next: NextFunction) => {
    const id = req.params.id as string;
    const parsed = await parseRequestObj(req.body, updateNavigationSchema);
    if (!parsed.ok) return next(parsed.ctx);

    const result = await this.navigationService.updateNavigation(id, parsed.data);
    if (!result.ok) return next(mapNavigationError(req, result.ctx));

    res.json(result.data);
  };

  createNavItem = async (req: Request, res: Response<NavigationItemResponse>, next: NextFunction) => {
    const parsed = await parseRequestObj(req.body, createNavItemSchema);
    if (!parsed.ok) return next(parsed.ctx);

    const result = await this.navigationService.createNavItem(parsed.data);
    if (!result.ok) return next(mapNavigationError(req, result.ctx));

    res.json(result.data);
  };

  updateNavItem = async (req: Request, res: Response<NavigationItemResponse>, next: NextFunction) => {
    const id = req.params.id as string;
    const parsed = await parseRequestObj(req.body, updateNavItemSchema);
    if (!parsed.ok) return next(parsed.ctx);

    const result = await this.navigationService.updateNavItem(id, parsed.data);
    if (!result.ok) return next(mapNavigationError(req, result.ctx));

    res.json(result.data);
  };

  deleteNavItem = async (req: Request, res: Response<{ success: true }>, next: NextFunction) => {
    const id = req.params.id as string;
    const result = await this.navigationService.deleteNavItem(id);
    if (!result.ok) return next(mapNavigationError(req, result.ctx));

    res.json({ success: true });
  };
}

export default AdminNavigationController;
