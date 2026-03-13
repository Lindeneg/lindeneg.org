import type { Request, Response, NextFunction } from 'express';
import type { Paginated, PostSummaryResponse, PostResponse } from '@lindeneg/shared';
import { HttpException } from '../lib/http-exception.js';
import { parsePagination } from '../lib/pagination.js';
import { PostError } from '../services/post-service.js';
import type PostService from '../services/post-service.js';

export function mapPostError(req: Request, error: string): HttpException {
  req.log.error(error);
  switch (error) {
    case PostError.NOT_FOUND:
      return HttpException.notFound();
  }
  return HttpException.internal();
}

class PostController {
  constructor(private readonly postService: PostService) {}

  list = async (req: Request, res: Response<Paginated<PostSummaryResponse>>, next: NextFunction) => {
    const pagination = parsePagination(req);
    const result = await this.postService.listPosts(pagination, true);
    if (!result.ok) return next(mapPostError(req, result.ctx));

    res.json(result.data);
  };

  getBySlug = async (req: Request, res: Response<PostResponse>, next: NextFunction) => {
    const slug = req.params.slug as string;
    const result = await this.postService.getPostBySlug(slug, true);
    if (!result.ok) return next(mapPostError(req, result.ctx));

    res.json(result.data);
  };
}

export default PostController;
