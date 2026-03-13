import { listPages } from '@/api/pages';
import { listAdminPosts } from '@/api/posts';
import { listMessages } from '@/api/contact';
import { useQuery } from './use-query';

interface DashboardStats {
  pageCount: number;
  postCount: number;
  messageCount: number;
}

async function fetchStats(): Promise<DashboardStats> {
  const params = { page: 1, pageSize: 1 };
  const [pages, posts, messages] = await Promise.all([
    listPages(params),
    listAdminPosts(params),
    listMessages(params),
  ]);
  return {
    pageCount: pages.total,
    postCount: posts.total,
    messageCount: messages.total,
  };
}

export function useDashboardStats() {
  return useQuery(fetchStats, []);
}
