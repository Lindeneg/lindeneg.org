export interface NavigationItemResponse {
  id: string;
  name: string;
  href: string;
  position: number;
  alignment: string;
  newTab: boolean;
}

export interface NavigationResponse {
  id: string;
  brandName: string;
  items: NavigationItemResponse[];
}

export interface CreateNavigationInput {
  brandName: string;
}

export interface UpdateNavigationInput {
  brandName: string;
}

export interface CreateNavItemInput {
  navigationId: string;
  name: string;
  href: string;
  position: number;
  alignment: string;
  newTab: boolean;
}

export interface UpdateNavItemInput {
  name?: string;
  href?: string;
  position?: number;
  alignment?: string;
  newTab?: boolean;
}
