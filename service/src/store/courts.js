const pool = require("./db");

async function findCourtById(courtId) {
  const result = await pool.query(
    `
    SELECT
      id,
      name,
      location,
      court_type,
      is_available,
      status
    FROM courts
    WHERE id = $1
    `,
    [courtId]
  );

  return result.rows[0] || null;
}

async function findAllCourts(status, limit, cursor) {
  const result = await pool.query(
    `
    SELECT
      id,
      name,
      location,
      court_type,
      is_available,
      status
    FROM courts
    WHERE ($1::varchar IS NULL OR status = $1)
      AND ($2::varchar IS NULL OR id > $2)
    ORDER BY id
    LIMIT $3 + 1
    `,
    [status || null, cursor || null, limit]
  );

  return result.rows;
}

module.exports = {
  findCourtById,
  findAllCourts
};
