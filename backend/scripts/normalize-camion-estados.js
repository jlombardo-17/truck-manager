const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const ESTADO_CANONICO = {
  activo: 'activo',
  operativo: 'activo',
  inactivo: 'inactivo',
  inactive: 'inactivo',
  mantenimiento: 'mantenimiento',
  en_mantenimiento: 'mantenimiento',
  fuera_de_servicio: 'fuera_de_servicio',
  out_of_service: 'fuera_de_servicio',
};

function readEnvFile(envPath) {
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    env[key] = value;
  }

  return env;
}

function normalizeKey(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_');
}

async function getEstadoCounts(connection) {
  const [rows] = await connection.query(
    `SELECT estado, COUNT(*) AS cantidad FROM camiones GROUP BY estado ORDER BY cantidad DESC, estado ASC`,
  );
  return rows;
}

function canonicalSqlExpression(columnName) {
  return `CASE LOWER(TRIM(REPLACE(${columnName}, ' ', '_')))
    WHEN 'activo' THEN 'activo'
    WHEN 'operativo' THEN 'activo'
    WHEN 'inactivo' THEN 'inactivo'
    WHEN 'inactive' THEN 'inactivo'
    WHEN 'mantenimiento' THEN 'mantenimiento'
    WHEN 'en_mantenimiento' THEN 'mantenimiento'
    WHEN 'fuera_de_servicio' THEN 'fuera_de_servicio'
    WHEN 'out_of_service' THEN 'fuera_de_servicio'
    ELSE ${columnName}
  END`;
}

async function main() {
  const envPath = path.join(__dirname, '..', '.env');
  const env = readEnvFile(envPath);

  const connection = await mysql.createConnection({
    host: env.DB_HOST || 'localhost',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USERNAME || 'root',
    password: env.DB_PASSWORD || '',
    database: env.DB_DATABASE || 'truck_manager',
  });

  try {
    const before = await getEstadoCounts(connection);
    const knownAliases = Object.keys(ESTADO_CANONICO);
    const canonicalValues = [...new Set(Object.values(ESTADO_CANONICO))];

    const unknownBefore = before.filter(
      (row) => !knownAliases.includes(normalizeKey(row.estado)),
    );

    const canonicalEstadoExpr = canonicalSqlExpression('estado');

    const [updateResult] = await connection.query(
      `
        UPDATE camiones
        SET estado = ${canonicalEstadoExpr}
        WHERE LOWER(TRIM(REPLACE(estado, ' ', '_'))) IN (?, ?, ?, ?, ?, ?, ?, ?)
          AND COALESCE(estado, '') <> ${canonicalEstadoExpr}
      `,
      knownAliases,
    );

    const after = await getEstadoCounts(connection);
    const unknownAfter = after.filter(
      (row) => !canonicalValues.includes(normalizeKey(row.estado)),
    );

    console.log(
      JSON.stringify(
        {
          matchedRows: updateResult.affectedRows,
          changedRows: updateResult.changedRows ?? updateResult.affectedRows,
          before,
          after,
          unknownBefore,
          unknownAfter,
        },
        null,
        2,
      ),
    );
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});