async function run() {
  const base = "http://localhost:3000";
  
  console.log("=== Rutas disponibles ===");
  
  const routes = [
    "/api/viajes",
    "/api/viaje",
    "/api/trips",
    "/api/trip",
    "/api/v1/viajes",
    "/trips",
    "/viajes"
  ];
  
  for (const route of routes) {
    try {
      const loginRes = await fetch(base + "/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "admin@truckmanager.local", password: "admin123" })
      });
      const login = await loginRes.json();
      const token = login.accessToken;
      
      const res = await fetch(base + route, {
        headers: { Authorization: "Bearer " + token }
      });
      
      console.log(`[${res.status}] GET ${route}`);
      
    } catch (e) {
      console.log(`[ERROR] GET ${route} - ${e.message}`);
    }
  }
}
run().catch(err => console.error(err));
