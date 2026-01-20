export interface SearchReposInput {
  query: string;
  limit?: number;
}

export interface GetRepoInput {
  owner: string;
  repo: string;
}

// Type guards for tool inputs
export function isSearchReposInput(value: unknown): value is SearchReposInput {
  return (
    typeof value === "object" &&
    value !== null &&
    "query" in value &&
    typeof (value as SearchReposInput).query === "string"
  );
}

export function isGetRepoInput(value: unknown): value is GetRepoInput {
  return (
    typeof value === "object" &&
    value !== null &&
    "owner" in value &&
    "repo" in value &&
    typeof (value as GetRepoInput).owner === "string" &&
    typeof (value as GetRepoInput).repo === "string"
  );
}

interface GitHubSearchResponse {
  items: Array<{ full_name: string; stargazers_count: number }>;
}

interface GitHubRepoResponse {
  full_name: string;
  description: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string;
  license: { name: string } | null;
  updated_at: string;
}

export const searchReposTool = {
  name: "search_repos" as const,
  description:
    "Search GitHub repositories by keyword. Returns top results. Use get_repo for details.",
  input_schema: {
    type: "object" as const,
    properties: {
      query: {
        type: "string",
        description: "Search query (e.g., 'typescript orm')",
      },
      limit: { type: "number", description: "Max results (default 5)" },
    },
    required: ["query"],
  },
  run: async (input: SearchReposInput): Promise<string> => {
    const response = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(input.query)}&sort=stars&per_page=${input.limit ?? 5}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "DurableAgent/1.0",
        },
      },
    );
    if (!response.ok) return `Search failed: ${response.status}`;
    const data = await response.json<GitHubSearchResponse>();
    return JSON.stringify(
      data.items.map((r) => ({ name: r.full_name, stars: r.stargazers_count })),
    );
  },
};

export const getRepoTool = {
  name: "get_repo" as const,
  description:
    "Get detailed info about a GitHub repository including stars, forks, and description.",
  input_schema: {
    type: "object" as const,
    properties: {
      owner: {
        type: "string",
        description: "Repository owner (e.g., 'cloudflare')",
      },
      repo: {
        type: "string",
        description: "Repository name (e.g., 'workers-sdk')",
      },
    },
    required: ["owner", "repo"],
  },
  run: async (input: GetRepoInput): Promise<string> => {
    const response = await fetch(
      `https://api.github.com/repos/${input.owner}/${input.repo}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "DurableAgent/1.0",
        },
      },
    );
    if (!response.ok) return `Repo not found: ${input.owner}/${input.repo}`;
    const data = await response.json<GitHubRepoResponse>();
    return JSON.stringify({
      name: data.full_name,
      description: data.description,
      stars: data.stargazers_count,
      forks: data.forks_count,
      issues: data.open_issues_count,
      language: data.language,
      license: data.license?.name ?? "None",
      updated: data.updated_at,
    });
  },
};

export const tools = [searchReposTool, getRepoTool];
