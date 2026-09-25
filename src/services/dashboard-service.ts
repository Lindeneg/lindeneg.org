import type {Result} from "../lib/result.js";
import type {DbError} from "../lib/errors.js";
import type PageRepository from "../repositories/page-repository.js";
import type PostRepository from "../repositories/post-repository.js";
import type ContactRepository from "../repositories/contact-repository.js";

export type DashboardCounts = {
    pages: number;
    posts: number;
    messages: number;
    unreadMessages: number;
};

const orZero = (r: Result<number, DbError>) => (r.ok ? r.data : 0);

class DashboardService {
    constructor(
        private readonly pageRepo: PageRepository,
        private readonly postRepo: PostRepository,
        private readonly contactRepo: ContactRepository
    ) {}

    async counts(): Promise<DashboardCounts> {
        const [pages, posts, messages, unreadMessages] = await Promise.all([
            this.pageRepo.count(),
            this.postRepo.count(),
            this.contactRepo.count(),
            this.contactRepo.count({read: false}),
        ]);
        return {
            pages: orZero(pages),
            posts: orZero(posts),
            messages: orZero(messages),
            unreadMessages: orZero(unreadMessages),
        };
    }
}

export default DashboardService;
