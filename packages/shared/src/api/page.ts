export interface PageSectionResponse {
  id: string;
  pageId: string;
  content: string;
  position: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PageResponse {
  id: string;
  name: string;
  slug: string;
  title: string;
  description: string;
  published: boolean;
  sections: PageSectionResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePageInput {
  name: string;
  slug: string;
  title: string;
  description: string;
  published: boolean;
}

export interface UpdatePageInput {
  name?: string;
  slug?: string;
  title?: string;
  description?: string;
  published?: boolean;
}

export interface CreateSectionInput {
  pageId: string;
  content: string;
  position: number;
  published: boolean;
}

export interface UpdateSectionInput {
  content?: string;
  position?: number;
  published?: boolean;
}
