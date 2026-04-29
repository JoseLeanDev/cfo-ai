const express = require('express');
const router = express.Router();
const db = require('../../database/connection');

router.get('/schema/:table', async (req, res) => {
  try {
    const table = req.params.table;
    const cols = await db.allAsync(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [table]);
    res.json({ table, columns: cols });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
