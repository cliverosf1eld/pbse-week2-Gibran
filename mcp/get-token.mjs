
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.join(__dirname, ".env");

async function main() {
  const env = parseEnv(fs.readFileSync(ENV_PATH, "utf8"));

  const username = env.KEYCLOAK_USERNAME;
  const password = env.KEYCLOAK_PASSWORD;

  if (!username || !password) {
    throw new Error(
      "Set KEYCLOAK_USERNAME and KEYCLOAK_PASSWORD in mcp/.env"
    );
  }

  const response = await fetch(
    "http://localhost:8080/realms/badminton-booking/protocol/openid-connect/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        client_id: "test-cli",
        grant_type: "password",
        username,
        password,
        scope: "openid bookings:read"
      })
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      `Keycloak token request failed: ${result.error_description || result.error}`
    );
  }

  const updatedEnv = {
    ...env,
    BOOKING_ACCESS_TOKEN: result.access_token
  };

  const content = Object.entries(updatedEnv)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  fs.writeFileSync(ENV_PATH, `${content}\n`);

  console.log("Access token refreshed successfully.");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
