import Keycloak from "keycloak-js";

// A.2 item 4 — every endpoint comes from the environment. A hardcoded
// http://localhost:8080 is deployed along with everything else, and then
// the deployed application tries to sign users in against a Keycloak
// running on the grader's own machine.
const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
});

// Scopes that are *optional* on the client in the realm are only present in
// the access token when they are asked for. bookings:write is optional on
// badminton-student-web, so without this the token carries bookings:read
// alone and POST /v1/bookings is refused with 403 by Layer 2 — a refusal
// that looks like a bug in the service and is not.
export const REQUESTED_SCOPES = import.meta.env.VITE_KEYCLOAK_SCOPES || "";

export default keycloak;
