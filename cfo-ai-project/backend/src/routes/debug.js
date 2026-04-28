const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

router.get('/debug-caja', (req, res) => {
  try {
    const filePath = path.join(__dirname, '../../agents/CajaAgent.js');
    const content = fs.readFileSync(filePath, 'utf8');
    res.type('text/plain').send(content);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
