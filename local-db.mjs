import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, ".local-db");

console.log(`Starting embedded PostgreSQL on data directory: ${dataDir}`);
const db = await PGlite.create(dataDir);
const server = new PGLiteSocketServer({
  db,
  port: 5432,
  host: "127.0.0.1",
  maxConnections: 50,
});

await server.start();
console.log("Embedded PostgreSQL server is listening on 127.0.0.1:5432 (maxConnections: 50)");

const shutdown = async () => {
  console.log("Shutting down embedded Postgres server...");
  try {
    await server.stop();
  } catch (e) {
    // ignore
  }
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

