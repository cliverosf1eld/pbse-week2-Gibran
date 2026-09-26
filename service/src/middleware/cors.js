// A.4 — Same-origin policy and CORS.
//
// CORS governs what a browser lets a page *read*. It is not access control:
// the request is still delivered to this service and still processed, and a
// non-browser caller (curl, another service) is not affected by any of it.
// Every rule that matters is enforced by the auth layers, not here.

const logger = require("../logger");

// An explicit list, never the reflected Origin header. Reflecting
// req.get("Origin") back looks specific while in fact permitting every
// origin on the internet, because the browser sends whatever origin the
// page came from and the check always passes.
//
// Origin is scheme + host + port. All three must match exactly:
// http://localhost:5173 and http://localhost:3000 are different origins,
// and so are the http:// and https:// forms of the same host.
const ALLOWED_ORIGINS = (process.env.CORS_ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// The methods the contract actually uses. Every write in openapi.yaml is a
// POST; there is no PUT, PATCH or DELETE to allow.
const ALLOWED_METHODS = "GET, POST, OPTIONS";

// Request headers the browser must be told it may send. Authorization and
// Content-Type: application/json are both non-simple, so their presence is
// what triggers the preflight in the first place. If-Match and
// If-None-Match are listed now so the conditional reads and writes (A.7,
// A.8) do not fail with a preflight error the moment they are added.
const ALLOWED_HEADERS = [
  "Authorization",
  "Content-Type",
  "Idempotency-Key",
  "If-Match",
  "If-None-Match",
  "X-Request-Id",
].join(", ");

// Response headers JavaScript is allowed to read. Without this the browser
// hides ETag from the page even on a successful 200 — only a handful of
// headers are exposed by default — and A.7 has nothing to send back in
// If-None-Match.
const EXPOSED_HEADERS = ["ETag", "X-Request-Id", "Location"].join(", ");

// How long a browser may cache the preflight result, in seconds.
const MAX_AGE = "600";

function isAllowed(origin) {
  return Boolean(origin) && ALLOWED_ORIGINS.includes(origin);
}

function cors(req, res, next) {
  const origin = req.get("Origin");

  // Vary: Origin is set on every response, including the ones that are
  // refused. The header the service returns depends on the request's
  // Origin, so a shared cache that ignored this could hand one origin's
  // allow-header to a page from a different origin.
  res.set("Vary", "Origin");

  if (isAllowed(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Access-Control-Expose-Headers", EXPOSED_HEADERS);

    // Access-Control-Allow-Credentials is deliberately not set. This
    // service is called with a bearer token in the Authorization header,
    // not with cookies, so there are no credentials for the browser to
    // attach. Turning it on would only widen what the page may do.
  }

  // The preflight. For a request carrying non-simple headers the browser
  // sends OPTIONS first, with Access-Control-Request-Method and
  // -Request-Headers, and sends the real request only if this reply
  // permits it.
  if (req.method === "OPTIONS") {
    if (!isAllowed(origin)) {
      // No allow-headers were set above, so the browser refuses the real
      // request. 204 rather than 403: the preflight itself is not an
      // authorisation decision, and there is no token on it to judge.
      logger.warn({ requestId: req.id, origin }, "preflight from unlisted origin");
      return res.status(204).end();
    }

    res.set("Access-Control-Allow-Methods", ALLOWED_METHODS);
    res.set("Access-Control-Allow-Headers", ALLOWED_HEADERS);
    res.set("Access-Control-Max-Age", MAX_AGE);

    // Answered here, above app.use(authenticate). A preflight never carries
    // the Authorization header it is asking permission to send, so letting
    // it reach the auth layer would 401 every cross-origin write.
    return res.status(204).end();
  }

  return next();
}

module.exports = cors;
module.exports.ALLOWED_ORIGINS = ALLOWED_ORIGINS;
