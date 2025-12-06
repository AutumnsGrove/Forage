/**
 * grove-domain-tool Worker Entry Point
 *
 * Handles incoming requests and routes them to the appropriate Durable Object.
 * Exposes MCP-style tool endpoints for domain search operations.
 */

import type { Env } from "./types";
import { SearchJobDO } from "./durable-object";

// Re-export Durable Object class
export { SearchJobDO };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers for API access
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Health check
      if (path === "/" || path === "/health") {
        return new Response(
          JSON.stringify({
            status: "ok",
            service: "grove-domain-tool",
            version: "0.1.0",
            environment: env.ENVIRONMENT,
          }),
          {
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      }

      // API routes
      if (path.startsWith("/api/")) {
        const response = await handleApiRequest(request, env, path);
        // Add CORS headers to response
        const newHeaders = new Headers(response.headers);
        Object.entries(corsHeaders).forEach(([key, value]) => {
          newHeaders.set(key, value);
        });
        return new Response(response.body, {
          status: response.status,
          headers: newHeaders,
        });
      }

      return new Response("Not found", {
        status: 404,
        headers: corsHeaders,
      });
    } catch (error) {
      console.error("Worker error:", error);
      return new Response(
        JSON.stringify({ error: String(error) }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }
  },
};

/**
 * Handle API requests
 */
async function handleApiRequest(
  request: Request,
  env: Env,
  path: string
): Promise<Response> {
  // Parse the path: /api/{action}?job_id=xxx
  const url = new URL(request.url);
  const action = path.replace("/api/", "").split("/")[0];

  switch (action) {
    case "search":
      return handleSearch(request, env, url);
    case "status":
      return handleStatus(request, env, url);
    case "results":
      return handleResults(request, env, url);
    case "followup":
      return handleFollowup(request, env, url);
    case "resume":
      return handleResume(request, env, url);
    case "cancel":
      return handleCancel(request, env, url);
    case "stream":
      return handleStream(request, env, url);
    case "jobs":
      return handleJobs(request, env, url);
    default:
      return new Response(
        JSON.stringify({ error: `Unknown action: ${action}` }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
  }
}

/**
 * Start a new domain search
 * POST /api/search
 * Body: { client_id: string, quiz_responses: InitialQuizResponse }
 */
async function handleSearch(
  request: Request,
  env: Env,
  url: URL
): Promise<Response> {
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  const body = await request.json() as {
    client_id: string;
    quiz_responses: Record<string, unknown>;
    driver_provider?: string;
    swarm_provider?: string;
  };

  if (!body.client_id || !body.quiz_responses) {
    return new Response(
      JSON.stringify({ error: "Missing client_id or quiz_responses" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Validate provider names if provided
  const validProviders = ["claude", "deepseek", "kimi", "cloudflare"];
  if (body.driver_provider && !validProviders.includes(body.driver_provider)) {
    return new Response(
      JSON.stringify({ error: `Invalid driver_provider. Valid options: ${validProviders.join(", ")}` }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  if (body.swarm_provider && !validProviders.includes(body.swarm_provider)) {
    return new Response(
      JSON.stringify({ error: `Invalid swarm_provider. Valid options: ${validProviders.join(", ")}` }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Generate job ID
  const jobId = crypto.randomUUID();

  // Get Durable Object stub
  const doId = env.SEARCH_JOB.idFromName(jobId);
  const stub = env.SEARCH_JOB.get(doId);

  // Forward request to DO with provider overrides
  const doRequest = new Request("http://do/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      job_id: jobId,
      client_id: body.client_id,
      quiz_responses: body.quiz_responses,
      driver_provider: body.driver_provider,
      swarm_provider: body.swarm_provider,
    }),
  });

  return stub.fetch(doRequest);
}

/**
 * Get search status
 * GET /api/status?job_id=xxx
 */
async function handleStatus(
  request: Request,
  env: Env,
  url: URL
): Promise<Response> {
  const jobId = url.searchParams.get("job_id");
  if (!jobId) {
    return new Response(
      JSON.stringify({ error: "Missing job_id parameter" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const doId = env.SEARCH_JOB.idFromName(jobId);
  const stub = env.SEARCH_JOB.get(doId);

  return stub.fetch(new Request("http://do/status"));
}

/**
 * Get search results
 * GET /api/results?job_id=xxx
 */
async function handleResults(
  request: Request,
  env: Env,
  url: URL
): Promise<Response> {
  const jobId = url.searchParams.get("job_id");
  if (!jobId) {
    return new Response(
      JSON.stringify({ error: "Missing job_id parameter" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const doId = env.SEARCH_JOB.idFromName(jobId);
  const stub = env.SEARCH_JOB.get(doId);

  return stub.fetch(new Request("http://do/results"));
}

/**
 * Get follow-up quiz
 * GET /api/followup?job_id=xxx
 */
async function handleFollowup(
  request: Request,
  env: Env,
  url: URL
): Promise<Response> {
  const jobId = url.searchParams.get("job_id");
  if (!jobId) {
    return new Response(
      JSON.stringify({ error: "Missing job_id parameter" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const doId = env.SEARCH_JOB.idFromName(jobId);
  const stub = env.SEARCH_JOB.get(doId);

  return stub.fetch(new Request("http://do/followup"));
}

/**
 * Cancel a running search
 * POST /api/cancel?job_id=xxx
 */
async function handleCancel(
  request: Request,
  env: Env,
  url: URL
): Promise<Response> {
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  const jobId = url.searchParams.get("job_id");
  if (!jobId) {
    return new Response(
      JSON.stringify({ error: "Missing job_id parameter" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const doId = env.SEARCH_JOB.idFromName(jobId);
  const stub = env.SEARCH_JOB.get(doId);

  return stub.fetch(new Request("http://do/cancel", { method: "POST" }));
}

/**
 * Resume search with follow-up responses
 * POST /api/resume?job_id=xxx
 * Body: { followup_responses: Record<string, string | string[]> }
 */
async function handleResume(
  request: Request,
  env: Env,
  url: URL
): Promise<Response> {
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  const jobId = url.searchParams.get("job_id");
  if (!jobId) {
    return new Response(
      JSON.stringify({ error: "Missing job_id parameter" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const body = await request.json();

  const doId = env.SEARCH_JOB.idFromName(jobId);
  const stub = env.SEARCH_JOB.get(doId);

  return stub.fetch(
    new Request("http://do/resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

/**
 * Stream search progress (SSE)
 * GET /api/stream?job_id=xxx
 */
async function handleStream(
  request: Request,
  env: Env,
  url: URL
): Promise<Response> {
  const jobId = url.searchParams.get("job_id");
  if (!jobId) {
    return new Response(
      JSON.stringify({ error: "Missing job_id parameter" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const doId = env.SEARCH_JOB.idFromName(jobId);
  const stub = env.SEARCH_JOB.get(doId);

  const response = await stub.fetch(new Request("http://do/stream"));

  // Add CORS headers for SSE
  const newHeaders = new Headers(response.headers);
  newHeaders.set("Access-Control-Allow-Origin", "*");
  newHeaders.set("Access-Control-Allow-Headers", "Content-Type");

  return new Response(response.body, {
    status: response.status,
    headers: newHeaders,
  });
}

/**
 * Query multiple jobs at once
 * POST /api/jobs
 * Body: { job_ids: string[] }
 * Returns status and results for each job that exists
 */
async function handleJobs(
  request: Request,
  env: Env,
  url: URL
): Promise<Response> {
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  const body = await request.json() as { job_ids?: string[] };
  const jobIds = body.job_ids || [];

  if (!Array.isArray(jobIds) || jobIds.length === 0) {
    return new Response(
      JSON.stringify({ error: "job_ids array is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Limit to 50 jobs per request to prevent abuse
  const limitedJobIds = jobIds.slice(0, 50);

  // Query each DO in parallel
  const results = await Promise.all(
    limitedJobIds.map(async (jobId) => {
      try {
        const doId = env.SEARCH_JOB.idFromName(jobId);
        const stub = env.SEARCH_JOB.get(doId);
        const response = await stub.fetch(new Request("http://do/status"));

        if (!response.ok) {
          return { job_id: jobId, exists: false };
        }

        const status = await response.json();
        return { job_id: jobId, exists: true, ...status };
      } catch {
        return { job_id: jobId, exists: false, error: "Failed to query" };
      }
    })
  );

  return new Response(
    JSON.stringify({ jobs: results }),
    { headers: { "Content-Type": "application/json" } }
  );
}
