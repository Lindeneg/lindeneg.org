export interface ContactMessageResponse {
  id: string;
  name: string;
  email: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface CreateContactInput {
  name: string;
  email: string;
  message: string;
}

export interface UpdateContactInput {
  read: boolean;
}
