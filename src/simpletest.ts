import postgres from "postgres";

async function simpleTest() {
  console.log("Starting simple test...");
  
  try {
    const sql = postgres('postgres://postgres:postgres@localhost:5432/gator', {
      ssl: false,
    });
    
    console.log("About to query...");
    const result = await sql`SELECT 1`;
    console.log("Got result:", result);
    
    await sql.end();
    console.log("Test completed successfully");
  } catch (err) {
    console.error("Error:", err);
  }
  
  console.log("Function ending...");
}

simpleTest();
console.log("Called simpleTest()");