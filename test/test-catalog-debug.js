// Debug script for catalog service
const catalogService = require('./src/services/catalogService');

console.log('=== Catalog Service Debug ===\n');

console.log('1. Direct catalog access:');
console.log('   innerwalls count:', catalogService.catalog.innerwalls.length);
console.log('   innerwalls[0]:', catalogService.catalog.innerwalls[0].id);

console.log('\n2. getInnerwalls() method:');
const innerwalls = catalogService.getInnerwalls();
console.log('   Result type:', typeof innerwalls);
console.log('   Result is Array:', Array.isArray(innerwalls));
console.log('   Result length:', innerwalls.length);
console.log('   Result:', innerwalls);

console.log('\n3. Manual method call:');
const manual = catalogService.catalog.innerwalls || [];
console.log('   Manual length:', manual.length);

console.log('\n4. Test other methods:');
console.log('   getWalls():', catalogService.getWalls().length);
console.log('   getWindows():', catalogService.getWindows().length);
console.log('   getHeizung():', catalogService.getHeizung().length);

console.log('\n5. Reload catalog:');
delete require.cache[require.resolve('./src/services/catalogService')];
const cs2 = require('./src/services/catalogService');
console.log('   After reload - getInnerwalls():', cs2.getInnerwalls().length);
