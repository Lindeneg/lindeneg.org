import {
  success,
  emptySuccess,
  failure,
  type Result,
  type EmptyResult,
  type NavigationResponse,
  type NavigationItemResponse,
  type UpdateNavigationInput,
  type CreateNavItemInput,
  type UpdateNavItemInput,
} from '@lindeneg/shared';
import type { Navigation, NavigationItem } from '@prisma/client';
import type NavigationRepository from '../repositories/navigation-repository.js';
import type NavigationItemRepository from '../repositories/navigation-item-repository.js';

export const NavigationError = {
  NOT_FOUND: 'not_found',
  DB_ERROR: 'db_error',
} as const;

export type NavigationError = (typeof NavigationError)[keyof typeof NavigationError];

function toNavItemResponse(item: NavigationItem): NavigationItemResponse {
  return {
    id: item.id,
    name: item.name,
    href: item.href,
    position: item.position,
    alignment: item.alignment,
    newTab: item.newTab,
  };
}

function toNavigationResponse(nav: Navigation & { items: NavigationItem[] }): NavigationResponse {
  return {
    id: nav.id,
    brandName: nav.brandName,
    items: nav.items.map(toNavItemResponse),
  };
}

class NavigationService {
  constructor(
    private readonly navRepo: NavigationRepository,
    private readonly navItemRepo: NavigationItemRepository
  ) {}

  async getNavigation(): Promise<Result<NavigationResponse, NavigationError>> {
    const result = await this.navRepo.get();
    if (!result.ok) return failure(NavigationError.DB_ERROR);
    if (!result.data) return failure(NavigationError.NOT_FOUND);

    return success(toNavigationResponse(result.data));
  }

  async updateNavigation(
    id: string,
    input: UpdateNavigationInput
  ): Promise<Result<NavigationResponse, NavigationError>> {
    const result = await this.navRepo.update(id, { brandName: input.brandName }, true);
    if (!result.ok) return failure(NavigationError.DB_ERROR);

    return success(toNavigationResponse(result.data as Navigation & { items: NavigationItem[] }));
  }

  async createNavItem(
    input: CreateNavItemInput
  ): Promise<Result<NavigationItemResponse, NavigationError>> {
    const result = await this.navItemRepo.create({
      navigationId: input.navigationId,
      name: input.name,
      href: input.href,
      position: input.position,
      alignment: input.alignment,
      newTab: input.newTab,
    });
    if (!result.ok) return failure(NavigationError.DB_ERROR);

    return success(toNavItemResponse(result.data));
  }

  async updateNavItem(
    id: string,
    input: UpdateNavItemInput
  ): Promise<Result<NavigationItemResponse, NavigationError>> {
    const result = await this.navItemRepo.update(id, input);
    if (!result.ok) return failure(NavigationError.DB_ERROR);

    return success(toNavItemResponse(result.data));
  }

  async deleteNavItem(id: string): Promise<EmptyResult<NavigationError>> {
    const result = await this.navItemRepo.delete(id);
    if (!result.ok) return failure(NavigationError.DB_ERROR);

    return emptySuccess();
  }
}

export default NavigationService;
