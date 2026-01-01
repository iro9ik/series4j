// scripts/check-neo4j.js
// This script verifies the Neo4j driver can reach your database.
// It optionally loads .env files (if you have dotenv installed).

try { require('dotenv').config(); } catch (e) { /* dotenv optional */ }

const neo4j = require('neo4j-driver');

const uri = process.env.NEO4J_URI;
const user = process.env.NEO4J_USER;
const password = process.env.NEO4J_PASSWORD;

if (!uri || !user || !password) {
  console.error("NEO4J_URI or credentials missing in environment variables.");
  console.error("Set NEO4J_URI, NEO4J_USER and NEO4J_PASSWORD (or add them to .env).");
  process.exit(1);
}

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

async function main() {
  try {
    console.log("Verifying connectivity to Neo4j...");
    await driver.verifyConnectivity();
    console.log("✅ Neo4j connectivity OK");
  } catch (err) {
    console.error("❌ Neo4j connectivity error:");
    console.error(err && err.message ? err.message : err);
  } finally {
    await driver.close();
  }
}

main();
