import {
  success,
  emptySuccess,
  failure,
  type Result,
  type EmptyResult,
  type Paginated,
  type PaginationParams,
  type PageResponse,
  type PageSectionResponse,
  type CreatePageInput,
  type UpdatePageInput,
  type CreateSectionInput,
  type UpdateSectionInput,
} from '@lindeneg/shared';
import type { Page, PageSection } from '../generated/prisma/index.js';
import type PageRepository from '../repositories/page-repository.js';
import type SectionRepository from '../repositories/section-repository.js';
import { toSkipTake, paginate } from '../lib/pagination.js';

export const PageError = {
  NOT_FOUND: 'not_found',
  DB_ERROR: 'db_error',
} as const;

export type PageError = (typeof PageError)[keyof typeof PageError];

function toSectionResponse(section: PageSection): PageSectionResponse {
  return {
    id: section.id,
    pageId: section.pageId,
    content: section.content,
    position: section.position,
    published: section.published,
    createdAt: section.createdAt.toISOString(),
    updatedAt: section.updatedAt.toISOString(),
  };
}

function toPageResponse(page: Page & { sections: PageSection[] }): PageResponse {
  return {
    id: page.id,
    name: page.name,
    slug: page.slug,
    title: page.title,
    description: page.description,
    published: page.published,
    sections: page.sections.map(toSectionResponse),
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
  };
}

class PageService {
  constructor(
    private readonly pageRepo: PageRepository,
    private readonly sectionRepo: SectionRepository
  ) {}

  async listPages(pagination: PaginationParams): Promise<Result<Paginated<PageResponse>, PageError>> {
    const result = await this.pageRepo.list(toSkipTake(pagination));
    if (!result.ok) return failure(PageError.DB_ERROR);

    return success(paginate(result.data.data.map(toPageResponse), result.data.total, pagination));
  }

  async getPageBySlug(slug: string, publishedOnly: boolean): Promise<Result<PageResponse, PageError>> {
    const result = await this.pageRepo.getBySlug(slug);
    if (!result.ok) return failure(PageError.DB_ERROR);
    if (!result.data) return failure(PageError.NOT_FOUND);

    if (publishedOnly && !result.data.published) return failure(PageError.NOT_FOUND);

    const page = result.data;
    const response = toPageResponse(page);

    if (publishedOnly) {
      response.sections = response.sections
        .filter((s) => s.published)
        .sort((a, b) => a.position - b.position);
    }

    return success(response);
  }

  async createPage(input: CreatePageInput): Promise<Result<PageResponse, PageError>> {
    const result = await this.pageRepo.create({
      name: input.name,
      slug: input.slug,
      title: input.title,
      description: input.description,
      published: input.published,
    });
    if (!result.ok) return failure(PageError.DB_ERROR);

    return success(toPageResponse(result.data));
  }

  async updatePage(id: string, input: UpdatePageInput): Promise<Result<PageResponse, PageError>> {
    const result = await this.pageRepo.update(id, input);
    if (!result.ok) return failure(PageError.DB_ERROR);

    return success(toPageResponse(result.data));
  }

  async deletePage(id: string): Promise<EmptyResult<PageError>> {
    const result = await this.pageRepo.delete(id);
    if (!result.ok) return failure(PageError.DB_ERROR);

    return emptySuccess();
  }

  async createSection(input: CreateSectionInput): Promise<Result<PageSectionResponse, PageError>> {
    const result = await this.sectionRepo.create({
      pageId: input.pageId,
      content: input.content,
      position: input.position,
      published: input.published,
    });
    if (!result.ok) return failure(PageError.DB_ERROR);

    return success(toSectionResponse(result.data));
  }

  async updateSection(
    id: string,
    input: UpdateSectionInput
  ): Promise<Result<PageSectionResponse, PageError>> {
    const result = await this.sectionRepo.update(id, input);
    if (!result.ok) return failure(PageError.DB_ERROR);

    return success(toSectionResponse(result.data));
  }

  async deleteSection(id: string): Promise<EmptyResult<PageError>> {
    const result = await this.sectionRepo.delete(id);
    if (!result.ok) return failure(PageError.DB_ERROR);

    return emptySuccess();
  }
}

export default PageService;
