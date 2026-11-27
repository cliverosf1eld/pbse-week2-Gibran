## Week 14 — MCP Court Discovery Assistant

This project includes a local MCP server that lets an AI host discover badminton courts and inspect bookings through the existing REST API.

The MCP server is a thin adapter in `mcp/server.mjs`. It exposes four read-only intent tools: `search_courts`, `get_court_details`, `list_visible_bookings`, and `get_booking_details`. These call the existing `GET /v1/courts`, `GET /v1/courts/{courtId}`, `GET /v1/bookings`, and `GET /v1/bookings/{bookingId}` operations. The MCP server does not connect directly to PostgreSQL or duplicate the API's authorization and ownership rules.

The API continues to enforce the `courts:read` and `bookings:read` scopes. Booking visibility is derived from the authenticated token; the MCP tools do not accept an `ownerId`. All four tools are read-only, so the agent cannot create or cancel bookings or retire courts.

For setup and demonstration instructions, see [`mcp/README.md`](mcp/README.md) and [`docs/week14-mcp-implementation.md`](docs/week14-mcp-implementation.md).

### Known issue / team follow-up

The local MCP token-refresh script currently fails because Keycloak rejects the requested `openid bookings:read` scopes for the `test-cli` client. Please verify the imported realm's `test-cli` client-scope configuration and confirm the token request works before the live demo. Keycloak also requires `KC_ADMIN_PASSWORD` in the project-root `.env` to start.
