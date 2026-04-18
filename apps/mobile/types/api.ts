export type ApiResponse<T> = {
  data: T;
  status: number;
};

export type PaginatedResponse<T> = {
  data: T;
  status: number;
  page: number;
  perPage: number;
  total: number;
};

export type ErrorResponse = {
  status: number;
  message: string;
  details?: Record<string, string | string[]>;
};
