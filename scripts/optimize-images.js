/**
 * Image Optimization Script
 *
 * Reduziert die Dateigröße von Produktbildern in assets/variants/
 * um die PDF-Größe unter 5 MB zu bringen.
 *
 * Verwendung:
 *   npm install sharp  (einmalig)
 *   node scripts/optimize-images.js
 */

const fs = require('fs');
const path = require('path');

console.log('📸 Image Optimization Tool\n');
console.log('Dieses Script würde alle Bilder in assets/variants/ optimieren.');
console.log('Um es zu nutzen, installieren Sie zuerst "sharp":\n');
console.log('  npm install sharp\n');
console.log('Dann kommentieren Sie die Optimierungs-Logik unten ein.\n');

// Beispiel-Implementierung (auskommentiert, weil sharp nicht installiert ist)
/*
const sharp = require('sharp');

async function optimizeImages() {
  const variantsDir = path.join(__dirname, '../assets/variants');
  const categories = fs.readdirSync(variantsDir);

  let totalSizeBefore = 0;
  let totalSizeAfter = 0;
  let filesProcessed = 0;

  for (const category of categories) {
    const categoryPath = path.join(variantsDir, category);
    if (!fs.statSync(categoryPath).isDirectory()) continue;

    const files = fs.readdirSync(categoryPath);

    for (const file of files) {
      if (!file.match(/\.(png|jpg|jpeg)$/i)) continue;

      const filePath = path.join(categoryPath, file);
      const stats = fs.statSync(filePath);
      totalSizeBefore += stats.size;

      console.log(`Optimizing: ${category}/${file} (${(stats.size / 1024).toFixed(2)} KB)`);

      // Backup original
      const backupPath = filePath + '.backup';
      if (!fs.existsSync(backupPath)) {
        fs.copyFileSync(filePath, backupPath);
      }

      // Optimize
      await sharp(filePath)
        .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 70 })
        .toFile(filePath + '.tmp');

      fs.renameSync(filePath + '.tmp', filePath);

      const newStats = fs.statSync(filePath);
      totalSizeAfter += newStats.size;
      filesProcessed++;

      console.log(`  → ${(newStats.size / 1024).toFixed(2)} KB (saved ${((stats.size - newStats.size) / 1024).toFixed(2)} KB)`);
    }
  }

  console.log('\n✅ Optimization complete!');
  console.log(`Files processed: ${filesProcessed}`);
  console.log(`Size before: ${(totalSizeBefore / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Size after: ${(totalSizeAfter / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Saved: ${((totalSizeBefore - totalSizeAfter) / 1024 / 1024).toFixed(2)} MB`);
}

optimizeImages().catch(console.error);
*/

console.log('Alternative: Online-Tools wie TinyPNG (https://tinypng.com/)');
console.log('oder ImageMagick verwenden:\n');
console.log('  # ImageMagick (Batch-Konvertierung)');
console.log('  for file in assets/variants/**/*.png; do');
console.log('    convert "$file" -quality 70 -resize 800x600> "$file"');
console.log('  done\n');
