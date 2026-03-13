export class ApiError extends Error {
  readonly status: number;
  readonly fields?: Record<string, unknown>;

  constructor(message: string, status: number, fields?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fields = fields;
  }

  get isUnauthorized() { return this.status === 401; }
  get isNotFound() { return this.status === 404; }
  get isValidation() { return this.status === 400; }
}

export function parseApiError(error: unknown): ApiError {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as {
      response?: { status: number; data?: { msg?: string; error?: unknown } };
    };
    const status = axiosError.response?.status ?? 500;
    const body = axiosError.response?.data;
    const message = body?.msg ?? 'Something went wrong';
    const fields =
      status === 400 && body?.error && typeof body.error === 'object'
        ? (body.error as Record<string, unknown>)
        : undefined;
    return new ApiError(message, status, fields);
  }
  if (error instanceof Error) {
    return new ApiError(error.message, 500);
  }
  return new ApiError('Something went wrong', 500);
}
