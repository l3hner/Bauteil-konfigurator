// Test if innerwall can be loaded from catalog
const catalogService = require('./src/services/catalogService');

console.log('Testing innerwall loading...\n');

const innerwallId = 'innenwand-esb-gipskarton';
const innerwall = catalogService.getVariantById('innerwalls', innerwallId);

console.log('ID:', innerwallId);
console.log('Found:', !!innerwall);

if (innerwall) {
  console.log('Name:', innerwall.name);
  console.log('Description:', innerwall.description);
} else {
  console.log('ERROR: Innerwall not found!');
  console.log('\nAvailable innerwalls:');
  const all = catalogService.getInnerwalls();
  all.forEach(iw => console.log('  -', iw.id, ':', iw.name));
}
