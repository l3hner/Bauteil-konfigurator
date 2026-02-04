# Lehner Haus Konfigurator

Professioneller PDF-Generator für Haus-Leistungsbeschreibungen mit Grundriss-Rendering.

**Neu:** Executive Summary, Raumplanung mit Innenwänden, Design-System. Siehe [PDF-GENERATOR.md](./PDF-GENERATOR.md) für Details.

## Voraussetzungen

- **Node.js LTS** (Version 18 oder höher)
- npm (wird mit Node.js installiert)

## Installation

```bash
cd bauteil-konfigurator
npm install
```

## Starten

```bash
npm start
```

Die Anwendung startet auf `http://localhost:3000` und öffnet automatisch den Browser.

## Funktionen

### Routen

| Route | Beschreibung |
|-------|--------------|
| `GET /` | Auswahlformular mit allen Varianten |
| `POST /submit` | Validiert, speichert Auswahl, generiert PDF |
| `GET /result/:id` | Zusammenfassung mit Links zu PDF und Details |
| `GET /pdf/:id` | PDF inline anzeigen |
| `GET /pdf/:id?download=1` | PDF herunterladen |
| `GET /details/:id` | Detailseite mit Vor-/Nachteilen |

### Kategorien

- **Wände**: 4 Varianten (Vollziegel, Porenbeton, Kalksandstein, Holzrahmen)
- **Fenster**: 3 Varianten (Kunststoff, Holz, Aluminium)
- **Dachziegel**: 2 Varianten (Ton, Beton)

## Projektstruktur

```
bauteil-konfigurator/
├── src/
│   ├── server.js              # Express-Server
│   ├── routes/
│   │   ├── index.js           # GET /
│   │   ├── submit.js          # POST /submit
│   │   ├── result.js          # GET /result/:id
│   │   ├── pdf.js             # GET /pdf/:id
│   │   └── details.js         # GET /details/:id
│   ├── services/
│   │   ├── catalogService.js  # Katalog laden/cachen
│   │   ├── submissionService.js # Auswahl speichern/laden
│   │   └── pdfService.js      # PDF-Generierung
│   └── utils/
│       └── fileUtils.js       # Hash, Path-Checks
├── views/
│   ├── index.ejs              # Formular
│   ├── result.ejs             # Ergebnis
│   ├── details.ejs            # Vor-/Nachteile
│   └── error.ejs              # Fehlerseite
├── public/
│   └── styles.css             # Styling
├── data/
│   ├── catalog.json           # Varianten-Katalog
│   └── submissions/           # Gespeicherte Auswahlen
├── assets/
│   └── variants/
│       ├── walls/             # Wand-Dateien
│       ├── windows/           # Fenster-Dateien
│       └── tiles/             # Dachziegel-Dateien
├── output/                    # Generierte PDFs
├── package.json
└── README.md
```

## Katalog pflegen

Die Datei `data/catalog.json` enthält alle Varianten. Struktur pro Eintrag:

```json
{
  "id": "eindeutige-id",
  "name": "Anzeigename",
  "description": "Kurzbeschreibung",
  "pros": ["Vorteil 1", "Vorteil 2"],
  "cons": ["Nachteil 1"],
  "filePath": "assets/variants/kategorie/datei.png"
}
```

### Felder

| Feld | Pflicht | Beschreibung |
|------|---------|--------------|
| `id` | Ja | Eindeutige ID (wird für Formulare verwendet) |
| `name` | Ja | Anzeigename |
| `description` | Ja | Kurze Beschreibung |
| `pros` | Ja | Array mit Vorteilen |
| `cons` | Nein | Array mit Nachteilen |
| `filePath` | Ja | Pfad zur Asset-Datei |

## Echte Dateien hinzufügen

Ersetzen Sie die Platzhalter-Bilder durch echte Produktbilder:

```
assets/variants/walls/brick.png       → Ihr Bild für Vollziegel
assets/variants/walls/porenbeton.png  → Ihr Bild für Porenbeton
...
```

### Unterstützte Formate

| Format | Verhalten im PDF |
|--------|------------------|
| `.png`, `.jpg`, `.jpeg`, `.webp` | Bild wird eingebettet |
| `.pdf` | Nur Referenz (Name, Pfad, Hash) |
| Andere | Nur Referenz |

## Sicherheit

- **Path-Traversal-Schutz**: Dateipfade werden gegen `assets/variants/` validiert
- **Whitelist-Validierung**: IDs werden gegen `catalog.json` geprüft
- **Keine stillen Fallbacks**: Fehlende Dateien erzeugen klare Fehlermeldungen

## Logging

Alle Requests und Fehler werden in der Konsole geloggt:

```
[2024-01-15T10:30:00.000Z] GET /
[2024-01-15T10:30:05.000Z] POST /submit
[SUBMISSION] Erstellt: abc-123-def
[PDF] Generiert: output/abc-123-def_auswahl.pdf
```

## Troubleshooting

### Browser öffnet nicht automatisch

Das kann bei WSL oder bestimmten Konfigurationen passieren. Die URL wird im Terminal angezeigt:

```
========================================
  Bauteil-Konfigurator gestartet
  URL: http://localhost:3000
========================================
```

### Datei nicht gefunden

Prüfen Sie:
1. Existiert die Datei unter dem in `catalog.json` angegebenen Pfad?
2. Liegt der Pfad innerhalb von `assets/variants/`?
3. Stimmen die Dateirechte?

### Port bereits belegt

Starten Sie mit einem anderen Port:

```bash
PORT=3001 npm start
```
