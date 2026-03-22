async function run() {
  const base = "http://localhost:3000";

  try {
    // 1. LOGIN
    console.log("=== 1. LOGIN ===");
    const loginRes = await fetch(base + "/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "admin@truckmanager.local", password: "admin123" })
    });
    const login = await loginRes.json();
    const token = login.accessToken;
    console.log("✓ Login exitoso\n");

    // 2. GET /viajes
    console.log("=== 2. GET /viajes ===");
    const viajesRes = await fetch(base + "/viajes", {
      headers: { Authorization: "Bearer " + token }
    });
    const viajes = await viajesRes.json();
    const data = Array.isArray(viajes) ? viajes : (viajes.data || []);
    console.log("Status HTTP:", viajesRes.status);
    console.log("Total de viajes:", data.length);
    console.log();

    // 3. FILTER IDs (como hace el frontend)
    console.log("=== 3. FILTERING (frontend logic) ===");
    const uniqueCamionIds = new Set(data.filter(v => v.camionId != null).map(v => v.camionId));
    const uniqueChoferIds = new Set(data.filter(v => v.choferId != null).map(v => v.choferId));
    console.log("Filtering: data.filter(v => v.camionId != null)");
    console.log();

    // 4. RÉSUMEN DE VÁLIDOS
    console.log("=== 4. RESUMEN DESPUÉS DEL FILTRO ===");
    console.log(`Total de viajes en la respuesta: ${data.length}`);
    console.log(`Viajes con camionId válido: ${data.filter(v => v.camionId != null).length}`);
    console.log(`Viajes con choferId válido: ${data.filter(v => v.choferId != null).length}`);
    console.log(`Viajes con AMBOS válidos: ${data.filter(v => v.camionId != null && v.choferId != null).length}`);
    console.log();
    console.log(`Unique camionIds (para cargar camiones): ${uniqueCamionIds.size}`);
    console.log(`Unique choferIds (para cargar choferes): ${uniqueChoferIds.size}`);
    console.log();

    // 5. STATUS
    console.log("=== 5. STATUS ===");
    if (viajesRes.ok && data.length > 0) {
      console.log("Status: ✓ EXITOSO");
      console.log("El frontend cargará los viajes sin problemas");
    } else {
      console.log("Status: ✗ ERROR");
    }
    
  } catch (e) {
    console.error("Status: ✗ ERROR");
    console.error("Error:", e.message);
  }
}
run().catch(err => console.error(err));
