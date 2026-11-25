# Week 14 — MCP Court Discovery Assistant

## Objective

Add one AI-powered workflow to the Badminton Court Booking System using the Model Context Protocol (MCP). A user can ask an AI host questions in natural language, and the host can call the existing booking API through a local MCP server.

## Workflow

1. The user asks the AI host to find courts or review visible bookings.
2. The host reads the MCP tool descriptions and chooses an appropriate tool.
3. The MCP server sends an HTTP request to the existing `/v1` API using the configured bearer token.
4. The API verifies the token, checks the required scope and applies the current ownership/visibility rules.
5. The MCP server returns the API result to the host.
6. The host summarizes the returned data for the user.

## MCP tools

| Tool | Description | Existing API operation |
|---|---|---|
| `search_courts` | Searches a page of courts by status, text and availability | `GET /v1/courts` |
| `get_court_details` | Retrieves one court using its exact ID | `GET /v1/courts/{courtId}` |
| `list_visible_bookings` | Lists bookings visible to the authenticated caller | `GET /v1/bookings` |
| `get_booking_details` | Retrieves one visible booking | `GET /v1/bookings/{bookingId}` |

`search_courts` applies its optional text and availability filters to the API page returned. It uses the API's existing `status`, `limit`, and `cursor` parameters and returns `nextCursor` so the host can continue pagination.

## Architecture

- **Host:** VS Code Copilot Agent (or another MCP-compatible host).
- **MCP client:** the MCP client managed by the host.
- **MCP server:** `mcp/server.mjs`, using the official MCP TypeScript SDK over stdio.
- **Service:** the existing Express API under `service/`; it remains the source of truth for permissions and data.
- **Database:** the existing PostgreSQL database, accessed only by the service.

The MCP server is an adapter. It does not connect directly to PostgreSQL and does not reimplement business or authorization rules.

## Authentication and safety

The MCP process receives a short-lived Keycloak access token through a local environment variable. The token is not stored in the repository. The service continues to enforce `courts:read` and `bookings:read` and the caller's booking visibility. There is no `ownerId` input to the booking tools.

The four tools are read-only. This version does not expose booking creation, cancellation, or court retirement, so the agent cannot perform those consequential actions. Errors tell the host whether a retry can help and what the next action should be.

## Setup

See [`../mcp/README.md`](../mcp/README.md) for installation, token configuration, VS Code setup, example prompts, and troubleshooting.

## Example demonstration

Prompt: "Find all active courts at UGM Sports Hall and show me my confirmed bookings."

Expected flow:

- The host calls `search_courts` with active status and the search term.
- The host reads the returned court IDs and availability.
- The host calls `list_visible_bookings` with `status=confirmed`.
- The host summarizes only the API results returned to it.

## Scope of this implementation

This delivers the MCP server, intent-shaped read tools, descriptions, retry guidance, and API integration. Delegated tokens, server-side delegation caps, irreversible-action confirmation, append-only audit/revocation, and A2A are not claimed as implemented in this version.
