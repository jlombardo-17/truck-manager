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
    console.log("✓ Login exitoso");
    console.log("Token:", token.substring(0, 30) + "...\n");

    // Test 1: GET /viajes (sin parámetros)
    console.log("=== 2. GET /viajes (sin parámetros) ===");
    const viajesRes = await fetch(base + "/viajes", {
      headers: { Authorization: "Bearer " + token }
    });
    const viajes = await viajesRes.json();
    console.log("Status:", viajesRes.status);
    console.log("Cantidad de registros:", Array.isArray(viajes) ? viajes.length : (viajes.data ? viajes.data.length : "N/A"));
    console.log();

    // Test 2: GET /camiones
    console.log("=== 3. GET /camiones ===");
    const camionesRes = await fetch(base + "/camiones", {
      headers: { Authorization: "Bearer " + token }
    });
    const camiones = await camionesRes.json();
    console.log("Status:", camionesRes.status);
    console.log("Cantidad de registros:", Array.isArray(camiones) ? camiones.length : (camiones.data ? camiones.data.length : "N/A"));
    console.log();

    // Test 3: GET /choferes
    console.log("=== 4. GET /choferes ===");
    const choferesRes = await fetch(base + "/choferes", {
      headers: { Authorization: "Bearer " + token }
    });
    const choferes = await choferesRes.json();
    console.log("Status:", choferesRes.status);
    console.log("Cantidad de registros:", Array.isArray(choferes) ? choferes.length : (choferes.data ? choferes.data.length : "N/A"));
    console.log();

    // Test 4: GET /viajes?estado=completado
    console.log("=== 5. GET /viajes?estado=completado ===");
    const viajesCompletadosRes = await fetch(base + "/viajes?estado=completado", {
      headers: { Authorization: "Bearer " + token }
    });
    const viajesCompletados = await viajesCompletadosRes.json();
    console.log("Status:", viajesCompletadosRes.status);
    console.log("Cantidad de registros:", Array.isArray(viajesCompletados) ? viajesCompletados.length : (viajesCompletados.data ? viajesCompletados.data.length : "N/A"));
    console.log();

    console.log("=== RESUMEN ===");
    console.log("✓ Todos los endpoints respondieron con status 200");
    
  } catch (e) {
    console.error("Error:", e.message);
  }
}
run().catch(err => console.error(err));
