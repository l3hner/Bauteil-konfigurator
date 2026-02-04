# PDF-Generator Dokumentation

## Übersicht

Der Lehner Haus Konfigurator generiert professionelle, vertriebsfähige PDF-Leistungsbeschreibungen mit PDFKit.

## Lokale PDF-Generierung

### Server-basiert (empfohlen)
```bash
npm start
# Browser: http://localhost:3000
# Formular ausfüllen → PDF wird generiert
```

### Direkt via Node.js
```javascript
const pdfService = require('./src/services/pdfService');
const submission = {
  id: 'test-123',
  timestamp: new Date().toISOString(),
  bauherr_vorname: 'Max',
  bauherr_nachname: 'Mustermann',
  // ... weitere Felder
};

pdfService.generatePDF(submission)
  .then(path => console.log('PDF:', path));
```

### Test-Fixture
```bash
node -e "
const pdfService = require('./src/services/pdfService');
const fs = require('fs');
const submission = JSON.parse(fs.readFileSync('./test-fixtures/golden-sample.json', 'utf8'));
pdfService.generatePDF(submission).then(console.log);
"
```

## Tests ausführen

```bash
# Manuelle Tests mit Fixtures
npm test  # Falls Jest konfiguriert

# Einzelne Fixture testen
node test/pdf-generator.test.js
```

## PDF-Struktur

1. **Titelseite** - Lehner Haus Branding, Bauherr, Datum
2. **QDF-Zertifizierung** - Qualitätssiegel, Zertifikate
3. **Executive Summary** - Konfiguration auf 1 Seite (Tabelle)
4. **7 Qualitätsvorteile** - Nummerierte Liste
5. **Unser Service** - Leistungsübersicht
6. **Komponenten-Seiten** - Außenwand, Innenwand, Fenster, Dach, Haustyp, Heizung, Lüftung (optional)
   - Produktbild oder farbiger Platzhalter
   - Technische Daten (gelb umrandet)
   - Premium Features (goldene Sterne)
   - Vorteile (Checkmarks)
   - Vergleichshinweise (gelber Rahmen)
7. **Raumplanung** - Grundrisse mit Innenwänden (nur wenn Räume definiert)
8. **Checkliste** - Anbietervergleich
9. **Nächste Schritte** - CTA, Kontaktdaten

## Architektur

### Dateien
```
src/services/
├── pdfService.js          # Haupt-Generator
├── catalogService.js      # Produkt-Datenbank
└── submissionService.js   # Submission-Verwaltung

data/
├── catalog.json           # Produkt-Katalog
└── submissions/           # Gespeicherte Konfigurationen

test-fixtures/
└── golden-sample.json     # Referenz-Fixture für Tests

output/
└── *.pdf                  # Generierte PDFs
```

### Design-System

**Farben** (`this.colors`):
- Primary: `#06402b` (Dunkelgrün)
- Gold: `#D4AF37` (Akzent)
- Text: `#1d1d1b` (Fast-Schwarz)

**Typografie** (`this.typography`):
- H1: Helvetica-Bold 20pt
- H2: Helvetica-Bold 14pt
- Body: Helvetica 10pt
- Small: Helvetica 8pt

**Layout** (`this.layout`):
- Margins: 60pt links/rechts, 80pt oben, 60pt unten
- ContentWidth: 475pt
- SectionGap: 25pt

## Grundriss-Rendering

### Funktionsweise
- **Datenquelle**: `submission.rooms.{erdgeschoss,obergeschoss,untergeschoss}`
- **Rendering**: Räume als Grid von Rechtecken
- **Außenwände**: 3pt dick, primary color
- **Innenwände**: 1pt dünn, textMuted color
- **Layout**: Max 3 Räume pro Zeile, 140x100pt Raumgröße

### Defensive Features
- Validierung: `isFinite()` für Koordinaten
- Fallback: Keine Räume → Seite wird übersprungen
- Null-Safety: `rooms?.erdgeschoss?.length > 0`

### Beispiel-Daten
```json
{
  "rooms": {
    "erdgeschoss": [
      { "name": "Wohnzimmer", "details": "Südseite" },
      { "name": "Küche", "details": "" }
    ],
    "obergeschoss": [
      { "name": "Schlafzimmer", "details": "Mit Ankleide" }
    ],
    "untergeschoss": []
  }
}
```

## Neue Module/Seiten hinzufügen

### 1. Neue Seite erstellen
```javascript
drawMeineSe

ite(doc, submission) {
  let y = 100;
  const { marginLeft, contentWidth } = this.layout;

  doc.font(this.typography.h1.font)
     .fontSize(this.typography.h1.size)
     .fillColor(this.colors.primary);
  doc.text('Meine Seite', marginLeft, y);

  // ... Inhalt
}
```

### 2. In generatePDF() einfügen
```javascript
// Neue Seite nach Komponenten
doc.addPage();
pageNum++;
this.drawHeader(doc, 'Meine Seite');
this.drawMeineSeite(doc, submission);
this.drawFooter(doc, pageNum);
```

### 3. Style-Konstanten nutzen
```javascript
// NICHT: doc.font('Helvetica-Bold').fontSize(14)
// SONDERN:
doc.font(this.typography.h2.font).fontSize(this.typography.h2.size);

// NICHT: Hardcoded margins
// SONDERN:
const { marginLeft } = this.layout;
```

## Qualitätssicherung

### Checkliste
- [ ] Innenwände in Grundriss sichtbar (min. 3 Fixtures)
- [ ] Liniengewicht: Außenwände > Innenwände
- [ ] Keine Layout-Überläufe (kein abgeschnittener Text)
- [ ] CI konsistent (Farben, Abstände)
- [ ] PDF-Größe < 25 MB
- [ ] Deterministische Ausgabe (gleiche Input → gleiche Output)
- [ ] Fehlertoleranz (fehlende Daten → "nicht verfügbar")

### Regressionstests
```bash
# Golden sample mit 8 Räumen
node -e "..." # Siehe oben

# Erwartung: PDF mit Raumplanung-Seite
# Validierung: Datei existiert, >5KB, Innenwände vorhanden
```

## Performance

- **Generierung**: ~2-5 Sekunden
- **Dateigröße**: 10-20 MB (abhängig von Bildern)
- **Optimierung**: Bilder als Vektor (SVG) statt Raster bevorzugen

## Troubleshooting

### PDF zu groß (>30 MB)
→ Produktbilder komprimieren oder als Platzhalter rendern

### Innenwände fehlen
→ Prüfen: `submission.rooms` definiert? `hasRooms` Logik korrekt?

### Layout-Überlauf
→ Y-Koordinaten tracken, `y + height < 780` prüfen

### Koordinaten außerhalb Seite
→ `isFinite()` Validierung, Clipping-Rect prüfen

## Changelog

### 2026-02-02
- ✅ Grundriss-Rendering implementiert (Innenwände + Außenwände)
- ✅ Design-System (Typography, Layout-Konstanten)
- ✅ Executive Summary Seite (Tabellen statt Fließtext)
- ✅ Test-Fixtures (golden-sample.json)
- ✅ Defensive Rendering (Validierung, Fallbacks)
- ✅ Dokumentation (diese Datei)
