// Quick test script for PDF generation
const pdfService = require('./src/services/pdfService');
const fs = require('fs');
const path = require('path');

async function testPDFGeneration() {
  console.log('🚀 Testing PDF Generation with new features...\n');

  // Load golden sample fixture
  const fixturePath = path.join(__dirname, 'test-fixtures', 'golden-sample.json');

  if (!fs.existsSync(fixturePath)) {
    console.log('❌ Fixture not found:', fixturePath);
    console.log('Creating test submission...');

    // Create simple test submission
    const testSubmission = {
      id: 'test-' + Date.now(),
      timestamp: new Date().toISOString(),
      bauherr_vorname: 'Max',
      bauherr_nachname: 'Mustermann',
      bauherr_email: 'max@mustermann.de',
      bauherr_telefon: '0123 456789',
      kfw_standard: 'KFW40',
      personenanzahl: 4,
      grundstueck: 'vorhanden',
      wall: 'climativ-plus',
      innerwall: 'fermacell-12-5-2x',
      window: 'kunststoff-3fach',
      tiles: 'ton-rot',
      haustyp: 'einfamilienhaus',
      heizung: 'vaillant-arotherm',
      lueftung: 'zentral-waermerueckgewinnung',
      rooms: {
        erdgeschoss: [
          { name: 'Wohnzimmer', details: '35 m²' },
          { name: 'Küche', details: '18 m²' },
          { name: 'WC', details: '4 m²' }
        ],
        obergeschoss: [
          { name: 'Schlafzimmer', details: '20 m²' },
          { name: 'Kinderzimmer 1', details: '15 m²' },
          { name: 'Kinderzimmer 2', details: '15 m²' },
          { name: 'Bad', details: '10 m²' }
        ]
      },
      eigenleistungen: 'Malerarbeiten innen, Bodenbelag verlegen'
    };

    try {
      console.log('📄 Generating PDF...');
      const outputPath = await pdfService.generatePDF(testSubmission);

      if (fs.existsSync(outputPath)) {
        const stats = fs.statSync(outputPath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

        console.log('✅ PDF generated successfully!');
        console.log(`📊 File: ${outputPath}`);
        console.log(`📦 Size: ${sizeKB} KB (${sizeMB} MB)`);

        if (stats.size > 5 * 1024 * 1024) {
          console.log('⚠️  Warning: PDF exceeds 5 MB target!');
        } else {
          console.log('✅ Size within 5 MB target');
        }
      } else {
        console.log('❌ PDF file not found after generation');
      }
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      process.exit(1);
    }
  } else {
    console.log('Using fixture:', fixturePath);
    const submission = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

    try {
      console.log('📄 Generating PDF...');
      const outputPath = await pdfService.generatePDF(submission);

      if (fs.existsSync(outputPath)) {
        const stats = fs.statSync(outputPath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

        console.log('✅ PDF generated successfully!');
        console.log(`📊 File: ${outputPath}`);
        console.log(`📦 Size: ${sizeKB} KB (${sizeMB} MB)`);

        if (stats.size > 5 * 1024 * 1024) {
          console.log('⚠️  Warning: PDF exceeds 5 MB target!');
        } else {
          console.log('✅ Size within 5 MB target');
        }
      } else {
        console.log('❌ PDF file not found after generation');
      }
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      process.exit(1);
    }
  }
}

testPDFGeneration();
