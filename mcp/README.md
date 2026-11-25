# Badminton Booking MCP Server

A local, read-only Model Context Protocol (MCP) adapter for this repository's existing Badminton Court Booking API.

## What it does

The MCP server exposes four intent-shaped tools to an MCP host such as VS Code Copilot:

| Tool | Existing REST operation | Required API scope |
|---|---|---|
| `search_courts` | `GET /v1/courts` | `courts:read` |
| `get_court_details` | `GET /v1/courts/{courtId}` | `courts:read` |
| `list_visible_bookings` | `GET /v1/bookings` | `bookings:read` |
| `get_booking_details` | `GET /v1/bookings/{bookingId}` | `bookings:read` |

The MCP server is a thin adapter. It does not connect directly to PostgreSQL and does not copy booking or permission rules. The existing REST service remains responsible for authentication, authorization, object visibility, validation, and database access.

All four tools are read-only. The MCP server does not create, cancel, or retire bookings/courts.

## Requirements

- Node.js 20 or newer
- The Badminton Booking API running locally at `http://localhost:3000`, or another API URL that accepts the same Keycloak token
- A Keycloak access token issued by the same Keycloak realm used by the API, with `courts:read` and `bookings:read`
- VS Code with an MCP-compatible agent host (or another MCP host)

## Install

From the repository root:

```bash
cd mcp
npm install
cp .env.example .env
```

Edit `mcp/.env` and paste a short-lived Keycloak token:

```dotenv
BOOKING_API_BASE_URL=http://localhost:3000/v1
BOOKING_ACCESS_TOKEN=paste_a_short_lived_access_token_here
```

Never commit `mcp/.env`. The repository's root `.gitignore` already ignores `.env` files and `node_modules/`.

To make the variables available to VS Code's native MCP configuration, load them into the environment before launching VS Code from the same terminal:

```bash
set -a
source mcp/.env
set +a
code .
```

The `code` command must be available in your shell. The repository's root `.mcp.json` references these environment variables and contains no token value.

## Local test token (development only)

The checked-in Keycloak realm includes a `test-cli` client with Direct Access Grants enabled and local demonstration accounts listed in the root README. This is for local coursework testing only; do not use the password grant or the demo password in a production environment.

With the local Keycloak container running on `http://localhost:8080`, request a token for the `student-a` test account. The optional `bookings:read` scope is requested explicitly; `courts:read` is a default scope for this local client:

```bash
curl -sS -X POST \
  'http://localhost:8080/realms/badminton-booking/protocol/openid-connect/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'client_id=test-cli' \
  --data-urlencode 'grant_type=password' \
  --data-urlencode 'username=student-a' \
  --data-urlencode 'password=password' \
  --data-urlencode 'scope=openid bookings:read'
```

Copy the `access_token` value from the JSON response into `mcp/.env`. The token is short-lived. If the API returns 401, obtain a fresh token and replace it. Do not paste tokens into chat, README files, screenshots, or GitHub.

## Configure VS Code Copilot

The repository includes a root `.mcp.json` for the native Copilot MCP configuration. Once `mcp/.env` exists and `npm install` has completed, launch VS Code from the terminal where you loaded those variables. Open Copilot Chat in Agent mode and make sure the `badminton-booking` MCP server is enabled.

VS Code's current native Copilot configuration reads `.mcp.json` and supports environment-variable references. The older `.vscode/mcp.json` editor-managed format is separate and should not be mixed with this configuration.

## Example prompts

- "Find all active courts at UGM Sports Hall."
- "Which courts are active and available?"
- "Show me my confirmed bookings."
- "Get the details for booking bkg_ownedByA."

The model should call the MCP tools, read their results, and answer from the returned API data. It must not invent court or booking identifiers.

## Errors and retry guidance

Tool errors include `retryable` and `nextStep` fields:

- `401`: obtain a fresh token from the same Keycloak realm.
- `403`: obtain a token carrying the required read scope; repeating the same call with the same token will not help.
- `404`: verify the identifier. For bookings, the API intentionally hides whether a record is absent or owned by another caller.
- `400`/`422`: correct the request; do not repeat unchanged.
- `429`/`5xx`/network timeout: wait, check service availability, then retry once.

Diagnostics are written to stderr. Standard output is reserved for MCP protocol messages.

## Security boundary

The MCP process receives a short-lived bearer token through a local environment variable. The token is not stored in the repository. The API verifies that token and enforces the same scope and object-visibility rules used by the web/mobile clients. The model cannot use tools that the MCP server does not register. This coursework version intentionally provides only read tools; consequential booking actions remain in the existing application.
