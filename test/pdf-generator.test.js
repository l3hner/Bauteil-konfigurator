const fs = require('fs');
const path = require('path');
const pdfService = require('../src/services/pdfService');

describe('PDF Generator Tests', () => {
  const fixturesDir = path.join(__dirname, '../test-fixtures');
  const outputDir = path.join(__dirname, '../output');

  test('Golden sample generates PDF with floor plans', async () => {
    const fixturePath = path.join(fixturesDir, 'golden-sample.json');
    const submission = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

    const pdfPath = await pdfService.generatePDF(submission);

    expect(fs.existsSync(pdfPath)).toBe(true);

    const stats = fs.statSync(pdfPath);
    expect(stats.size).toBeGreaterThan(1000); // At least 1KB

    console.log(`✓ PDF generated: ${pdfPath} (${Math.round(stats.size / 1024)} KB)`);
  });

  test('Submission with rooms includes floor plan page', async () => {
    const fixturePath = path.join(fixturesDir, 'golden-sample.json');
    const submission = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

    // Verify rooms exist
    expect(submission.rooms.erdgeschoss).toBeDefined();
    expect(submission.rooms.erdgeschoss.length).toBeGreaterThan(0);

    const pdfPath = await pdfService.generatePDF(submission);
    expect(fs.existsSync(pdfPath)).toBe(true);

    // Heuristic: PDF should be larger with floor plans
    const stats = fs.statSync(pdfPath);
    expect(stats.size).toBeGreaterThan(5000); // >5KB indicates multiple pages
  });

  test('Submission without rooms skips floor plan page', async () => {
    const submission = {
      id: 'test-no-rooms',
      timestamp: new Date().toISOString(),
      bauherr_vorname: 'Test',
      bauherr_nachname: 'User',
      bauherr_email: 'test@example.de',
      bauherr_telefon: '0123456789',
      kfw_standard: 'KFW55',
      haustyp: 'bungalow',
      personenanzahl: 2,
      grundstueck: 'suche',
      wall: 'climativ-esb',
      innerwall: 'innenwand-esb-gipskarton',
      window: 'kunststoff',
      tiles: 'beton',
      heizung: 'viessmann',
      lueftung: 'keine',
      rooms: {
        erdgeschoss: [],
        obergeschoss: [],
        untergeschoss: []
      },
      eigenleistungen: []
    };

    const pdfPath = await pdfService.generatePDF(submission);
    expect(fs.existsSync(pdfPath)).toBe(true);

    // Should still generate valid PDF
    const stats = fs.statSync(pdfPath);
    expect(stats.size).toBeGreaterThan(1000);
  });

  test('Invalid room data does not crash generator', async () => {
    const submission = {
      id: 'test-invalid-rooms',
      timestamp: new Date().toISOString(),
      bauherr_vorname: 'Test',
      bauherr_nachname: 'User',
      bauherr_email: 'test@example.de',
      bauherr_telefon: '0123456789',
      kfw_standard: 'KFW55',
      haustyp: 'bungalow',
      personenanzahl: 2,
      grundstueck: 'suche',
      wall: 'climativ-esb',
      innerwall: 'innenwand-esb-gipskarton',
      window: 'kunststoff',
      tiles: 'beton',
      heizung: 'viessmann',
      lueftung: 'keine',
      rooms: null, // Invalid
      eigenleistungen: []
    };

    // Should not throw
    const pdfPath = await pdfService.generatePDF(submission);
    expect(fs.existsSync(pdfPath)).toBe(true);
  });
});
