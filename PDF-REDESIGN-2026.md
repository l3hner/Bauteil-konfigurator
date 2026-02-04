# PDF Redesign - Marketing Broschüre (Februar 2026)

## ✅ Implementierte Features

### Phase 1: Layout & Struktur

#### 1.1 Hero-Titelseite ⭐
- **Hero-Hintergrundbild**: Unterstützung für `assets/hero-background.jpg` (mit Fallback)
- **Semi-transparentes Overlay**: Dunkelgrüner Hintergrund mit 65% Opacity für Lesbarkeit
- **Prominenter QDF-Badge**: Kreisförmig, links oben, gold
- **Moderne Typografie**: 48pt Titel, goldene Akzente
- **Familie prominent**: Bauherr-Name in 22pt
- **Location**: `pdfService.js:172-221`

#### 1.2 Professioneller Footer 📄
- **Goldene Trennlinie**: 0.5pt dünn
- **Strukturierte Info**: Firma | QDF | RAL | Website
- **Seitenzahl prominent**: Bold, rechts
- **Location**: `pdfService.js:223-236`

#### 1.3 2-Spalten-Layout für Komponenten 📐
- **Linke Spalte**: Produktbild (200x150px)
- **Rechte Spalte**: Name, Beschreibung, Tech-Box, Premium Features
- **Kompakte Tech-Box**: Gelber Rahmen, 1.5pt, rechte Spalte
- **Vergleichsbox**: Full-width unten, "KRITISCHE FRAGEN"
- **Location**: `pdfService.js:626-801`

### Phase 2: Infografiken

#### 2.1 U-Wert Bar-Chart 📊
- **Visueller Vergleich**: Ihr Wert vs. Standard (0,24) vs. Minimum (0,40)
- **Farbcodierung**: Gold (Exzellent), Grau (Standard/Minimum)
- **Skala**: 0 - 0,5 W/(m²K)
- **Location**: `pdfService.js:803-831`

#### 2.2 SCOP-Gauge (Halbkreis) 🌡️
- **Halbkreis-Anzeige**: PDFKit Arc-Grafik
- **Gold-Bogen**: Zeigt SCOP-Wert visuell (Skala bis 6)
- **Sternebewertung**: Bis 5 Sterne
- **Nur für Heizung/Lüftung**: Automatisch erkannt
- **Location**: `pdfService.js:833-862`

