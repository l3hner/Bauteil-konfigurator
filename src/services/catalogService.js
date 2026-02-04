const fs = require('fs');
const path = require('path');

class CatalogService {
  constructor() {
    this.catalogPath = path.join(__dirname, '../../data/catalog.json');
    this.catalog = this.loadCatalog();
  }

  loadCatalog() {
    try {
      const data = fs.readFileSync(this.catalogPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Fehler beim Laden des Katalogs:', error);
      return {
        walls: [],
        innerwalls: [],
        decken: [],
        windows: [],
        tiles: [],
        haustypen: [],
        heizung: [],
        lueftung: []
      };
    }
  }

  getWalls() {
    return this.catalog.walls || [];
  }

  getWallsByKfw(kfwStandard) {
    return this.catalog.walls.filter(wall =>
      wall.kfwCompatible && wall.kfwCompatible.includes(kfwStandard)
    );
  }

  getInnerwalls() {
    return this.catalog.innerwalls || [];
  }

  getDecken() {
    return this.catalog.decken || [];
  }

  getWindows() {
    return this.catalog.windows || [];
  }

  getTiles() {
    return this.catalog.tiles || [];
  }

  getHaustypen() {
    return this.catalog.haustypen || [];
  }

  getHeizung() {
    return this.catalog.heizung || [];
  }

  getLueftung(kfwStandard) {
    const allLueftung = this.catalog.lueftung || [];

    if (kfwStandard === 'KFW55') {
      // Bei KfW 55 nur "keine" Lüftung
      return allLueftung.filter(l => l.id === 'keine');
    } else if (kfwStandard === 'KFW40') {
      // Bei KfW 40 dezentral oder zentral
      return allLueftung.filter(l => l.id !== 'keine');
    }

    return allLueftung;
  }

  getVariantById(category, id) {
    const variants = this.catalog[category] || [];
    return variants.find(v => v.id === id);
  }

  getAllCategories() {
    return Object.keys(this.catalog);
  }

  validateSelection(selection) {
    const errors = [];

    // Validate wall selection
    if (selection.wall && !this.getVariantById('walls', selection.wall)) {
      errors.push('Ungültige Wandauswahl');
    }

    // Validate innerwall selection
    if (selection.innerwall && !this.getVariantById('innerwalls', selection.innerwall)) {
      errors.push('Ungültige Innenwandauswahl');
    }

    // Validate decke selection
    if (selection.decke && !this.getVariantById('decken', selection.decke)) {
      errors.push('Ungültige Deckenauswahl');
    }

    // Validate window selection
    if (selection.window && !this.getVariantById('windows', selection.window)) {
      errors.push('Ungültige Fensterauswahl');
    }

    // Validate tiles selection
    if (selection.tiles && !this.getVariantById('tiles', selection.tiles)) {
      errors.push('Ungültige Dachziegelauswahl');
    }

    // Validate haustyp
    if (selection.haustyp && !this.getVariantById('haustypen', selection.haustyp)) {
      errors.push('Ungültiger Haustyp');
    }

    // Validate heizung
    if (selection.heizung && !this.getVariantById('heizung', selection.heizung)) {
      errors.push('Ungültige Heizungsauswahl');
    }

    // Validate lueftung
    if (selection.lueftung && !this.getVariantById('lueftung', selection.lueftung)) {
      errors.push('Ungültige Lüftungsauswahl');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = new CatalogService();
