test("GET to /api/v1/status deve retornar 200", async () => {
  const response = await fetch("http://localhost:3000/api/v1/status");
  expect(response.status).toBe(200);

  const responseBody = await response.json();
  expect(responseBody.updated_at).toBeDefined();

  const parsedUpdateAt = new Date(responseBody.updated_at).toISOString();
  expect(responseBody.updated_at).toEqual(parsedUpdateAt);

  expect(typeof responseBody.dependencies.database.version).toBe("string");
  expect(responseBody.dependencies.database.version).toEqual("16.13");

  expect(typeof responseBody.dependencies.database.max_connections).toBe(
    "number",
  );
  expect(responseBody.dependencies.database.max_connections).toBeGreaterThan(0);

  expect(typeof responseBody.dependencies.database.opened_connections).toBe(
    "number",
  );
  expect(responseBody.dependencies.database.opened_connections).toEqual(1);
});
