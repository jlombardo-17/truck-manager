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

    // Test 1: GET /camiones (sin parámetros)
    console.log("\n=== TEST 1: GET /camiones (sin parámetros) ===");
    try {
      const res = await fetch(base + "/camiones", {
        headers: { Authorization: "Bearer " + token }
      });
      const text = await res.text();
      console.log("Status:", res.status);
      console.log("Body:", text.substring(0, 200));
    } catch (e) {
      console.log("ERROR:", e.message);
    }

    // Test 2: GET /camiones/1
    console.log("\n=== TEST 2: GET /camiones/1 ===");
    try {
      const res = await fetch(base + "/camiones/1", {
        headers: { Authorization: "Bearer " + token }
      });
      const text = await res.text();
      console.log("Status:", res.status);
      console.log("Body:", text);
    } catch (e) {
      console.log("ERROR:", e.message);
    }

    // Test 3: GET /camiones/abc
    console.log("\n=== TEST 3: GET /camiones/abc ===");
    try {
      const res = await fetch(base + "/camiones/abc", {
        headers: { Authorization: "Bearer " + token }
      });
      const text = await res.text();
      console.log("Status:", res.status);
      console.log("Body:", text);
    } catch (e) {
      console.log("ERROR:", e.message);
    }

    // Test 4: GET /choferes
    console.log("\n=== TEST 4: GET /choferes ===");
    try {
      const res = await fetch(base + "/choferes", {
        headers: { Authorization: "Bearer " + token }
      });
      const text = await res.text();
      console.log("Status:", res.status);
      console.log("Body:", text.substring(0, 200));
    } catch (e) {
      console.log("ERROR:", e.message);
    }

    // Test 5: GET /choferes/1
    console.log("\n=== TEST 5: GET /choferes/1 ===");
    try {
      const res = await fetch(base + "/choferes/1", {
        headers: { Authorization: "Bearer " + token }
      });
      const text = await res.text();
      console.log("Status:", res.status);
      console.log("Body:", text);
    } catch (e) {
      console.log("ERROR:", e.message);
    }

    // Test 6: GET /choferes/abc
    console.log("\n=== TEST 6: GET /choferes/abc ===");
    try {
      const res = await fetch(base + "/choferes/abc", {
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
