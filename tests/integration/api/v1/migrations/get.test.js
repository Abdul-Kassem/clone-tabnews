import database from "infra/database.js";

beforeAll(cleanDatabase);

async function cleanDatabase() {
  await database.query("drop schema public cascade; create schema public;");
}

test("GET to /api/v1/migrations deve retornar 200", async () => {
  const response = await fetch("http://localhost:3000/api/v1/migrations");
  expect(response.status).toBe(200);

  const responseBody = await response.json();

  expect(Array.isArray(responseBody)).toBe(true);
  expect(responseBody.length).toBeGreaterThan(0);
});

/*test("verificar ambiente NODE_ENV", () => {
  expect(process.env.NODE_ENV).toBe("test");
});

test("Verificar que as credenciais do Banco de Dados nâo estão sendo injetadas no process.env", () => {
  console.log({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
  });
  expect(process.env.POSTGRES_HOST).toBeUndefined();
  expect(process.env.POSTGRES_PORT).toBeUndefined();
  expect(process.env.POSTGRES_USER).toBeUndefined();
  expect(process.env.POSTGRES_DB).toBeUndefined();
  expect(process.env.POSTGRES_PASSWORD).toBeUndefined();
});*/
