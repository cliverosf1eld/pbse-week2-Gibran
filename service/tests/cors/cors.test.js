// A.4 — the CORS middleware, exercised on its own.
//
// Deliberately independent of the harness: this needs no database and no
// issuer, because CORS is decided before either is consulted. A preflight
// arrives with no token at all, which is the whole reason it has to be
// answered above app.use(authenticate).

const test = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");

const ALLOWED = "http://localhost:5173";
const UNLISTED = "https://evil.example";

process.env.CORS_ALLOWED_ORIGINS = `${ALLOWED},https://app.example`;
process.env.LOG_LEVEL = process.env.LOG_LEVEL || "silent";

const express = require("express");
const cors = require("../../src/middleware/cors");

async function startStub() {
  const app = express();

  app.use((req, res, next) => {
    req.id = "cors-test";
    next();
  });

  app.use(cors);

  // Stands in for a real write. Reached only if the middleware called
  // next(), which is itself part of what these tests assert.
  app.post("/v1/bookings", (req, res) => res.status(201).json({ ok: true }));

  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");

  return {
    url: `http://127.0.0.1:${server.address().port}`,
    stop: () => new Promise((resolve) => server.close(resolve)),
  };
}

test("CORS", async (t) => {
  const stub = await startStub();
  t.after(() => stub.stop());

  const preflight = (origin) =>
    fetch(`${stub.url}/v1/bookings`, {
      method: "OPTIONS",
      headers: {
        Origin: origin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "authorization,content-type",
      },
    });

  await t.test("a listed origin is told which methods and headers it may send", async () => {
    const res = await preflight(ALLOWED);

    assert.equal(res.status, 204);
    assert.equal(res.headers.get("access-control-allow-origin"), ALLOWED);
    assert.match(res.headers.get("access-control-allow-methods"), /POST/);
    assert.match(res.headers.get("access-control-allow-headers"), /Authorization/i);
    assert.match(res.headers.get("access-control-allow-headers"), /Idempotency-Key/i);
  });

  await t.test("the conditional-request headers are permitted", async () => {
    // Without these, adding A.7 and A.8 fails at the preflight rather than
    // in the code being written, which is a confusing place to discover it.
    const allowed = (await preflight(ALLOWED)).headers.get("access-control-allow-headers");

    assert.match(allowed, /If-Match/i);
    assert.match(allowed, /If-None-Match/i);
  });

  await t.test("ETag is exposed, or the page cannot read it", async () => {
    // The browser hides every response header but a short default list.
    // An ETag the page cannot read is an ETag it cannot send back.
    const res = await fetch(`${stub.url}/v1/bookings`, {
      method: "POST",
      headers: { Origin: ALLOWED },
    });

    assert.match(res.headers.get("access-control-expose-headers"), /ETag/i);
  });

  await t.test("an unlisted origin is given no allow-origin header", async () => {
    const res = await preflight(UNLISTED);

    assert.equal(res.headers.get("access-control-allow-origin"), null);
  });

  await t.test("the Origin header is never reflected back", async () => {
    // The failure this guards against: res.set('Access-Control-Allow-Origin',
    // req.get('Origin')). It passes every "does cross-origin work?" test
    // while in fact allowing every origin there is.
    const res = await preflight("https://attacker.test");

    assert.notEqual(res.headers.get("access-control-allow-origin"), "https://attacker.test");
  });

  await t.test("Vary: Origin is set even when the origin is refused", async () => {
    // Without it a shared cache can hand one origin's allow-header to a
    // page served from a different one.
    for (const origin of [ALLOWED, UNLISTED]) {
      const res = await preflight(origin);

      assert.match(res.headers.get("vary"), /Origin/i);
    }
  });

  await t.test("an unlisted origin's real request is still processed", async () => {
    // The point of A.4 item 3 and self-check question 1. CORS withholds the
    // reply from the page; it does not stop the service acting on the
    // request. "CORS blocked it, so nothing happened" is false — and this
    // 201 is the proof.
    const res = await fetch(`${stub.url}/v1/bookings`, {
      method: "POST",
      headers: { Origin: UNLISTED },
    });

    assert.equal(res.status, 201);
    assert.equal(res.headers.get("access-control-allow-origin"), null);
  });
});