#### 2.3 QR-Codes 📱
- **3 QR-Codes nebeneinander**: Website | E-Mail | Telefon
- **Library**: `qrcode` npm package
- **Farbe**: Primary Green (#06402b)
- **Größe**: 80x80px mit Label
- **Location**: `pdfService.js:864-880`, `pdfService.js:968-978`

### Phase 3: Styling & Design

#### 3.1 Card-Grid für Qualitätsvorteile 🎴
- **3 Spalten Layout**: 3 Cards pro Zeile
- **7 Cards**: Alle Qualitätsvorteile als Karten
- **Card-Design**:
  - Größe: 145x115px
  - Gold-Border: 1pt
  - Nummer-Badge: Gold-Circle links oben
  - Icon: Emoji-Fallback auf Gold-Star
  - Titel + Beschreibung zentriert
- **Location**: `pdfService.js:346-418`

#### 3.2 Optimierte Typografie
- **Hero Typography**: 48pt für Titelseite
- **Kompakte Fonts**: 7-9pt für Cards und Tech-Details
- **Gold-Highlights**: U-Werte, Position, Premium-Features
- **Custom Font Support**: Vorbereitet (aktuell Helvetica-Fallback)

## 📦 Neue Dependencies

```json
{
  "qrcode": "^1.5.4"
}
```

## 📊 Dateigrößen-Analyse

### Aktueller Status
- **Generiertes PDF**: ~20 MB
- **Ziel**: <5 MB
- **Problem**: Hochauflösende Produktbilder

### Optimierungsstrategie (To-Do)

1. **Bilder komprimieren**:
   ```bash
   # Alle PNG in assets/variants/ auf 50% Qualität komprimieren
   # Empfohlen: TinyPNG oder ImageMagick
   ```

2. **Hero-Bild hinzufügen**:
   - Datei: `assets/hero-background.jpg`
   - Größe: 1920x1080px
   - Komprimiert: <200 KB
   - Format: JPG 70% Qualität

3. **WebP-Unterstützung** (PDFKit 0.13+):
   - Produktbilder als WebP statt PNG
   - 30-50% kleinere Dateigröße

## 🎨 Design-System

### Farben
```javascript
primary: '#06402b'      // Lehner Grün
gold: '#D4AF37'         // Gold-Akzente
goldLight: '#faf8f0'    // Hell-Gold für Boxen
white: '#FFFFFF'
```

### Layout-Konstanten
```javascript
leftColWidth: 220px     // Linke Spalte (Bild)
rightColWidth: 235px    // Rechte Spalte (Content)
cardWidth: 145px        // Card-Breite
cardHeight: 115px       // Card-Höhe
gap: 18px               // Abstand zwischen Cards
```

## 📄 PDF-Struktur (11-14 Seiten)

1. **Hero-Titelseite** - Dunkler Hintergrund, Hero-Typ, QDF-Badge
2. **QDF-Zertifizierung** - Gold-Highlights, Checkmarks
3. **Executive Summary** - Tabellen, kompakt
4. **7 Qualitätsvorteile** - Card-Grid (3x3)
5. **Service-Seite** - Bullet-Liste
6. **Komponenten (7)** - 2-Spalten, Infografiken
   - Außenwandsystem (mit U-Wert Bar-Chart)
   - Innenwandsystem
   - Fenstersystem (mit U-Wert Bar-Chart)
   - Dacheindeckung
   - Haustyp
   - Heizungssystem (mit SCOP-Gauge)
   - Lüftungssystem (mit SCOP-Gauge, optional)
7. **Raumplanung** - Grid-Layout (falls Räume definiert)
8. **Checkliste** - Gold-Checkboxen
9. **Abschlussseite** - Next Steps + 3 QR-Codes

## 🚀 Testen

```bash
# PDF generieren
node test-pdf-generation.js

# Server starten und manuell testen
npm start
# http://localhost:3000 -> Formular ausfüllen -> PDF generieren
```

## 🔧 Fehlerbehebung

### PDF zu groß (>5 MB)
**Ursache**: Hochauflösende Produktbilder (PNG, unkomprimiert)

**Lösung**:
1. Bilder in `assets/variants/` komprimieren
2. PNG → JPG konvertieren (70-80% Qualität)
3. Oder WebP verwenden (PDFKit 0.13+)

### QR-Codes fehlen
**Ursache**: `qrcode` npm package nicht installiert

**Lösung**:
```bash
npm install qrcode
```

### Hero-Bild fehlt
**Info**: Optional. Fallback = dunkelgrüner Hintergrund

**Um Hero-Bild zu nutzen**:
1. Bild nach `assets/hero-background.jpg` kopieren
2. Größe: 1920x1080px
3. Komprimiert: <200 KB

### Custom Fonts fehlen
**Info**: Optional. Fallback = Helvetica

**Um Custom Fonts zu nutzen**:
1. Inter/Montserrat TTF nach `assets/fonts/` kopieren
2. Code bereits vorbereitet (Constructor)

## 📝 Code-Änderungen

### Geänderte Dateien
- ✅ `src/services/pdfService.js` - Hauptänderungen
- ✅ `package.json` - QRCode Dependency
- ✅ `test-pdf-generation.js` - Neues Test-Script

### Neue Methoden
- `drawUValueBarChart(doc, x, y, uValue, maxWidth)` - U-Wert Infografik
- `drawSCOPGauge(doc, x, y, scop)` - SCOP Halbkreis-Gauge
- `async drawQRCode(doc, x, y, url, label)` - QR-Code Generator

### Geänderte Methoden
- `drawTitlePage()` - Hero-Design
- `drawFooter()` - Professional Footer
- `drawComponentContent()` - 2-Spalten-Layout + Infografiken
- `async drawFinalContent()` - QR-Codes hinzugefügt
- `drawQualityAdvantagesPage()` - Card-Grid statt Liste

## ✨ Nächste Schritte (Optional)

### Bildoptimierung (Priorität: HOCH)
- [ ] Alle PNGs in `assets/variants/` auf 70-80% Qualität komprimieren
- [ ] Hero-Hintergrundbild hinzufügen (`assets/hero-background.jpg`)
- [ ] Ziel: PDF unter 5 MB

### Custom Fonts (Priorität: MITTEL)
- [ ] Inter/Montserrat TTF nach `assets/fonts/` laden
- [ ] Registrierung im Constructor testen
- [ ] Fallback auf Helvetica bleibt erhalten

### Weitere Infografiken (Priorität: NIEDRIG)
- [ ] Schallschutz-Vergleich (dB-Skala)
- [ ] Energieeffizienz-Label (A+ bis D)
- [ ] KfW-Förderung Infografik

## 🎯 Erfolgskriterien

| Kriterium | Ziel | Status |
|-----------|------|--------|
| Hero-Titelseite | Modern, Bild-Support | ✅ |
| 2-Spalten-Layout | Komponenten-Seiten | ✅ |
| Infografiken | U-Wert, SCOP, QR | ✅ |
| Card-Grid | Qualitätsvorteile | ✅ |
| Professional Footer | Durchgängig | ✅ |
| Dateigröße <5 MB | PDF optimiert | ⚠️ (19 MB, Bilder optimieren) |
| Print-optimiert | A4, 300 DPI | ✅ |

## 📞 Support

Bei Fragen zu den Änderungen:
1. Siehe Code-Kommentare in `pdfService.js`
2. Teste mit `node test-pdf-generation.js`
3. Check Console-Logs für Debugging

---

**Implementiert**: Februar 2026
**Version**: 2.0
**Nächste Review**: Nach Bildoptimierung
