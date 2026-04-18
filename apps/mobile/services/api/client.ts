import type { ApiResponse } from "@/types/api";

export const API_BASE_URL = "https://api.example.com";

// TODO: Replace with Orval generated client
export async function mockRequest<T>(
  data: T,
  delay = 240,
): Promise<ApiResponse<T>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data, status: 200 });
    }, delay);
  });
}
