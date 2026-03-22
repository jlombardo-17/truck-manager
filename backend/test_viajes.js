async function run() {
  const base = "http://localhost:3000";

  try {
    // Login
    console.log("=== LOGIN ===");
    const loginRes = await fetch(base + "/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "admin@truckmanager.local", password: "admin123" })
    });
    const login = await loginRes.json();
    const token = login.accessToken;
    console.log("Token obtained:", token.substring(0, 30) + "...");

    // Test 1: /viajes?camionId=1&choferId=1
    console.log("\n=== TEST 1: GET /viajes?camionId=1&choferId=1 ===");
    try {
      const res = await fetch(base + "/viajes?camionId=1&choferId=1", {
        headers: { Authorization: "Bearer " + token }
      });
      const text = await res.text();
      console.log("Status:", res.status);
      console.log("Body:", text);
    } catch (e) {
      console.log("ERROR:", e.message);
    }

    // Test 2: /viajes?camionId=abc&choferId=xyz
    console.log("\n=== TEST 2: GET /viajes?camionId=abc&choferId=xyz ===");
    try {
      const res = await fetch(base + "/viajes?camionId=abc&choferId=xyz", {
        headers: { Authorization: "Bearer " + token }
      });
      const text = await res.text();
      console.log("Status:", res.status);
      console.log("Body:", text);
    } catch (e) {
      console.log("ERROR:", e.message);
    }

    // Test 3: /viajes sin parámetros
    console.log("\n=== TEST 3: GET /viajes (sin parámetros) ===");
    try {
      const res = await fetch(base + "/viajes", {
        headers: { Authorization: "Bearer " + token }
      });
      const text = await res.text();
      console.log("Status:", res.status);
      console.log("Body:", text);
    } catch (e) {
      console.log("ERROR:", e.message);
    }
    
  } catch (e) {
    console.error("Error:", e.message);
  }
}
run().catch(err => console.error(err));
