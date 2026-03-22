async function run() {
  const base = "http://localhost:3000";

  try {
    // Login
    console.log("=== 1. LOGIN ===");
    const loginRes = await fetch(base + "/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "admin@truckmanager.local", password: "admin123" })
    });
    const login = await loginRes.json();
    const token = login.accessToken;
    console.log("✓ Login exitoso\n");

    // GET /viajes
    console.log("=== 2. GET /viajes ===");
    const viajesRes = await fetch(base + "/viajes", {
      headers: { Authorization: "Bearer " + token }
    });
    const viajes = await viajesRes.json();
    console.log("Status:", viajesRes.status);
    console.log("Total de viajes:", Array.isArray(viajes) ? viajes.length : (viajes.data ? viajes.data.length : "N/A"));
    console.log();

    // Extract camionId y choferId
    console.log("=== 3. EXTRAYENDO camionId Y choferId ===");
    const viajesArray = Array.isArray(viajes) ? viajes : (viajes.data || []);
    
    viajesArray.forEach((viaje, idx) => {
      console.log(`Viaje ${idx + 1}: ID=${viaje.id}, camionId=${viaje.camionId}, choferId=${viaje.choferId}`);
    });
    console.log();

    // Count null values
    console.log("=== 4. RESUMEN DE VALORES NULL ===");
    const nullCamionId = viajesArray.filter(v => v.camionId === null || v.camionId === undefined).length;
    const nullChoferId = viajesArray.filter(v => v.choferId === null || v.choferId === undefined).length;
    const nullAmbos = viajesArray.filter(v => (v.camionId === null || v.camionId === undefined) && (v.choferId === null || v.choferId === undefined)).length;
    
    console.log(`Viajes con camionId NULL: ${nullCamionId}`);
    console.log(`Viajes con choferId NULL: ${nullChoferId}`);
    console.log(`Viajes con AMBOS NULL: ${nullAmbos}`);
    
  } catch (e) {
    console.error("Error:", e.message);
  }
}
run().catch(err => console.error(err));
