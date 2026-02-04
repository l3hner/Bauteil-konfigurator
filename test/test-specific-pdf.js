// Test PDF generation for specific submission
const pdfService = require('./src/services/pdfService');
const fs = require('fs');
const path = require('path');

async function testPDF() {
  console.log('Loading submission...');

  const submissionPath = path.join(__dirname, 'data/submissions/f79184a8-8bad-4667-b0ed-d457319454d3.json');
  const submission = JSON.parse(fs.readFileSync(submissionPath, 'utf8'));

  console.log('Submission has innerwall:', submission.innerwall);

  console.log('\nGenerating PDF...');
  const pdfPath = await pdfService.generatePDF(submission);

  console.log('✅ PDF generated:', pdfPath);

  if (fs.existsSync(pdfPath)) {
    const stats = fs.statSync(pdfPath);
    console.log('📦 Size:', (stats.size / 1024 / 1024).toFixed(2), 'MB');
  }
}

testPDF().catch(console.error);
