// Verify all fixes are in place
const fs = require('fs');
const path = require('path');

console.log('=== VERIFIKATION ALLER FIXES ===\n');

// 1. Check catalog.json paths
console.log('1. KATALOG-PFADE (BUG 4):');
const catalog = JSON.parse(fs.readFileSync('data/catalog.json', 'utf8'));
const fermacell = catalog.innerwalls.find(iw => iw.id === 'innenwand-fermacell-gipskarton');
const esb = catalog.innerwalls.find(iw => iw.id === 'innenwand-esb-gipskarton');

console.log('   Fermacell:', fermacell.filePath);
console.log('   ESB:', esb.filePath);
console.log('   ✓ Korrekt:', fermacell.filePath.includes('innenwalls') && esb.filePath.includes('innenwalls') ? 'JA' : 'NEIN');

// 2. Check if images exist
console.log('\n2. BILDER EXISTIEREN:');
console.log('   Fermacell:', fs.existsSync(fermacell.filePath) ? '✓ JA' : '✗ NEIN');
console.log('   ESB:', fs.existsSync(esb.filePath) ? '✓ JA' : '✗ NEIN');

// 3. Check pdfService for logo
console.log('\n3. LOGO-FIX (BUG 1):');
const pdfService = fs.readFileSync('src/services/pdfService.js', 'utf8');
const hasWhiteBackground = pdfService.includes('Weißer Hintergrund für Logo-Sichtbarkeit');
console.log('   Weißer Hintergrund:', hasWhiteBackground ? '✓ JA' : '✗ NEIN');

// 4. Check icons removed
console.log('\n4. ICONS ENTFERNT (BUG 2):');
const iconLine = pdfService.match(/{ nr: '1'.*}/);
const hasIcon = iconLine && iconLine[0].includes('icon:');
console.log('   Keine Icons:', !hasIcon ? '✓ JA' : '✗ NEIN');

// 5. Check recent PDF
console.log('\n5. AKTUELLES PDF:');
const pdfPath = 'output/Leistungsbeschreibung_f79184a8-8bad-4667-b0ed-d457319454d3.pdf';
if (fs.existsSync(pdfPath)) {
  const stats = fs.statSync(pdfPath);
  const age = (Date.now() - stats.mtimeMs) / 1000;
  console.log('   Pfad:', pdfPath);
  console.log('   Alter:', Math.round(age), 'Sekunden');
  console.log('   Größe:', (stats.size / 1024 / 1024).toFixed(2), 'MB');
  console.log('   ✓ Frisch generiert:', age < 60 ? 'JA' : 'NEIN');
}

console.log('\n=== ENDE VERIFIKATION ===');
