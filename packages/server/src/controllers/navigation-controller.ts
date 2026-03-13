import type { Request, Response, NextFunction } from 'express';
import type { NavigationResponse } from '@lindeneg/shared';
import { HttpException } from '../lib/http-exception.js';
import { NavigationError } from '../services/navigation-service.js';
import type NavigationService from '../services/navigation-service.js';

export function mapNavigationError(req: Request, error: string): HttpException {
  req.log.error(error);
  switch (error) {
    case NavigationError.NOT_FOUND:
      return HttpException.notFound();
  }
  return HttpException.internal();
}

class NavigationController {
  constructor(private readonly navigationService: NavigationService) {}

  get = async (_req: Request, res: Response<NavigationResponse>, next: NextFunction) => {
    const result = await this.navigationService.getNavigation();
    if (!result.ok) return next(mapNavigationError(_req, result.ctx));

    res.json(result.data);
  };
}

export default NavigationController;
