// Test catalog getVariantById for innerwalls
const catalogService = require('./src/services/catalogService');

console.log('Testing catalogService.getVariantById for innerwalls\n');

const innerwallId = 'innenwand-esb-gipskarton';

console.log('1. Direct test:');
console.log('   ID:', innerwallId);
const result1 = catalogService.getVariantById('innerwalls', innerwallId);
console.log('   Result:', !!result1);
if (result1) {
  console.log('   Name:', result1.name);
}

console.log('\n2. Check catalog structure:');
console.log('   catalog.innerwalls exists:', !!catalogService.catalog.innerwalls);
console.log('   catalog.innerwalls type:', Array.isArray(catalogService.catalog.innerwalls) ? 'Array' : typeof catalogService.catalog.innerwalls);
console.log('   catalog.innerwalls length:', catalogService.catalog.innerwalls?.length);

console.log('\n3. List all innerwalls:');
const allInnerwalls = catalogService.getInnerwalls();
allInnerwalls.forEach(iw => {
  console.log(`   - ${iw.id}: ${iw.name}`);
});

console.log('\n4. Test with submission value:');
const submission = { innerwall: 'innenwand-esb-gipskarton' };
const result2 = catalogService.getVariantById('innerwalls', submission.innerwall);
console.log('   submission.innerwall:', submission.innerwall);
console.log('   Result:', !!result2);
if (result2) {
  console.log('   Name:', result2.name);
} else {
  console.log('   ERROR: Not found!');
}
