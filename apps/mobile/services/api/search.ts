import { MOCK_TRENDING } from "@/mocks/data";
import { mockRequest } from "@/services/api/client";
import type { ApiResponse } from "@/types/api";
import type { Track } from "@/types/domain";

export async function mockSearch(query: string): Promise<ApiResponse<Track[]>> {
  const normalized = query.trim().toLowerCase();
  const results = normalized
    ? MOCK_TRENDING.filter((track) =>
        `${track.title} ${track.artist.name}`
          .toLowerCase()
          .includes(normalized),
      )
    : MOCK_TRENDING;

  return mockRequest(results);
}
