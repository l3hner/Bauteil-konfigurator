const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

// Farben fuer verschiedene Kategorien (RGBA als einzelne Werte)
const COLORS = {
  walls: { r: 0, g: 51, b: 102 },
  innenwalls: { r: 0, g: 102, b: 153 },
  windows: { r: 0, g: 153, b: 204 },
  tiles: { r: 204, g: 102, b: 0 },
  haustypen: { r: 51, g: 153, b: 102 },
  heizung: { r: 204, g: 51, b: 51 },
  lueftung: { r: 153, g: 102, b: 204 }
};

async function createPlaceholderImage(filePath, label, isTechnical = false) {
  const width = 800;
  const height = 600;

  // Kategorie aus Pfad extrahieren
  const category = filePath.split('/')[2] || 'default';
  const colors = COLORS[category] || { r: 102, g: 102, b: 102 };

  // Hintergrundfarbe
  const bgColor = isTechnical
    ? 0xF5F5F5FF
    : ((colors.r << 24) | (colors.g << 16) | (colors.b << 8) | 0xFF) >>> 0;

  // Neues Bild erstellen
  const image = new Jimp({ width, height, color: bgColor });

  // Speichern
  const fullPath = path.join(__dirname, '..', filePath);
  const dir = path.dirname(fullPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  await image.write(fullPath);
  console.log(`[OK] ${filePath}`);
}

async function main() {
  const catalogPath = path.join(__dirname, '..', 'data', 'catalog.json');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

  console.log('Generiere Platzhalter-Bilder...\n');

  let created = 0;
  let skipped = 0;

  for (const category of Object.keys(catalog)) {
    for (const item of catalog[category]) {
      // Hauptbild
      if (item.filePath) {
        const fullPath = path.join(__dirname, '..', item.filePath);
        if (!fs.existsSync(fullPath)) {
          await createPlaceholderImage(item.filePath, item.name, false);
          created++;
        } else {
          skipped++;
        }
      }

      // Technische Zeichnung
      if (item.technicalDrawing) {
        const fullPath = path.join(__dirname, '..', item.technicalDrawing);
        if (!fs.existsSync(fullPath)) {
          await createPlaceholderImage(item.technicalDrawing, item.name + ' (Schnitt)', true);
          created++;
        } else {
          skipped++;
        }
      }
    }
  }

  console.log(`\n========================================`);
  console.log(`Erstellt: ${created} Bilder`);
  console.log(`Uebersprungen: ${skipped} (bereits vorhanden)`);
  console.log(`========================================`);
}

main().catch(err => {
  console.error('Fehler:', err);
  process.exit(1);
});
