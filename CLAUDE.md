# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lehner Haus Konfigurator - A web-based house configuration tool for Lehner Haus GmbH & Co. KG. Users configure their dream house by selecting building components (walls, windows, heating, etc.) and receive a personalized PDF "Leistungsbeschreibung" (service specification). The entire application is in German.

## Commands

```bash
npm install          # Install dependencies
npm start            # Start server on http://localhost:3000 (auto-opens browser)
PORT=3001 npm start  # Start on custom port
```

Development tools:
```bash
node scripts/generate-placeholder-images.js  # Generate placeholder images for catalog items
```

No test, lint, or build commands are configured.

## Architecture

### Tech Stack
- **Backend**: Node.js (>=18) + Express.js + body-parser
- **Templating**: EJS server-side rendering
- **PDF Generation**: PDFKit (professional multi-page PDF with Lehner Haus branding and product images)
- **Image Processing**: Jimp (devDependency for generating placeholder images)
- **Storage**: File system only (JSON files, no database)

### Request Flow
```
Browser → Express Routes → Services → File System
                ↓
         EJS Templates → HTML Response
```

### Key Directories

| Path | Purpose |
|------|---------|
| `src/routes/` | Express route handlers (index, submit, result, pdf) |
| `src/services/catalogService.js` | Catalog loading, KfW filtering, validation |
| `src/services/submissionService.js` | Save/load submissions, parse room data & Eigenleistungen |
| `src/services/pdfService.js` | Multi-page PDF generation with images and Lehner branding |
| `views/` | EJS templates (index.ejs, result.ejs) |
| `public/css/style.css` | Styling |
| `public/js/script.js` | Dynamic form logic (KfW-dependent wall/ventilation options) |
| `data/catalog.json` | Product catalog with 7 categories |
| `data/submissions/` | Saved user configurations as JSON |
| `assets/variants/` | Product images by category (walls, innenwalls, windows, tiles, haustypen, heizung, lueftung) |
| `output/` | Generated PDF files |
| `scripts/` | Utility scripts (placeholder image generation) |

### Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/` | GET | Configuration form with all options |
| `/submit` | POST | Validate, save submission, generate PDF, redirect to result |
| `/result/:id` | GET | Summary page with PDF links |
| `/pdf/:id` | GET | Serve PDF (add `?download=1` for download) |

### Catalog Categories

The catalog (`data/catalog.json`) contains 7 categories:
- **walls**: Exterior wall systems (CLIMATIV, CLIMATIV PLUS - KfW-filtered by `kfwCompatible` array)
- **innenwalls**: Interior wall systems (fermacell, ESB variants)
- **windows**: Window types (Kunststoff, Holz-Alu)
- **tiles**: Roof tiles (Ton, Beton)
- **haustypen**: House types (Bungalow, Stadtvilla, Einfamilienhaus, Doppelhaus)
- **heizung**: Heating systems (Vaillant, Viessmann Wärmepumpen)
- **lueftung**: Ventilation systems (KfW-dependent: "keine" for KfW55, dezentral/zentral for KfW40)

### Catalog Schema

```json
{
  "id": "unique-id",
  "name": "Display name",
  "description": "Short description",
  "advantages": ["Advantage 1", "Advantage 2"],
  "comparisonNotes": "Sales-oriented comparison tips for customers",
  "kfwCompatible": ["KFW55", "KFW40"],
  "filePath": "assets/variants/category/image.png",
  "technicalDrawing": "assets/variants/category/technical.png"
}
```

### Submission Data Structure

User submissions include:
- Bauherr data (vorname, nachname, email, telefon)
- kfw_standard (KFW55 or KFW40)
- Component selections (wall, innerwall, window, tiles, haustyp, heizung, lueftung)
- personenanzahl, grundstueck status
- rooms (erdgeschoss, obergeschoss, untergeschoss arrays)
- eigenleistungen (planned self-performed work)

### PDF Generation

The pdfService generates a professional multi-page PDF with:

**Pages (dynamically generated based on user selection):**
1. Title page with Lehner Haus branding
2. Overview page (Bauherr data + configuration summary)
3. Service page (Lehner Haus services and benefits)
4. Component pages with product images:
   - Außenwandsystem (exterior walls)
   - Innenwandsystem (interior walls)
   - Fenstersystem (windows)
   - Dacheindeckung (roof tiles)
   - Haustyp (house type)
   - Heizungssystem (heating)
   - Lüftungssystem (ventilation - only if selected)
5. Raumplanung (room planning - only if rooms defined)
6. Eigenleistungen (self-performed work - only if any)
7. Final page with next steps and contact info

**Features:**
- Product images embedded from `assets/variants/` directory
- No empty pages (conditional page generation)
- Dynamic page numbering
- Lehner Haus corporate colors (#003366 blue, #C8102E red)
- Advantages and comparison notes for each component

## Security Model

- **Whitelist validation**: User selections validated against catalog before processing
- **ID sanitization**: Submission IDs stripped of non-alphanumeric characters (except hyphens)
- **Path validation**: File paths checked against allowed directories

## Lehner Haus Service Content

The PDF includes marketing content about Lehner Haus services:
- Individuelle Planung & Beratung (100% freie Grundrissgestaltung)
- Nachhaltigkeit & Effizienz (KfW 55/40 Standards)
- Premium-Ausstattung (Vaillant, Viessmann, Villeroy & Boch)
- Kompletter Innenausbau
- Baukoordination (ein Ansprechpartner)
- Sicherheit (Festpreis-Garantie, 5 Jahre Gewährleistung)
