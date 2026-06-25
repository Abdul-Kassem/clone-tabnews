import orchestrator from "tests/orchestrator.js";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/status", () => {
  describe("Anonymous user", () => {
    test("Retrieving current system status", async () => {
      const response = await fetch(`${webserver.origin}/api/v1/status`);
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      const parsedUpdateAt = new Date(responseBody.updated_at).toISOString();
      expect(responseBody.updated_at).toEqual(parsedUpdateAt);

      expect(typeof responseBody.dependencies.database.max_connections).toBe(
        "number",
      );
      expect(
        responseBody.dependencies.database.max_connections,
      ).toBeGreaterThan(0);

      expect(typeof responseBody.dependencies.database.opened_connections).toBe(
        "number",
      );
      expect(responseBody.dependencies.database.opened_connections).toEqual(1);
      expect(responseBody.dependencies.database).not.toHaveProperty("version");
    });
  });

  describe("Default user", () => {
    test("Retrieving current system status", async () => {
      const createdUser = await orchestrator.createUser({});
      const activatedUser = await orchestrator.activateUser(createdUser.id);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const response = await fetch(`${webserver.origin}/api/v1/status`, {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      const parsedUpdatedAt = new Date(responseBody.updated_at).toISOString();
      expect(responseBody.updated_at).toEqual(parsedUpdatedAt);

      expect(responseBody.dependencies.database.max_connections).toEqual(100);
      expect(responseBody.dependencies.database.opened_connections).toEqual(1);
      expect(responseBody.dependencies.database).not.toHaveProperty("version");
    });
  });

  describe("Privileged user", () => {
    test("With `read:status:all`", async () => {
      const privilegedUser = await orchestrator.createUser({});
      const activateUser = await orchestrator.activateUser(privilegedUser.id);
      await orchestrator.addFeaturesToUser(activateUser, ["read:status:all"]);
      const sessionObject = await orchestrator.createSession(activateUser);

      const response = await fetch(`${webserver.origin}/api/v1/status`, {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      const parsedUpdateAt = new Date(responseBody.updated_at).toISOString();
      expect(responseBody.updated_at).toEqual(parsedUpdateAt);

      expect(typeof responseBody.dependencies.database.max_connections).toBe(
        "number",
      );
      expect(
        responseBody.dependencies.database.max_connections,
      ).toBeGreaterThan(0);

      expect(typeof responseBody.dependencies.database.opened_connections).toBe(
        "number",
      );
      expect(responseBody.dependencies.database.opened_connections).toEqual(1);
      expect(responseBody.dependencies.database.version).toEqual("16.13");
    });
  });
});
