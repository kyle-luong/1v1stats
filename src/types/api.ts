// src/types/api.ts
// API response and common types

/**
 * Generic API error response
 */
export interface ApiError {
  message: string;
  code?: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Sort direction
 */
export type SortDirection = "asc" | "desc";

/**
 * Common sort options
 */
export interface SortOptions<T extends string = string> {
  field: T;
  direction: SortDirection;
}
