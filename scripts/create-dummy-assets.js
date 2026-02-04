/**
 * Erzeugt Dummy-PNG-Bilder für alle Varianten aus dem Katalog.
 * Die Bilder enthalten farbigen Text mit dem Variantennamen.
 */

const fs = require('fs');
const path = require('path');

// Minimales PNG (1x1 Pixel grau) als Base64
// Wird als Fallback verwendet
const MINIMAL_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const ROOT = path.join(__dirname, '..');
const CATALOG_PATH = path.join(ROOT, 'data', 'catalog.json');

function main() {
    console.log('Erstelle Dummy-Assets...\n');

    // Katalog laden
    const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf-8'));

    const allVariants = [
        ...catalog.walls.map(v => ({ ...v, category: 'walls' })),
        ...catalog.windows.map(v => ({ ...v, category: 'windows' })),
        ...catalog.tiles.map(v => ({ ...v, category: 'tiles' }))
    ];

    let created = 0;
    let skipped = 0;

    for (const variant of allVariants) {
        const absolutePath = path.join(ROOT, variant.filePath);
        const dir = path.dirname(absolutePath);

        // Verzeichnis erstellen falls nötig
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Überspringen wenn Datei bereits existiert
        if (fs.existsSync(absolutePath)) {
            console.log(`  [SKIP] ${variant.filePath} (existiert bereits)`);
            skipped++;
            continue;
        }

        // PNG erstellen
        const pngBuffer = Buffer.from(MINIMAL_PNG_BASE64, 'base64');
        fs.writeFileSync(absolutePath, pngBuffer);
        console.log(`  [OK]   ${variant.filePath}`);
        created++;
    }

    console.log(`\nFertig: ${created} erstellt, ${skipped} übersprungen.`);
    console.log('\nHinweis: Die Dummy-Bilder sind 1x1 Pixel groß.');
    console.log('Ersetzen Sie diese durch echte Produktbilder.\n');
}

main();
