const express = require('express');
const router = express.Router();
const catalogService = require('../services/catalogService');

router.get('/', (req, res) => {
  console.log('[Route /] Loading catalog...');

  const walls = catalogService.getWalls();
  const innerwalls = catalogService.getInnerwalls();
  const windows = catalogService.getWindows();
  const tiles = catalogService.getTiles();
  const haustypen = catalogService.getHaustypen();
  const heizung = catalogService.getHeizung();

  console.log('[Route /] Catalog loaded:');
  console.log('  - walls:', walls.length);
  console.log('  - innerwalls:', innerwalls.length);
  console.log('  - windows:', windows.length);
  console.log('  - tiles:', tiles.length);
  console.log('  - haustypen:', haustypen.length);
  console.log('  - heizung:', heizung.length);

  const catalog = {
    walls,
    innerwalls,
    windows,
    tiles,
    haustypen,
    heizung
  };

  console.log('[Route /] catalog object keys:', Object.keys(catalog));
  console.log('[Route /] catalog.innerwalls exists:', !!catalog.innerwalls);
  console.log('[Route /] catalog.innerwalls length:', catalog.innerwalls ? catalog.innerwalls.length : 'undefined');

  res.render('index', { catalog });
});

module.exports = router;
