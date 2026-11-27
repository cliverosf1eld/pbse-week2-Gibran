import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";

const SERVER_NAME = "badminton-booking";
const SERVER_VERSION = "1.0.0";
const DEFAULT_API_BASE_URL = "http://localhost:3000/v1";
const REQUEST_TIMEOUT_MS = 12_000;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.join(__dirname, ".env");

function getConfig() {
  let fileEnv = {};

  try {
    fileEnv = parseEnv(fs.readFileSync(ENV_PATH, "utf8"));
  } catch {
    // Fall back to process.env if .env is unavailable.
  }

  return {
    apiBaseUrl: (
      fileEnv.BOOKING_API_BASE_URL ||
      process.env.BOOKING_API_BASE_URL ||
      DEFAULT_API_BASE_URL
    )
      .trim()
      .replace(/\/+$/, ""),

    accessToken: (
      fileEnv.BOOKING_ACCESS_TOKEN ||
      process.env.BOOKING_ACCESS_TOKEN ||
      ""
    ).trim()
  };
}

class ApiError extends Error {
  constructor({ message, status = null, retryable = false, nextStep }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.retryable = retryable;
    this.nextStep = nextStep;
  }
}

function makeUrl(apiBaseUrl, path, query = {}) {
  const url = new URL(`${apiBaseUrl}/${path.replace(/^\/+/, "")}`);

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  return url;
}

async function apiGet(path, query = {}) {
  const { apiBaseUrl, accessToken } = getConfig();

  if (!accessToken) {
    throw new ApiError({
      message: "BOOKING_ACCESS_TOKEN is not configured.",
      retryable: false,
      nextStep:
        "Set BOOKING_ACCESS_TOKEN in the environment used to launch the MCP host. For local development, copy mcp/.env.example to mcp/.env, then export its values before launching VS Code. Never commit mcp/.env."
    });
  }

  let response;
  try {
    response = await fetch(makeUrl(apiBaseUrl, path, query), {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
  } catch (error) {
    const timedOut = error?.name === "TimeoutError" || error?.name === "AbortError";
    throw new ApiError({
      message: timedOut
        ? `The booking API did not respond within ${REQUEST_TIMEOUT_MS / 1000} seconds.`
        : `Could not reach the booking API: ${error?.message || "network error"}`,
      retryable: true,
      nextStep:
        "Check that the API is running and BOOKING_API_BASE_URL points to its /v1 base URL. Retry once after the service is reachable."
    });
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const status = response.status;
    const detail = body?.detail || body?.title || `HTTP ${status}`;
    const requiredScopes = Array.isArray(body?.requiredScopes)
      ? body.requiredScopes
      : [];

    let retryable = false;
    let nextStep = "Check the request and the API response before continuing.";

    if (status === 401) {
      nextStep =
        "Run npm run token in mcp/, then retry once.";
    } else if (status === 403) {
      nextStep = requiredScopes.length
        ? `This token lacks ${requiredScopes.join(", ")}. Obtain a token with the required scope; retrying with the same token will not help.`
        : "This token lacks the permission required by the API. Obtain a correctly scoped token; retrying with the same token will not help.";
    } else if (status === 404) {
      nextStep =
        "Check the exact identifier returned by the corresponding list tool. For bookings, the API intentionally uses the same 404 response for a missing booking and one the caller is not allowed to read.";
    } else if (status === 429) {
      retryable = true;
      const retryAfter = response.headers.get("Retry-After");
      nextStep = retryAfter
        ? `The API rate limit was reached. Wait ${retryAfter} before retrying. Do not retry in a tight loop.`
        : "The API rate limit was reached. Wait before retrying; do not retry in a tight loop.";
    } else if (status >= 500) {
      retryable = true;
      nextStep =
        "The server reported a temporary failure. Wait briefly, then retry once. If it continues, report the request failure rather than guessing or looping.";
    } else if (status === 400 || status === 422) {
      nextStep =
        "The API rejected the request parameters. Correct the inputs based on the response; do not repeat the same request unchanged.";
    }

    throw new ApiError({ message: detail, status, retryable, nextStep });
  }

  return body;
}

function success(data) {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
  };
}

function failure(error) {
  const result = {
    error: error?.message || "Unexpected MCP server error",
    retryable: error instanceof ApiError ? error.retryable : false,
    nextStep:
      error instanceof ApiError
        ? error.nextStep
        : "Do not repeat the same call automatically. Check the MCP server configuration and logs."
  };

  if (error instanceof ApiError && error.status !== null) {
    result.httpStatus = error.status;
  }

  // Stdio reserves stdout for MCP protocol messages. Diagnostics go to stderr.
  console.error(`[${SERVER_NAME}] ${result.error}`);

  return {
    isError: true,
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
  };
}

async function runTool(work) {
  try {
    return success(await work());
  } catch (error) {
    return failure(error);
  }
}

function createServer() {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION
  });

  const readOnlyAnnotations = {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  };

  server.registerTool(
    "search_courts",
    {
      title: "Search badminton courts",
      description:
        "Read-only search of the Badminton Court Booking System. Calls GET /v1/courts using the API's supported status, limit, and cursor parameters. The optional query text and availableOnly filter are applied by this MCP adapter to the returned page (query matches court name, location, or courtType). Only courts with status=active AND isAvailable=true are bookable. If nextCursor is returned, call this tool again with the same filters and that cursor to continue searching. Use only court IDs returned by this tool; never invent an ID.",
      inputSchema: z.object({
        query: z.string().trim().max(120).optional()
          .describe("Optional case-insensitive text matched against court name, location, and court type on this page."),
        status: z.enum(["active", "retired"]).optional()
          .describe("Optional server-side status filter. Omit to include both active and retired courts."),
        availableOnly: z.boolean().default(false)
          .describe("When true, keep only courts whose status is active and isAvailable is true."),
        limit: z.number().int().min(1).max(100).default(20)
          .describe("Number of courts requested from the API page; minimum 1, maximum 100."),
        cursor: z.string().optional()
          .describe("Opaque nextCursor returned by a previous search_courts call. Pass it unchanged to read the next page.")
      }),
      annotations: readOnlyAnnotations
    },
    async ({ query, status, availableOnly, limit, cursor }) =>
      runTool(async () => {
        const page = await apiGet("courts", { status, limit, cursor });
        const normalizedQuery = query?.toLocaleLowerCase();

        const items = (Array.isArray(page?.items) ? page.items : []).filter((court) => {
          if (availableOnly && !(court.status === "active" && court.isAvailable === true)) {
            return false;
          }

          if (!normalizedQuery) return true;

          const searchable = [court.name, court.location, court.courtType]
            .filter(Boolean)
            .join(" ")
            .toLocaleLowerCase();

          return searchable.includes(normalizedQuery);
        });

        return {
          items,
          count: items.length,
          appliedFilters: {
            query: query || null,
            status: status || null,
            availableOnly,
            limit
          },
          nextCursor: page?.nextCursor || null,
          note: page?.nextCursor
            ? "More API results are available. Continue with the same filters and the returned nextCursor."
            : "This is the last API page."
        };
      })
  );

  server.registerTool(
    "get_court_details",
    {
      title: "Get badminton court details",
      description:
        "Read-only lookup of one badminton court. Calls GET /v1/courts/{courtId}. The courtId must be copied exactly from search_courts. A 404 means the court was not found; do not guess alternative IDs.",
      inputSchema: z.object({
        courtId: z.string().regex(/^crt_[A-Za-z0-9]{3,}$/)
          .describe("Exact court ID returned by search_courts, for example crt_51Fa93cD.")
      }),
      annotations: readOnlyAnnotations
    },
    async ({ courtId }) => runTool(() => apiGet(`courts/${encodeURIComponent(courtId)}`))
  );

  server.registerTool(
    "list_visible_bookings",
    {
      title: "List visible bookings",
      description:
        "Read-only list of bookings visible to the authenticated API caller. Calls GET /v1/bookings. The API derives visibility from the bearer token: a normal student sees their own bookings, while a caller with bookings:fulfil may see all bookings. There is deliberately no ownerId argument; never ask for or invent one. Supports status, limit, and opaque cursor pagination.",
      inputSchema: z.object({
        status: z.enum(["confirmed", "cancelled"]).optional()
          .describe("Optional booking status filter."),
        limit: z.number().int().min(1).max(100).default(20)
          .describe("Number of bookings requested from the API page; minimum 1, maximum 100."),
        cursor: z.string().optional()
          .describe("Opaque nextCursor from an earlier list_visible_bookings result. Pass it unchanged.")
      }),
      annotations: readOnlyAnnotations
    },
    async ({ status, limit, cursor }) =>
      runTool(async () => {
        const page = await apiGet("bookings", { status, limit, cursor });
        return {
          items: Array.isArray(page?.items) ? page.items : [],
          count: Array.isArray(page?.items) ? page.items.length : 0,
          nextCursor: page?.nextCursor || null
        };
      })
  );

  server.registerTool(
    "get_booking_details",
    {
      title: "Get booking details",
      description:
        "Read-only lookup of one booking. Calls GET /v1/bookings/{bookingId}. The bookingId must come from list_visible_bookings or another trusted project response. The API intentionally returns the same 404 for a booking that does not exist and one the caller is not allowed to read; do not infer which case occurred.",
      inputSchema: z.object({
        bookingId: z.string().regex(/^bkg_[A-Za-z0-9]{3,}$/)
          .describe("Exact booking ID returned by list_visible_bookings, for example bkg_ownedByA.")
      }),
      annotations: readOnlyAnnotations
    },
    async ({ bookingId }) => runTool(() => apiGet(`bookings/${encodeURIComponent(bookingId)}`))
  );

  return server;
}

await serveStdio(createServer);
