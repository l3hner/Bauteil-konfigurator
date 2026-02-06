const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const catalogService = require('./catalogService');

class PdfService {
  constructor() {
    this.outputDir = path.join(__dirname, '../../output');
    this.assetsDir = path.join(__dirname, '../../assets');

    // Premium Color Palette
    this.colors = {
      primary: '#06402b',
      primaryDark: '#042e1f',
      primaryLight: '#267e61',
      secondary: '#b1a699',
      secondaryLight: '#f5f3ef',
      gold: '#D4AF37',
      goldDark: '#b8922e',
      goldLight: '#faf8f0',
      text: '#1d1d1b',
      textLight: '#333333',
      textMuted: '#666666',
      gray: '#999999',
      grayLight: '#f5f5f5',
      white: '#FFFFFF',
      error: '#cc0000',
      errorLight: '#fff5f5'
    };

    // Design System: Typography & Layout
    // Custom fonts mit Fallback auf Helvetica
    this.hasCustomFonts = false;

    this.typography = {
      hero: { font: 'Helvetica-Bold', size: 48, lineHeight: 1.1 },
      h1: { font: 'Helvetica-Bold', size: 20, lineHeight: 1.2 },
      h2: { font: 'Helvetica-Bold', size: 14, lineHeight: 1.3 },
      h3: { font: 'Helvetica-Bold', size: 12, lineHeight: 1.4 },
      body: { font: 'Helvetica', size: 10, lineHeight: 1.5 },
      small: { font: 'Helvetica', size: 8, lineHeight: 1.4 },
      caption: { font: 'Helvetica', size: 7, lineHeight: 1.3 }
    };

    this.layout = {
      pageWidth: 595,
      pageHeight: 842,
      marginLeft: 60,
      marginRight: 60,
      marginTop: 80,
      marginBottom: 60,
      contentWidth: 475, // pageWidth - marginLeft - marginRight
      gridGap: 15,
      sectionGap: 25
    };
  }

  async ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async generatePDF(submission) {
    await this.ensureOutputDir();

    const outputPath = path.join(this.outputDir, `Leistungsbeschreibung_${submission.id}.pdf`);

    const doc = new PDFDocument({
      size: 'A4',
      margin: 0,
      autoFirstPage: false,
      bufferPages: false
    });

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    let pageNum = 1;

    // Seite 1: Titel
    doc.addPage();
    this.drawTitlePage(doc, submission);

    // Seite 2: QDF-Zertifizierung (NEU)
    doc.addPage();
    pageNum++;
    this.drawHeader(doc, 'QDF-Zertifizierte Qualität');
    this.drawQDFCertificationPage(doc);
    this.drawFooter(doc, pageNum);

    // Seite 3: Executive Summary (Key Facts auf 1 Seite)
    doc.addPage();
    pageNum++;
    this.drawHeader(doc, 'Ihre Konfiguration auf einen Blick');
    this.drawExecutiveSummary(doc, submission);
    this.drawFooter(doc, pageNum);

    // Seite 4: Leistungsübersicht (Kompakt auf einer Seite)
    doc.addPage();
    pageNum++;
    this.drawHeader(doc, 'Ihre Leistungen im Überblick');
    this.drawLeistungsuebersicht(doc, submission);
    this.drawFooter(doc, pageNum);

    // Seite 5: Ihre 7 Qualitätsvorteile
    doc.addPage();
    pageNum++;
    this.drawHeader(doc, 'Ihre 7 Qualitätsvorteile');
    this.drawQualityAdvantagesPage(doc);
    this.drawFooter(doc, pageNum);

    // Seite 5: Service
    doc.addPage();
    pageNum++;
    this.drawHeader(doc, 'Unser Service für Sie');
    this.drawServiceContent(doc);
    this.drawFooter(doc, pageNum);

    // Komponenten-Seiten mit ELK-Style Kapitel-Nummerierung
    const innerwallData = catalogService.getVariantById('innerwalls', submission.innerwall);
    if (!innerwallData && submission.innerwall) {
      console.error('[PDF] ERROR: Innenwand not found:', submission.innerwall);
      console.error('[PDF] Available:', catalogService.getInnerwalls().map(iw => iw.id));
    }

    const components = [
      { title: 'Außenwandsystem', data: catalogService.getVariantById('walls', submission.wall), chapter: '5.1' },
      { title: 'Innenwandsystem', data: innerwallData, chapter: '5.2' },
      { title: 'Deckensystem', data: catalogService.getVariantById('decken', submission.decke), chapter: '5.3' },
      { title: 'Fenstersystem', data: catalogService.getVariantById('windows', submission.window), chapter: '5.4' },
      { title: 'Dacheindeckung', data: catalogService.getVariantById('tiles', submission.tiles), chapter: '5.5' },
      { title: 'Ihr Haustyp', data: catalogService.getVariantById('haustypen', submission.haustyp), chapter: '6.1', isHaustyp: true },
      { title: 'Heizungssystem', data: catalogService.getVariantById('heizung', submission.heizung), chapter: '7.1' }
    ];

    // Lüftung hinzufügen wenn gewählt
    if (submission.lueftung && submission.lueftung !== 'keine') {
      const lueftung = catalogService.getVariantById('lueftung', submission.lueftung);
      if (lueftung && lueftung.id !== 'keine') {
        components.push({ title: 'Lüftungssystem', data: lueftung, chapter: '7.2' });
      }
    }

    for (const comp of components) {
      if (comp.data) {
        console.log(`[PDF] Adding page ${pageNum + 1}: ${comp.title} (${comp.chapter})`);
        doc.addPage();
        pageNum++;
        this.drawHeader(doc, comp.title);

        // Spezielle Seite für Haustyp (Flyer-Stil)
        if (comp.isHaustyp) {
          this.drawHaustypPage(doc, comp.data);
        } else {
          this.drawComponentContent(doc, comp.data, comp.title, comp.chapter);
        }

        this.drawFooter(doc, pageNum);
      } else {
        console.log(`[PDF] SKIPPED: ${comp.title} - no data`);
      }
    }

    // Raumplanung (wenn Räume definiert)
    const hasRooms = (submission.rooms?.erdgeschoss?.length > 0) ||
                     (submission.rooms?.obergeschoss?.length > 0) ||
                     (submission.rooms?.untergeschoss?.length > 0);

    if (hasRooms) {
      doc.addPage();
      pageNum++;
      this.drawHeader(doc, 'Ihre Raumplanung');
      this.drawFloorPlanPage(doc, submission);
      this.drawFooter(doc, pageNum);
    }

    // Qualitäts-Checkliste Seite
    doc.addPage();
    pageNum++;
    this.drawHeader(doc, 'Ihre Checkliste für den Anbietervergleich');
    this.drawComparisonChecklist(doc);
    this.drawFooter(doc, pageNum);

    // Abschluss-Seite mit Bedarfsanalyse
    doc.addPage();
    pageNum++;
    this.drawHeader(doc, 'Ihre nächsten Schritte');
    await this.drawFinalContent(doc, submission);
    this.drawFooter(doc, pageNum);

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve(outputPath));
      stream.on('error', reject);
    });
  }

  drawTitlePage(doc, submission) {
    // Hero-Hintergrundbild (falls vorhanden)
    const heroImagePath = path.join(this.assetsDir, 'hero-background.jpg');

    if (fs.existsSync(heroImagePath)) {
      try {
        doc.image(heroImagePath, 0, 0, { width: 595, height: 842 });
        // Semi-transparent overlay für Lesbarkeit
        doc.rect(0, 0, 595, 842).fillOpacity(0.65).fill(this.colors.primary);
        doc.fillOpacity(1); // Reset
      } catch (e) {
        console.warn('[PDF] Hero-Bild konnte nicht geladen werden, verwende Fallback');
        doc.rect(0, 0, 595, 842).fill(this.colors.primary);
      }
    } else {
      // Fallback: Dunkelgrüner Hintergrund mit Gradient-Effekt (simuliert)
      doc.rect(0, 0, 595, 842).fill(this.colors.primary);
      doc.rect(0, 0, 595, 300).fillOpacity(0.15).fill(this.colors.gold);
      doc.fillOpacity(1);
    }

    // Lehner Haus Logo (zentriert oben)
    const logoPath = path.join(__dirname, '../../Logo/LehnerLogo_schwaebischgut [Konvertiert].png');
    if (fs.existsSync(logoPath)) {
      try {
        // Weißer Hintergrund für Logo-Sichtbarkeit
        doc.roundedRect(187.5, 110, 220, 100, 8).fill(this.colors.white);
        doc.image(logoPath, 197.5, 120, { width: 200 });
      } catch (e) {
        console.warn('[PDF] Logo konnte nicht geladen werden');
        // Fallback: Text-Logo
        doc.font(this.typography.hero.font).fontSize(this.typography.hero.size).fillColor(this.colors.white);
        doc.text('LEHNER HAUS', 0, 180, { width: 595, align: 'center' });
        doc.font('Helvetica').fontSize(18).fillColor('#e0e0e0');
        doc.text('schwäbisch gut', 0, 235, { width: 595, align: 'center' });
      }
    } else {
      // Fallback: Text-Logo
      doc.font(this.typography.hero.font).fontSize(this.typography.hero.size).fillColor(this.colors.white);
      doc.text('LEHNER HAUS', 0, 180, { width: 595, align: 'center' });
      doc.font('Helvetica').fontSize(18).fillColor('#e0e0e0');
      doc.text('schwäbisch gut', 0, 235, { width: 595, align: 'center' });
    }

    // QDF Badge (rechts oben)
    const badgeX = 480, badgeY = 50;
    doc.circle(badgeX + 35, badgeY + 35, 35).fill(this.colors.gold);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(this.colors.white);
    doc.text('QDF', badgeX + 20, badgeY + 23, { width: 30, align: 'center' });
    doc.fontSize(8);
    doc.text('zertifiziert', badgeX + 10, badgeY + 36, { width: 50, align: 'center' });
    doc.text('2026', badgeX + 20, badgeY + 48, { width: 30, align: 'center' });

    // Goldene Trennlinie
    doc.moveTo(200, 355).lineTo(395, 355).lineWidth(2).strokeColor(this.colors.gold).stroke();

    // Untertitel
    doc.font('Helvetica-Bold').fontSize(28).fillColor(this.colors.white);
    doc.text('Ihre persönliche', 0, 390, { width: 595, align: 'center' });

    doc.fontSize(34).fillColor(this.colors.gold);
    doc.text('Leistungsbeschreibung', 0, 425, { width: 595, align: 'center' });

    // Bauherr-Name (prominent)
    doc.font('Helvetica-Bold').fontSize(22).fillColor(this.colors.white);
    doc.text(`Familie ${submission.bauherr_nachname}`, 0, 510, { width: 595, align: 'center' });

    // Datum & Referenz
    const dateStr = new Date(submission.timestamp).toLocaleDateString('de-DE', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    doc.font('Helvetica').fontSize(11).fillColor('#cccccc');
    doc.text(`Erstellt am ${dateStr}`, 0, 570, { width: 595, align: 'center' });

    doc.fontSize(9).fillColor('#999999');
    doc.text(`Referenz: ${submission.id}`, 0, 590, { width: 595, align: 'center' });

    // Footer Titelseite
    doc.rect(0, 770, 595, 2).fill(this.colors.gold);

    doc.font('Helvetica').fontSize(9).fillColor('#cccccc');
    doc.text('Lehner Haus GmbH & Co. KG', 0, 785, { width: 595, align: 'center' });
    doc.fontSize(8);
    doc.text('Ihr Partner für individuelles Bauen seit über 60 Jahren', 0, 800, { width: 595, align: 'center' });
  }

  drawHeader(doc, title) {
    // Gold accent line
    doc.rect(50, 35, 4, 30).fill(this.colors.gold);

    doc.font('Helvetica-Bold').fontSize(20).fillColor(this.colors.primary);
    doc.text(title, 62, 40, { lineBreak: false });

    doc.moveTo(50, 75).lineTo(545, 75).strokeColor(this.colors.secondary).lineWidth(1).stroke();
  }

  drawFooter(doc, pageNum) {
    // Goldene Trennlinie
    doc.moveTo(50, 800).lineTo(545, 800).lineWidth(0.5).strokeColor(this.colors.gold).stroke();

    // Linke Spalte: Firmendaten
    doc.font('Helvetica').fontSize(7).fillColor(this.colors.textMuted);
    doc.text('Lehner Haus GmbH & Co. KG', 50, 810, { lineBreak: false });
    doc.text(' | ', 152, 810, { lineBreak: false });
    doc.text('QDF-zertifiziert', 160, 810, { lineBreak: false });
    doc.text(' | ', 220, 810, { lineBreak: false });
    doc.text('RAL-Gütezeichen', 228, 810, { lineBreak: false });
    doc.text(' | ', 300, 810, { lineBreak: false });
    doc.text('www.lehner-haus.de', 308, 810, { lineBreak: false });

    // Rechte Spalte: Seitenzahl
    doc.font('Helvetica-Bold').fontSize(8).fillColor(this.colors.primary);
    doc.text(`Seite ${pageNum}`, 500, 810, { lineBreak: false });
  }

  // NEU: QDF-Zertifizierung Seite
  drawQDFCertificationPage(doc) {
    let y = 95;

    // Gold highlight box
    doc.roundedRect(60, y, 475, 70, 8).fill(this.colors.goldLight);
    doc.roundedRect(60, y, 475, 70, 8).stroke(this.colors.gold);

    doc.font('Helvetica-Bold').fontSize(14).fillColor(this.colors.primary);
    doc.text('QDF-Qualitätszertifikat 2026', 80, y + 15, { lineBreak: false });

    doc.font('Helvetica').fontSize(10).fillColor(this.colors.textLight);
    doc.text('Lehner Haus ist Mitglied der Qualitätsgemeinschaft Deutscher Fertigbau (QDF)', 80, y + 35, { width: 430 });
    doc.text('und trägt das RAL-Gütezeichen für geprüfte Qualität.', 80, y + 48, { width: 430 });

    y += 95;

    // Intro
    doc.font('Helvetica').fontSize(11).fillColor(this.colors.text);
    doc.text('Die QDF-Zertifizierung garantiert höchste Qualitätsstandards in Planung, Produktion und Ausführung. Als zertifiziertes Mitglied unterliegt Lehner Haus regelmäßigen Prüfungen durch unabhängige Institute.', 80, y, { width: 435, lineGap: 2 });

    y += 55;

    // 5 QDF-Vorteile
    doc.font('Helvetica-Bold').fontSize(13).fillColor(this.colors.primary);
    doc.text('Ihre Vorteile durch QDF-Zertifizierung:', 80, y, { lineBreak: false });

    y += 28;

    const qdfVorteile = [
      ['Geprüfte Produktqualität', 'Alle Bauteile werden nach strengen QDF-Richtlinien produziert und geprüft'],
      ['Unabhängige Überwachung', 'Regelmäßige Kontrollen durch neutrale Prüfinstitute sichern konstante Qualität'],
      ['Transparente Bauprozesse', 'Dokumentierte Arbeitsabläufe für nachvollziehbare Qualitätssicherung'],
      ['Geschulte Fachkräfte', 'Fortlaufende Weiterbildung aller Mitarbeiter nach QDF-Standards'],
      ['Garantierte Bauqualität', 'RAL-Gütezeichen als Nachweis für geprüfte Fertigbauqualität']
    ];

    qdfVorteile.forEach(([title, desc]) => {
      // Gold checkmark circle
      doc.circle(90, y + 7, 8).fill(this.colors.gold);
      doc.font('Helvetica-Bold').fontSize(10).fillColor(this.colors.white);
      doc.text('✓', 86, y + 3, { lineBreak: false });

      doc.font('Helvetica-Bold').fontSize(10).fillColor(this.colors.primary);
      doc.text(title, 108, y, { lineBreak: false });

      doc.font('Helvetica').fontSize(9).fillColor(this.colors.textLight);
      doc.text(desc, 108, y + 13, { width: 420, lineGap: 1 });

      y += 42;
    });

    y += 15;

    // Kernbotschaft Box
    doc.roundedRect(60, y, 475, 65, 8).fill(this.colors.primary);

    doc.font('Helvetica-Bold').fontSize(12).fillColor(this.colors.white);
    doc.text('Vertrauen Sie auf geprüfte Qualität', 80, y + 12, { lineBreak: false });

    doc.font('Helvetica').fontSize(10).fillColor(this.colors.white);
    doc.text('Die QDF-Zertifizierung ist Ihr Qualitätsversprechen: Jedes Lehner Haus wird nach höchsten Standards geplant, produziert und errichtet. Das RAL-Gütezeichen bestätigt diese Qualität unabhängig.', 80, y + 30, { width: 420, lineGap: 1 });

    y += 85;

    // Zertifikatsnummer
    doc.font('Helvetica').fontSize(9).fillColor(this.colors.textMuted);
    doc.text('QDF-Mitgliedsnummer: DE-QDF-2026-LH | RAL-Gütezeichen: RAL-GZ 422', 80, y, { lineBreak: false });
  }

  // NEU: 7 Qualitätsvorteile Seite (Card-Grid Layout)
  drawQualityAdvantagesPage(doc) {
    let y = 95;

    doc.font('Helvetica').fontSize(10).fillColor(this.colors.text);
    doc.text('Bei Lehner Haus erhalten Sie Premium-Qualität in jedem Detail:', 80, y, { width: 435 });

    y += 30;

    const vorteile = [
      { nr: '1', title: 'F90 Brandschutz', desc: '90 Min. Feuerwiderstand als Standard' },
      { nr: '2', title: 'Diffusionsoffen', desc: 'Natürliche Feuchtigkeitsregulation' },
      { nr: '3', title: 'QDF-geprüft', desc: 'Industriequalität statt Baustelle' },
      { nr: '4', title: 'Caparol Premium', desc: '15 Jahre Garantie auf Fassade' },
      { nr: '5', title: 'RC2-Sicherheit', desc: 'Einbruchschutz serienmäßig' },
      { nr: '6', title: 'KfW 40/55', desc: 'Maximale Förderung möglich' },
      { nr: '7', title: 'Festpreis-Garantie', desc: 'Keine versteckten Kosten' }
    ];

    const cardWidth = 145;
    const cardHeight = 115;
    const gap = 18;
    const startX = 70;
    const cardsPerRow = 3;

    vorteile.forEach((vorteil, idx) => {
      const row = Math.floor(idx / cardsPerRow);
      const col = idx % cardsPerRow;
      const cx = startX + col * (cardWidth + gap);
      const cy = y + row * (cardHeight + gap);

      // Card Background
      doc.roundedRect(cx, cy, cardWidth, cardHeight, 8).fill('#f9f9f9');
      doc.roundedRect(cx, cy, cardWidth, cardHeight, 8)
         .strokeColor(this.colors.gold).lineWidth(1).stroke();

      // Nummer-Badge (links oben)
      doc.circle(cx + 15, cy + 15, 12).fill(this.colors.gold);
      doc.font('Helvetica-Bold').fontSize(10).fillColor(this.colors.white);
      doc.text(vorteil.nr, cx + 10, cy + 9, { width: 10, align: 'center' });

      // Titel (keine Icons mehr)
      doc.font('Helvetica-Bold').fontSize(10).fillColor(this.colors.primary);
      doc.text(vorteil.title, cx + 8, cy + 45, { width: cardWidth - 16, align: 'center' });

      // Beschreibung
      doc.font('Helvetica').fontSize(7.5).fillColor(this.colors.textLight);
      doc.text(vorteil.desc, cx + 8, cy + 65, { width: cardWidth - 16, align: 'center', lineGap: 0.8 });
    });

    y += Math.ceil(vorteile.length / cardsPerRow) * (cardHeight + gap) + 15;

    // Callout Box
    doc.roundedRect(60, y, 475, 50, 8).fill(this.colors.primaryDark);

    doc.font('Helvetica-Bold').fontSize(10).fillColor(this.colors.gold);
    doc.text('Fragen Sie bei anderen Anbietern gezielt nach diesen Punkten!', 80, y + 12, { lineBreak: false });

    doc.font('Helvetica').fontSize(8).fillColor(this.colors.white);
    doc.text('Nicht alle diese Leistungen sind branchenüblich. Bei Lehner Haus sind sie Standard.', 80, y + 30, { lineBreak: false });
  }

  drawExecutiveSummary(doc, submission) {
    let y = 100;
    const { marginLeft, contentWidth } = this.layout;

    // Key Facts Table
    doc.font(this.typography.h2.font).fontSize(this.typography.h2.size).fillColor(this.colors.primary);
    doc.text('Ihre Hausdaten', marginLeft, y);
    y += 30;

    const haustyp = catalogService.getVariantById('haustypen', submission.haustyp);
    const kfw = submission.kfw_standard === 'KFW55' ? 'KfW 55' : 'KfW 40';

    const keyFacts = [
      ['Bauherr', `${submission.bauherr_vorname} ${submission.bauherr_nachname}`],
      ['Haustyp', haustyp?.name || '-'],
      ['Energiestandard', kfw],
      ['Personenzahl', `${submission.personenanzahl} Personen`],
      ['Grundstück', this.getGrundstueckText(submission.grundstueck)]
    ];

    // Draw table
    const rowHeight = 22;
    keyFacts.forEach(([label, value]) => {
      // Alternating background
      if (keyFacts.indexOf([label, value]) % 2 === 0) {
        doc.rect(marginLeft, y - 3, contentWidth, rowHeight).fill(this.colors.grayLight);
      }

      doc.font(this.typography.body.font).fontSize(this.typography.body.size).fillColor(this.colors.text);
      doc.text(label, marginLeft + 10, y, { width: 150, lineBreak: false });
      doc.font(this.typography.body.font).fillColor(this.colors.textLight);
      doc.text(value, marginLeft + 170, y, { width: contentWidth - 180, lineBreak: false });
      y += rowHeight;
    });

    // Components Summary
    y += this.layout.sectionGap;
    doc.font(this.typography.h2.font).fontSize(this.typography.h2.size).fillColor(this.colors.primary);
    doc.text('Gewählte Komponenten', marginLeft, y);
    y += 25;

    const wall = catalogService.getVariantById('walls', submission.wall);
    const innerwall = catalogService.getVariantById('innerwalls', submission.innerwall);
    const decke = catalogService.getVariantById('decken', submission.decke);
    const windowData = catalogService.getVariantById('windows', submission.window);
    const tiles = catalogService.getVariantById('tiles', submission.tiles);
    const heizung = catalogService.getVariantById('heizung', submission.heizung);
    const lueftung = catalogService.getVariantById('lueftung', submission.lueftung);

    const components = [
      ['Außenwand', wall?.name, wall?.technicalDetails?.uValue],
      ['Innenwand', innerwall?.name, innerwall?.technicalDetails?.soundInsulation],
      ['Decke', decke?.name, decke?.technicalDetails?.soundInsulation],
      ['Fenster', windowData?.name, windowData?.technicalDetails?.ugValue],
      ['Dach', tiles?.name, tiles?.technicalDetails?.lifespan],
      ['Heizung', heizung?.name, heizung?.technicalDetails?.scop]
    ];

    if (lueftung && lueftung.id !== 'keine') {
      components.push(['Lüftung', lueftung.name, lueftung.technicalDetails?.heatRecovery]);
    }

    components.forEach(([label, name, spec]) => {
      if (components.indexOf([label, name, spec]) % 2 === 1) {
        doc.rect(marginLeft, y - 3, contentWidth, rowHeight).fill(this.colors.grayLight);
      }

      doc.font(this.typography.body.font).fontSize(this.typography.body.size).fillColor(this.colors.textMuted);
      doc.text(label, marginLeft + 10, y, { width: 100, lineBreak: false });
      doc.fillColor(this.colors.text);
      doc.text(name || '-', marginLeft + 120, y, { width: 220, lineBreak: false });
      doc.font(this.typography.small.font).fontSize(this.typography.small.size).fillColor(this.colors.gold);
      doc.text(spec || '', marginLeft + 350, y, { width: contentWidth - 360, align: 'right' });
      y += rowHeight;
    });

    // CTA Box
    y += this.layout.sectionGap + 10;
    doc.roundedRect(marginLeft, y, contentWidth, 80, 8).fill(this.colors.primary);

    doc.font(this.typography.h3.font).fontSize(this.typography.h3.size).fillColor(this.colors.gold);
    doc.text('Nächster Schritt: Persönliche Beratung', marginLeft + 20, y + 15, { width: contentWidth - 40 });

    doc.font(this.typography.body.font).fontSize(this.typography.body.size).fillColor(this.colors.white);
    doc.text('Vereinbaren Sie jetzt Ihren Termin im Musterhaus oder nutzen Sie unsere kostenlose Bedarfsanalyse.',
      marginLeft + 20, y + 40, { width: contentWidth - 40, lineGap: 2 });
  }

  // NEU: Kompakte Leistungsübersicht auf einer Seite
  drawLeistungsuebersicht(doc, submission) {
    let y = 95;
    const { marginLeft, contentWidth } = this.layout;

    // Dynamische Werte aus Submission
    const windowData = catalogService.getVariantById('windows', submission.window);
    const heizung = catalogService.getVariantById('heizung', submission.heizung);
    const lueftung = catalogService.getVariantById('lueftung', submission.lueftung);

    // Fenster-Beschreibung dynamisch
    const fensterText = windowData ? windowData.name : '3-fach verglaste Kunststofffenster';
    // Heizung dynamisch
    const heizungText = heizung ? heizung.name : 'Luft-Wasser-Wärmepumpe';
    // Lüftung dynamisch
    const hasLueftung = lueftung && lueftung.id !== 'keine';
    const lueftungText = hasLueftung ? lueftung.name : null;

    // 3-Spalten Layout
    const colWidth = 155;
    const colGap = 10;
    const col1X = marginLeft;
    const col2X = marginLeft + colWidth + colGap;
    const col3X = marginLeft + 2 * (colWidth + colGap);

    // === SPALTE 1: PLANUNG ===
    doc.roundedRect(col1X, y, colWidth, 22, 4).fill(this.colors.primary);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(this.colors.white);
    doc.text('Planung & Service', col1X + 8, y + 6);

    let y1 = y + 30;
    const planungItems = [
      'Bestandsvermessung',
      'Elektroplanung',
      'Lüftungsplanung',
      'Vor-Ort Bemusterung',
      'Übergabe- & Werkplanung',
      'Statische Berechnungen',
      'Bauleitung',
      'Energieberater (EnEV)',
      'Energieausweis',
      'KfW-Bestätigung',
      'Lebenszyklusanalyse (LCA)'
    ];

    doc.font('Helvetica').fontSize(7.5).fillColor(this.colors.text);
    planungItems.forEach(item => {
      doc.fillColor(this.colors.gold).text('•', col1X + 3, y1, { lineBreak: false });
      doc.fillColor(this.colors.text).text(item, col1X + 12, y1, { width: colWidth - 15 });
      y1 += 11;
    });

    // === SPALTE 2: ROHBAU ===
    doc.roundedRect(col2X, y, colWidth, 22, 4).fill(this.colors.primary);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(this.colors.white);
    doc.text('Rohbau', col2X + 8, y + 6);

    let y2 = y + 30;
    const rohbauItems = [
      'Gerüst & Kran',
      'Transport',
      'Baustromanschluss',
      'Bodenplatte inkl. Dämmung',
      'Mehrspartenhauseinführung',
      'Geschlossene Gebäudehülle',
      'Außenputz',
      'Zwischendecke',
      'Innenwände geschlossen',
      'Dach mit Eindeckung',
      'Dachüberstände gestrichen',
      fensterText,
      'Haustür (3-fach-Verrieg.)',
      'Alu-Außenfensterbänke',
      'Dachrinnen & Fallrohre'
    ];

    doc.font('Helvetica').fontSize(7.5);
    rohbauItems.forEach(item => {
      doc.fillColor(this.colors.gold).text('•', col2X + 3, y2, { lineBreak: false });
      doc.fillColor(this.colors.text).text(item, col2X + 12, y2, { width: colWidth - 15 });
      y2 += 11;
    });

    // === SPALTE 3: AUSBAU ===
    doc.roundedRect(col3X, y, colWidth, 22, 4).fill(this.colors.primary);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(this.colors.white);
    doc.text('Bezugsfertiger Ausbau', col3X + 8, y + 6);

    let y3 = y + 30;
    const ausbauItems = [
      heizungText,
      'Estrich mit Fußbodenheizung',
      'Raumthermostate',
      'Elektr. Alu-Rollläden',
      'Stromantrag & Abnahme',
      'Zählerschrank',
      'Blower-Door-Test',
      'Komplette Elektroinstallation'
    ];

    // Lüftung nur wenn gewählt
    if (lueftungText) {
      ausbauItems.push(lueftungText);
    }

    // Innenausbau
    ausbauItems.push(
      'Fliesen (Bäder/WC)',
      'Sanitärobjekte & Armaturen',
      'Vinyl/Laminat (Wohnräume)',
      'Spachteln & Schleifen',
      'Malern (weiß)',
      'Innentüren'
    );

    doc.font('Helvetica').fontSize(7.5);
    ausbauItems.forEach(item => {
      doc.fillColor(this.colors.gold).text('•', col3X + 3, y3, { lineBreak: false });
      doc.fillColor(this.colors.text).text(item, col3X + 12, y3, { width: colWidth - 15 });
      y3 += 11;
    });

    // Maximale Y-Position für Box unten
    const maxY = Math.max(y1, y2, y3) + 15;

    // === HIGHLIGHT BOX: Gewählte Komponenten ===
    doc.roundedRect(marginLeft, maxY, contentWidth, 85, 8).fill(this.colors.goldLight);
    doc.rect(marginLeft, maxY, 4, 85).fill(this.colors.gold);

    doc.font('Helvetica-Bold').fontSize(10).fillColor(this.colors.primary);
    doc.text('Ihre gewählten Ausstattungsmerkmale:', marginLeft + 15, maxY + 10);

    const wall = catalogService.getVariantById('walls', submission.wall);
    const innerwall = catalogService.getVariantById('innerwalls', submission.innerwall);
    const decke = catalogService.getVariantById('decken', submission.decke);
    const tiles = catalogService.getVariantById('tiles', submission.tiles);

    const highlights = [
      wall ? `Außenwand: ${wall.name}` : null,
      innerwall ? `Innenwand: ${innerwall.name}` : null,
      decke ? `Decke: ${decke.name}` : null,
      windowData ? `Fenster: ${windowData.name}` : null,
      tiles ? `Dach: ${tiles.name}` : null,
      heizung ? `Heizung: ${heizung.name}` : null,
      hasLueftung ? `Lüftung: ${lueftungText}` : null
    ].filter(Boolean);

    doc.font('Helvetica').fontSize(8).fillColor(this.colors.text);
    let hx = marginLeft + 15;
    let hy = maxY + 28;
    const colHalfWidth = contentWidth / 2 - 20;

    highlights.forEach((h, i) => {
      const isRightCol = i >= Math.ceil(highlights.length / 2);
      const xPos = isRightCol ? marginLeft + contentWidth / 2 : marginLeft + 15;
      const yPos = isRightCol ? maxY + 28 + (i - Math.ceil(highlights.length / 2)) * 13 : maxY + 28 + i * 13;

      doc.fillColor(this.colors.gold).text('✓', xPos, yPos, { lineBreak: false });
      doc.fillColor(this.colors.text).text(h, xPos + 12, yPos, { width: colHalfWidth });
    });

    // === FOOTER BOX ===
    const footerY = maxY + 100;
    doc.roundedRect(marginLeft, footerY, contentWidth, 40, 6).fill(this.colors.primary);

    doc.font('Helvetica-Bold').fontSize(9).fillColor(this.colors.white);
    doc.text('Alle Leistungen inklusive - keine versteckten Kosten!', marginLeft + 15, footerY + 10);

    doc.font('Helvetica').fontSize(8).fillColor(this.colors.white);
    doc.text('Festpreis-Garantie von Lehner Haus: Ihr Preis steht von Anfang an fest.', marginLeft + 15, footerY + 24);
  }

  drawOverviewContent(doc, submission) {
    const haustyp = catalogService.getVariantById('haustypen', submission.haustyp);
    const kfw = submission.kfw_standard === 'KFW55' ? 'KfW 55' : 'KfW 40';

    let y = 100;

    // Bauherr-Daten
    const lines = [
      ['Bauherr:', `${submission.bauherr_vorname} ${submission.bauherr_nachname}`],
      ['E-Mail:', submission.bauherr_email || '-'],
      ['Telefon:', submission.bauherr_telefon || '-'],
      ['Haustyp:', haustyp?.name || '-'],
      ['Energiestandard:', kfw],
      ['Personenanzahl:', `${submission.personenanzahl} Personen`],
      ['Grundstück:', this.getGrundstueckText(submission.grundstueck)]
    ];

    lines.forEach(([label, value]) => {
      doc.font('Helvetica-Bold').fontSize(11).fillColor(this.colors.primary);
      doc.text(label, 80, y, { lineBreak: false });
      doc.font('Helvetica').fillColor(this.colors.textLight);
      doc.text(value, 250, y, { lineBreak: false });
      y += 22;
    });

    // Komponenten-Liste
    y += 25;
    doc.font('Helvetica-Bold').fontSize(12).fillColor(this.colors.primary);
    doc.text('Ihre Komponenten:', 80, y, { lineBreak: false });
    y += 22;

        const wall = catalogService.getVariantById('walls', submission.wall);
    const innerwall = catalogService.getVariantById('innerwalls', submission.innerwall);
    const decke = catalogService.getVariantById('decken', submission.decke);
    const windowData = catalogService.getVariantById('windows', submission.window);
    const tiles = catalogService.getVariantById('tiles', submission.tiles);
    const heizung = catalogService.getVariantById('heizung', submission.heizung);
    const lueftung = catalogService.getVariantById('lueftung', submission.lueftung);

    const componentsList = [
      { label: 'Außenwand', data: wall },
      { label: 'Innenwand', data: innerwall },
      { label: 'Decke', data: decke },
      { label: 'Fenster', data: windowData },
      { label: 'Dach', data: tiles },
      { label: 'Heizung', data: heizung }
    ];

    // Lüftung nur hinzufügen wenn nicht "keine"
    if (lueftung && lueftung.id !== 'keine') {
      componentsList.push({ label: 'Lüftung', data: lueftung });
    }

    doc.font('Helvetica').fontSize(10).fillColor(this.colors.textLight);
    componentsList.forEach(({ label, data }) => {
      if (data) {
        doc.font('Helvetica-Bold').fillColor(this.colors.primary);
        doc.text(`${label}:`, 90, y, { continued: true });
        doc.font('Helvetica').fillColor(this.colors.textLight);
        doc.text(` ${data.name}`, { lineBreak: false });
        y += 18;
      }
    });

    // Vorteile-Box with gold accent
    y += 30;
    doc.roundedRect(60, y, 475, 110, 8).fill(this.colors.goldLight);
    doc.rect(60, y, 4, 110).fill(this.colors.gold);

    doc.font('Helvetica-Bold').fontSize(12).fillColor(this.colors.primary);
    doc.text('Ihre Vorteile mit Lehner Haus', 80, y + 15, { lineBreak: false });

    doc.font('Helvetica').fontSize(10).fillColor(this.colors.text);
    const vorteile = [
      'Festpreis-Garantie ohne versteckte Kosten',
      'Persönliche Betreuung bis zum Einzug',
      'Über 60 Jahre Erfahrung im Hausbau',
      'QDF-zertifizierte Qualität mit RAL-Gütezeichen',
      '5 Jahre Gewährleistung auf alle Bauleistungen'
    ];

    vorteile.forEach((v, i) => {
      doc.fillColor(this.colors.gold).text('✓', 80, y + 38 + (i * 14), { lineBreak: false });
      doc.fillColor(this.colors.text).text(v, 95, y + 38 + (i * 14), { lineBreak: false });
    });
  }

  drawServiceContent(doc) {
    let y = 100;

    doc.font('Helvetica').fontSize(11).fillColor(this.colors.text);
    doc.text('Bei Lehner Haus erhalten Sie alles aus einer Hand – schwäbisch gut seit über 60 Jahren.', 80, y, { lineBreak: false });

    y = 130;

    const services = [
      ['Individuelle Planung', '100% freie Grundrissgestaltung – keine Katalog-Zwänge'],
      ['Wohngesunde Materialien', 'ESB-Platten statt OSB – zertifiziert emissionsarm'],
      ['Premium-Ausstattung', 'Vaillant & Viessmann Wärmepumpen, Villeroy & Boch Sanitär'],
      ['Kompletter Innenausbau', 'Elektrik, Sanitär, Fußböden – alles aus einer Hand'],
      ['Ein Ansprechpartner', 'Ihr persönlicher Bauleiter von Planung bis Schlüsselübergabe'],
      ['Festpreis-Garantie', 'Keine versteckten Kosten, keine bösen Überraschungen'],
      ['Qualitätssicherung', 'QDF-zertifiziert mit RAL-Gütezeichen und Eigenüberwachung']
    ];

    services.forEach(([title, text]) => {
      doc.font('Helvetica-Bold').fontSize(10).fillColor(this.colors.primary);
      doc.text(title, 80, y, { lineBreak: false });
      doc.font('Helvetica').fontSize(9).fillColor(this.colors.text);
      doc.text(text, 80, y + 13, { lineBreak: false });
      y += 38;
    });

    // Highlight-Box
    y += 15;
    doc.roundedRect(60, y, 475, 55, 8).fill(this.colors.primary);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(this.colors.white);
    doc.text('Mehr als 3.000 zufriedene Baufamilien vertrauen auf Lehner Haus.', 80, y + 12, { lineBreak: false });
    doc.font('Helvetica').fontSize(9).fillColor(this.colors.white);
    doc.text('QDF-zertifiziert | RAL-Gütezeichen | Mitglied im BDF', 80, y + 32, { lineBreak: false });
  }

  drawComponentContent(doc, component, categoryTitle, chapterNumber) {
    // ELK-Style Layout: Technisches Schnittbild + Aufbau-Liste + Qualitätsmerkmale
    const marginLeft = 50;
    const contentWidth = 495;
    let y = 95;

    // === KAPITEL-HEADER mit Nummerierung ===
    const chapterNum = chapterNumber || '5.1';
    doc.font('Helvetica-Bold').fontSize(11).fillColor(this.colors.primary);
    doc.text(`${chapterNum} ${categoryTitle.toUpperCase()}`, marginLeft, y);
    y += 18;

    // Komponenten-Name und kurze Beschreibung
    doc.font('Helvetica').fontSize(9).fillColor(this.colors.text);
    const shortDesc = component.description ? component.description.split('.')[0] + '.' : '';
    doc.text(`${component.name}${shortDesc ? ' – ' + shortDesc : ''}`, marginLeft, y, { width: contentWidth });
    y += 25;

    // === 2-SPALTEN LAYOUT: Bild links, Aufbau rechts ===
    const imgWidth = 180;
    const imgHeight = 140;
    const rightColX = marginLeft + imgWidth + 25;
    const rightColWidth = contentWidth - imgWidth - 25;

    // Technische Zeichnung/Schnittbild (bevorzugt) oder Produktbild
    const techDrawingPath = component.technicalDrawing ?
      path.join(__dirname, '../..', component.technicalDrawing) : null;
    const productImgPath = component.filePath ?
      path.join(__dirname, '../..', component.filePath) : null;

    const imgPath = (techDrawingPath && fs.existsSync(techDrawingPath)) ? techDrawingPath : productImgPath;

    if (imgPath && fs.existsSync(imgPath)) {
      try {
        doc.image(imgPath, marginLeft, y, { fit: [imgWidth, imgHeight] });
      } catch (e) {
        this.drawImagePlaceholder(doc, marginLeft, y, imgWidth, imgHeight, categoryTitle);
      }
    } else {
      this.drawImagePlaceholder(doc, marginLeft, y, imgWidth, imgHeight, categoryTitle);
    }

    // === AUFBAU-LISTE (rechte Spalte) - ELK Style ===
    let rightY = y;

    // "Aufbau von außen nach innen" Header (fett, unterstrichen)
    doc.font('Helvetica-Bold').fontSize(9).fillColor(this.colors.primary);
    doc.text('Aufbau von außen nach innen', rightColX, rightY);
    rightY += 4;
    doc.moveTo(rightColX, rightY + 8).lineTo(rightColX + 130, rightY + 8)
       .strokeColor(this.colors.secondary).lineWidth(0.5).stroke();
    rightY += 14;

    // Aufbau-Schichten aus component.layers oder technicalDetails extrahieren
    const aufbauItems = this.extractAufbauItems(component, categoryTitle);

    doc.font('Helvetica').fontSize(8);
    aufbauItems.forEach(item => {
      // Bullet Point (fett)
      doc.font('Helvetica-Bold').fillColor(this.colors.text).text('·', rightColX, rightY, { lineBreak: false });
      // Beschreibung
      doc.font('Helvetica').fillColor(this.colors.text);
      doc.text(item.name, rightColX + 8, rightY, { width: rightColWidth - 70, lineBreak: false });
      // Maß rechtsbündig (wenn vorhanden) - hervorgehoben
      if (item.value) {
        doc.font('Helvetica-Bold').fillColor(this.colors.primary);
        doc.text(item.value, rightColX + rightColWidth - 65, rightY, {
          width: 60,
          align: 'right',
          lineBreak: false
        });
      }
      rightY += 11;
    });

    // === QUALITÄTSMERKMALE TABELLE ===
    rightY += 10;
    doc.moveTo(rightColX, rightY).lineTo(rightColX + rightColWidth, rightY)
       .strokeColor(this.colors.secondary).lineWidth(0.5).stroke();
    rightY += 8;

    doc.font('Helvetica-Bold').fontSize(9).fillColor(this.colors.primary);
    doc.text('Qualitätsmerkmal', rightColX, rightY, { lineBreak: false });
    doc.text('Wert', rightColX + rightColWidth - 80, rightY, { width: 80, align: 'right', lineBreak: false });
    rightY += 14;

    // Qualitätsmerkmale aus technicalDetails
    const qualityItems = this.extractQualityItems(component, categoryTitle);

    doc.font('Helvetica').fontSize(8);
    qualityItems.forEach(item => {
      doc.fillColor(this.colors.text).text(item.label, rightColX, rightY, { lineBreak: false });
      // Wichtige Werte (U-Wert, SCOP) hervorheben
      if (item.highlight) {
        doc.font('Helvetica-Bold').fillColor(this.colors.gold);
      } else {
        doc.font('Helvetica').fillColor(this.colors.primary);
      }
      doc.text(item.value, rightColX + rightColWidth - 100, rightY, { width: 100, align: 'right', lineBreak: false });
      doc.font('Helvetica');
      rightY += 12;
    });

    // === PREMIUM-FEATURES BOX (volle Breite) ===
    y = Math.max(y + imgHeight + 15, rightY + 15);

    if (component.premiumFeatures && component.premiumFeatures.length > 0) {
      const boxHeight = Math.min(70, component.premiumFeatures.length * 14 + 20);

      doc.roundedRect(marginLeft, y, contentWidth, boxHeight, 4).fill(this.colors.goldLight);
      doc.rect(marginLeft, y, 3, boxHeight).fill(this.colors.gold);

      doc.font('Helvetica-Bold').fontSize(9).fillColor(this.colors.primary);
      doc.text('Ihre Vorteile bei Lehner Haus:', marginLeft + 12, y + 8);

      let featY = y + 22;
      const featColWidth = (contentWidth - 24) / 2;

      component.premiumFeatures.slice(0, 4).forEach((feature, idx) => {
        const colX = idx % 2 === 0 ? marginLeft + 12 : marginLeft + 12 + featColWidth;
        const rowY = featY + Math.floor(idx / 2) * 14;

        doc.font('Helvetica').fontSize(7.5).fillColor(this.colors.gold);
        doc.text('✓', colX, rowY, { lineBreak: false });
        doc.fillColor(this.colors.text);
        doc.text(feature.substring(0, 55) + (feature.length > 55 ? '...' : ''), colX + 10, rowY, {
          width: featColWidth - 15,
          lineBreak: false
        });
      });

      y += boxHeight + 10;
    }

    // === VORTEILE-LISTE (kompakt) ===
    if (component.advantages && component.advantages.length > 0 && y < 620) {
      doc.font('Helvetica-Bold').fontSize(9).fillColor(this.colors.primary);
      doc.text('Weitere Vorteile:', marginLeft, y);
      y += 14;

      const advColWidth = contentWidth / 2;
      component.advantages.slice(0, 6).forEach((adv, idx) => {
        const colX = idx % 2 === 0 ? marginLeft : marginLeft + advColWidth;
        const rowY = y + Math.floor(idx / 2) * 12;

        doc.font('Helvetica').fontSize(7.5).fillColor(this.colors.gold);
        doc.text('•', colX, rowY, { lineBreak: false });
        doc.fillColor(this.colors.textLight);
        doc.text(adv.substring(0, 50) + (adv.length > 50 ? '...' : ''), colX + 8, rowY, {
          width: advColWidth - 15,
          lineBreak: false
        });
      });

      y += Math.ceil(Math.min(6, component.advantages.length) / 2) * 12 + 10;
    }

    // === VERGLEICHS-HINWEIS BOX (wenn Platz) ===
    if (component.comparisonNotes && y < 700) {
      const remainingHeight = 770 - y;
      const boxHeight = Math.min(remainingHeight - 10, 80);

      doc.roundedRect(marginLeft, y, contentWidth, boxHeight, 4)
         .strokeColor(this.colors.gold).lineWidth(1.5).stroke();
      doc.roundedRect(marginLeft, y, contentWidth, boxHeight, 4).fill('#fffef5');

      doc.font('Helvetica-Bold').fontSize(8).fillColor(this.colors.gold);
      doc.text('💡 Tipp für den Anbietervergleich:', marginLeft + 10, y + 8);

      // Ersten relevanten Satz extrahieren
      const firstTip = component.comparisonNotes.split('\n')[0].replace(/❗|KRITISCHE FRAGEN.*:/g, '').trim();
      doc.font('Helvetica').fontSize(7.5).fillColor(this.colors.text);
      doc.text(firstTip.substring(0, 200) + (firstTip.length > 200 ? '...' : ''),
        marginLeft + 10, y + 22, { width: contentWidth - 20, lineGap: 1 });
    }
  }

  // Hilfsmethode: Aufbau-Schichten extrahieren (ELK-Style)
  extractAufbauItems(component, categoryTitle) {
    // Wenn component.layers definiert ist, diese direkt verwenden (ELK-Style)
    if (component.layers && component.layers.length > 0) {
      return component.layers.map(layer => ({
        name: layer.name,
        value: layer.value || '',
        note: layer.note || ''
      }));
    }

    // Fallback: Aus technicalDetails extrahieren
    const items = [];
    const td = component.technicalDetails || {};

    // Je nach Kategorie unterschiedliche Aufbau-Struktur
    if (categoryTitle.includes('Außenwand') || categoryTitle.includes('wand')) {
      if (td.insulation) items.push({ name: 'Wärmedämmung', value: td.insulation.match(/\d+\s*mm/)?.[0] || td.insulation });
      if (td.wallThickness) items.push({ name: 'Wandstärke gesamt', value: td.wallThickness });
      if (td.fireRating) items.push({ name: 'Brandschutz', value: td.fireRating.split(' ')[0] });
      if (component.constructionType) items.push({ name: 'Bauweise', value: component.constructionType });
    } else if (categoryTitle.includes('Innenwand')) {
      if (td.wallThickness) items.push({ name: 'Wandstärke', value: td.wallThickness });
      if (td.soundInsulation) items.push({ name: 'Schallschutz', value: td.soundInsulation });
      if (td.plasterThickness) items.push({ name: 'Beplankung', value: td.plasterThickness });
    } else if (categoryTitle.includes('Decke')) {
      if (td.construction) items.push({ name: 'Konstruktion', value: '' });
      if (td.soundInsulation) items.push({ name: 'Trittschall', value: td.soundInsulation });
      if (td.loadCapacity) items.push({ name: 'Tragfähigkeit', value: td.loadCapacity });
    } else if (categoryTitle.includes('Fenster')) {
      if (td.glazing) items.push({ name: 'Verglasung', value: '' });
      if (td.profile) items.push({ name: 'Profil', value: '' });
      if (td.securityFeatures) items.push({ name: 'Sicherheit', value: 'RC2' });
    } else if (categoryTitle.includes('Dach')) {
      if (td.material) items.push({ name: 'Material', value: td.material });
      if (td.surface) items.push({ name: 'Oberfläche', value: td.surface });
      if (td.weight) items.push({ name: 'Gewicht', value: td.weight });
    } else if (categoryTitle.includes('Heizung')) {
      if (td.refrigerant) items.push({ name: 'Kältemittel', value: td.refrigerant.split(' ')[0] });
      if (td.noise) items.push({ name: 'Schallpegel', value: td.noise });
    } else if (categoryTitle.includes('Lüftung')) {
      if (td.heatRecovery) items.push({ name: 'Wärmerückgewinnung', value: td.heatRecovery });
      if (td.filters) items.push({ name: 'Filter', value: td.filters });
      if (td.energySaving) items.push({ name: 'Energieeinsparung', value: td.energySaving });
    }

    // Fallback: Alle technischen Details hinzufügen wenn Liste leer
    if (items.length === 0 && td) {
      Object.entries(td).slice(0, 5).forEach(([key, value]) => {
        items.push({ name: key, value: String(value).substring(0, 30) });
      });
    }

    return items;
  }

  // Hilfsmethode: Qualitätsmerkmale extrahieren
  extractQualityItems(component, categoryTitle) {
    const items = [];
    const td = component.technicalDetails || {};

    // Hauptqualitätsmerkmale je nach Kategorie
    if (td.uValue) {
      items.push({ label: 'Wärmedämmwert (U)', value: td.uValue, highlight: true });
    }
    if (td.ugValue) {
      items.push({ label: 'Glaswert (Ug)', value: td.ugValue, highlight: true });
    }
    if (td.fireRating) {
      items.push({ label: 'Feuerwiderstandsklasse', value: td.fireRating.includes('F90') ? 'min. (R)EI 90' : td.fireRating });
    }
    if (td.soundInsulation) {
      items.push({ label: 'Schallschutz', value: td.soundInsulation });
    }
    if (td.scop) {
      items.push({ label: 'SCOP (Effizienz)', value: td.scop, highlight: true });
    }
    if (td.heatRecovery) {
      items.push({ label: 'Wärmerückgewinnung', value: td.heatRecovery, highlight: true });
    }
    if (td.lifespan) {
      items.push({ label: 'Lebensdauer', value: td.lifespan });
    }
    if (td.position) {
      items.push({ label: 'Position', value: td.position });
    }

    return items.slice(0, 4); // Max 4 Qualitätsmerkmale
  }

  // Spezielle Haustyp-Seite im Flyer-Stil
  drawHaustypPage(doc, component) {
    const marginLeft = 50;
    const contentWidth = 495;

    // === GROSSES HAUSBILD (oben) ===
    const imgPath = component.filePath ? path.join(__dirname, '../..', component.filePath) : null;

    if (imgPath && fs.existsSync(imgPath)) {
      try {
        // Bild über fast die gesamte Breite
        doc.image(imgPath, marginLeft, 95, { fit: [contentWidth, 280] });
      } catch (e) {
        this.drawImagePlaceholder(doc, marginLeft, 95, contentWidth, 280, 'Haustyp');
      }
    } else {
      this.drawImagePlaceholder(doc, marginLeft, 95, contentWidth, 280, 'Haustyp');
    }

    let y = 390;

    // === "MADE BEI LEHNER HAUS" Badge ===
    doc.roundedRect(marginLeft, y, 180, 35, 4).fill(this.colors.primary);
    doc.font('Helvetica-Bold').fontSize(14).fillColor(this.colors.white);
    doc.text('MADE BEI', marginLeft + 10, y + 5, { lineBreak: false });
    doc.font('Helvetica-Bold').fontSize(12).fillColor(this.colors.gold);
    doc.text('LEHNER HAUS', marginLeft + 10, y + 20, { lineBreak: false });

    // Haustyp-Name rechts daneben
    doc.font('Helvetica-Bold').fontSize(22).fillColor(this.colors.primary);
    doc.text(component.name.toUpperCase(), marginLeft + 200, y + 8, { width: contentWidth - 200 });

    y += 50;

    // === Beschreibung ===
    doc.font('Helvetica').fontSize(10).fillColor(this.colors.text);
    const desc = component.details || component.description || '';
    doc.text(desc, marginLeft, y, { width: contentWidth, lineGap: 2 });

    y += 60;

    // === Vorteile Grid (2 Spalten) ===
    if (component.advantages && component.advantages.length > 0) {
      doc.font('Helvetica-Bold').fontSize(11).fillColor(this.colors.primary);
      doc.text('Ihre Vorteile mit diesem Haustyp:', marginLeft, y);
      y += 20;

      const colWidth = contentWidth / 2;
      component.advantages.forEach((adv, idx) => {
        const colX = idx % 2 === 0 ? marginLeft : marginLeft + colWidth;
        const rowY = y + Math.floor(idx / 2) * 18;

        doc.font('Helvetica').fontSize(9).fillColor(this.colors.gold);
        doc.text('✓', colX, rowY, { lineBreak: false });
        doc.fillColor(this.colors.text);
        doc.text(adv, colX + 12, rowY, { width: colWidth - 20 });
      });

      y += Math.ceil(component.advantages.length / 2) * 18 + 15;
    }

    // === Lehner Haus Qualitäts-Badge ===
    if (y < 720) {
      doc.roundedRect(marginLeft, y, contentWidth, 55, 6).fill(this.colors.goldLight);
      doc.rect(marginLeft, y, 4, 55).fill(this.colors.gold);

      doc.font('Helvetica-Bold').fontSize(10).fillColor(this.colors.primary);
      doc.text('100% individuelle Grundrissgestaltung', marginLeft + 15, y + 10);

      doc.font('Helvetica').fontSize(9).fillColor(this.colors.text);
      doc.text('Bei Lehner Haus sind Sie nicht an Katalog-Grundrisse gebunden. Ihr Traumhaus wird nach Ihren Wünschen geplant – schwäbisch gut seit über 60 Jahren.',
        marginLeft + 15, y + 28, { width: contentWidth - 30, lineGap: 1 });
    }
  }

  // NEU: U-Wert Bar-Chart Infografik
  drawUValueBarChart(doc, x, y, uValue, maxWidth) {
    const chartWidth = Math.min(200, maxWidth - 20);
    const barHeight = 12;
    const maxU = 0.50; // Skala bis 0,5 W/(m²K)

    doc.font('Helvetica-Bold').fontSize(8).fillColor(this.colors.primary);
    doc.text('U-Wert-Vergleich:', x, y, { lineBreak: false });
    y += 14;

    // Ihr Wert (Gold)
    const uValueNum = parseFloat(uValue.toString().replace(',', '.'));
    const yourBar = Math.min(1, uValueNum / maxU) * chartWidth;

    doc.font('Helvetica').fontSize(7).fillColor(this.colors.textMuted);
    doc.text(`Ihr Wert: ${uValue}`, x + 5, y + 2, { lineBreak: false });

    doc.rect(x + 5, y + 12, yourBar, barHeight).fill(this.colors.gold);
    doc.font('Helvetica-Bold').fontSize(7).fillColor(this.colors.gold);
    doc.text('★ Exzellent', x + 10 + yourBar, y + 14, { lineBreak: false });

    // Standard (0,24)
    y += 22;
    doc.font('Helvetica').fontSize(7).fillColor(this.colors.textMuted);
    doc.text('Standard: 0,24', x + 5, y + 2, { lineBreak: false });
    const stdBar = (0.24 / maxU) * chartWidth;
    doc.rect(x + 5, y + 12, stdBar, barHeight).fill('#95a5a6');

    // Minimum (0,40)
    y += 22;
    doc.text('Minimum: 0,40', x + 5, y + 2, { lineBreak: false });
    const minBar = (0.40 / maxU) * chartWidth;
    doc.rect(x + 5, y + 12, minBar, barHeight).fill('#cccccc');

    return y + 28;
  }

  // NEU: SCOP-Gauge Infografik (Halbkreis)
  drawSCOPGauge(doc, x, y, scop) {
    const centerX = x + 100;
    const centerY = y + 55;
    const radius = 45;

    // Hintergrund-Bogen (Grau)
    doc.save();
    doc.arc(centerX, centerY, radius, Math.PI, 0, false)
       .lineWidth(8)
       .strokeColor('#e0e0e0')
       .stroke();

    // SCOP-Wert Bogen (Gold) - Max SCOP 6
    const scopNum = parseFloat(scop.toString().replace(',', '.'));
    const scopAngle = Math.PI * Math.min(1, scopNum / 6);
    doc.arc(centerX, centerY, radius, Math.PI, Math.PI + scopAngle, false)
       .lineWidth(8)
       .strokeColor(this.colors.gold)
       .stroke();
    doc.restore();

    // SCOP-Wert in der Mitte
    doc.font('Helvetica-Bold').fontSize(16).fillColor(this.colors.primary);
    doc.text(`SCOP ${scop}`, centerX - 28, centerY - 8, { width: 56, align: 'center' });

    // Sterne
    const stars = '★'.repeat(Math.min(5, Math.round(scopNum)));
    doc.fontSize(10).fillColor(this.colors.gold);
    doc.text(stars, centerX - 28, centerY + 10, { width: 56, align: 'center' });

    // Label
    doc.font('Helvetica').fontSize(7).fillColor(this.colors.textMuted);
    doc.text('Energieeffizienz: Exzellent', centerX - 45, centerY + 30, { width: 90, align: 'center' });

    return y + 110;
  }

  // NEU: QR-Code Generator
  async drawQRCode(doc, x, y, url, label) {
    try {
      // QR-Code als Data URL generieren
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 100,
        margin: 1,
        color: { dark: this.colors.primary, light: '#ffffff' }
      });

      // Als Bild einbetten
      doc.image(qrDataUrl, x, y, { width: 80, height: 80 });

      // Label
      doc.font('Helvetica').fontSize(7).fillColor(this.colors.textMuted);
      doc.text(label, x, y + 85, { width: 80, align: 'center' });
    } catch (e) {
      console.error('[PDF] QR-Code Fehler:', e);
      // Fallback: Link als Text
      doc.font('Helvetica').fontSize(7).fillColor(this.colors.textLight);
      doc.text(url, x, y, { width: 80 });
    }
  }

  async drawFinalContent(doc, submission) {
    let y = 100;

    doc.font('Helvetica').fontSize(11).fillColor(this.colors.textLight);
    doc.text('Vielen Dank für Ihr Interesse an Lehner Haus.', 80, y, { lineBreak: false });

    y += 35;
    doc.font('Helvetica-Bold').fontSize(12).fillColor(this.colors.primary);
    doc.text('So geht es weiter:', 80, y, { lineBreak: false });

    y += 25;
    const steps = [
      'Persönliches Beratungsgespräch',
      'Besichtigung unserer Musterhäuser',
      'Gespräch mit Bauherren-Referenzen',
      'Detaillierte Kostenaufstellung',
      'Erstellung Ihres Angebots'
    ];

    doc.font('Helvetica').fontSize(10).fillColor(this.colors.textLight);
    steps.forEach((step, i) => {
      doc.text(`${i + 1}. ${step}`, 90, y, { lineBreak: false });
      y += 18;
    });

    // NEU: Bedarfsanalyse-Box
    y += 25;
    doc.roundedRect(60, y, 475, 100, 8).fill(this.colors.goldLight);
    doc.rect(60, y, 4, 100).fill(this.colors.gold);

    doc.font('Helvetica-Bold').fontSize(13).fillColor(this.colors.primary);
    doc.text('Ihr nächster Schritt: Persönliche Bedarfsanalyse', 80, y + 12, { lineBreak: false });

    doc.font('Helvetica').fontSize(10).fillColor(this.colors.text);
    doc.text('In einem persönlichen Gespräch erfassen wir gemeinsam:', 80, y + 32, { lineBreak: false });

    const bedarfsItems = [
      'Ihre Wünsche und Vorstellungen für Ihr Traumhaus',
      'Finanzielle Rahmenbedingungen und Fördermöglichkeiten',
      'Grundstückssituation und baurechtliche Gegebenheiten',
      'Zeitplanung und Ihre persönlichen Prioritäten'
    ];

    bedarfsItems.forEach((item, i) => {
      doc.fillColor(this.colors.gold).text('•', 90, y + 48 + (i * 12), { lineBreak: false });
      doc.fillColor(this.colors.text).text(item, 100, y + 48 + (i * 12), { lineBreak: false });
    });

    // Kontakt-Box
    y += 125;
    doc.roundedRect(60, y, 475, 90, 8).fill(this.colors.primary);

    doc.font('Helvetica-Bold').fontSize(13).fillColor(this.colors.white);
    doc.text('Ihr Ansprechpartner', 80, y + 12, { lineBreak: false });

    doc.font('Helvetica').fontSize(10).fillColor(this.colors.white);
    doc.text('Lehner Haus GmbH & Co. KG', 80, y + 35, { lineBreak: false });
    doc.text('Telefon: +49 (0) 7331 20 88 - 0', 80, y + 50, { lineBreak: false });
    doc.text('E-Mail: info@lehner-haus.de', 80, y + 65, { lineBreak: false });

    // Gold accent on contact box
    doc.rect(530, y + 10, 4, 70).fill(this.colors.gold);

    // QR-Codes (3 nebeneinander)
    y += 110;
    doc.font('Helvetica-Bold').fontSize(11).fillColor(this.colors.primary);
    doc.text('Schnellzugriff:', 80, y, { lineBreak: false });

    y += 20;

    // QR-Code 1: Website
    await this.drawQRCode(doc, 100, y, 'https://www.lehner-haus.de', 'Website besuchen');

    // QR-Code 2: E-Mail
    await this.drawQRCode(doc, 220, y, 'mailto:info@lehner-haus.de', 'E-Mail senden');

    // QR-Code 3: Telefon
    await this.drawQRCode(doc, 340, y, 'tel:+4973312088', 'Anrufen');
  }

  drawComparisonChecklist(doc) {
    let y = 95;

    doc.font('Helvetica').fontSize(10).fillColor(this.colors.text);
    doc.text('Nutzen Sie diese Checkliste, um Fertighausanbieter objektiv zu vergleichen:', 80, y, { lineBreak: false });

    y += 25;

    const checklistItems = [
      ['Innenbeplankung', 'Fermacell/Gipsfaser oder nur OSB? (Festigkeit, Brandschutz!)'],
      ['Holzwerkstoffe', 'ESB oder OSB? ESB ist wohngesund, OSB kann ausgasen.'],
      ['U-Wert Außenwand', 'Exakter Wert? 0,15 W/(m²K) oder schlechter? Je niedriger, desto besser!'],
      ['Dämmstärke', 'Wie viele mm Mineralwolle? Welches Material? (PU brennt giftig!)'],
      ['Schallschutz', 'Konkrete dB-Werte? BASIS (47-49 dB) oder BASIS+ (52-55 dB)?'],
      ['Fenster Ug-Wert', '3-fach Verglasung mit 0,5 W/(m²K) oder schlechter?'],
      ['Fenster Profil', '6-Kammer-Profil oder weniger Kammern?'],
      ['Wärmepumpe SCOP', 'SCOP-Wert der Wärmepumpe? (Unter 4,0 = veraltet!)'],
      ['Kältemittel', 'R290 (zukunftssicher) oder R410A/R32 (wird verboten)?'],
      ['Qualitätszertifikat', 'QDF-Zertifizierung? RAL-Gütezeichen? Eigenüberwachung?'],
      ['Festpreis', 'Echte Festpreis-Garantie oder nur "Circa-Preis"?'],
      ['Referenzen', 'Können Sie mit Bauherren-Referenzen sprechen?']
    ];

    doc.font('Helvetica').fontSize(9);
    checklistItems.forEach(([topic, question], i) => {
      // Checkbox with gold border
      doc.rect(80, y, 10, 10).strokeColor(this.colors.gold).lineWidth(1.5).stroke();

      doc.font('Helvetica-Bold').fillColor(this.colors.primary);
      doc.text(topic + ':', 95, y, { lineBreak: false });

      doc.font('Helvetica').fillColor(this.colors.text);
      doc.text(question, 200, y, { width: 340, lineGap: 1 });

      y += 22;
    });

    // Warnhinweis-Box
    y += 10;
    doc.roundedRect(60, y, 475, 80, 8).fill(this.colors.errorLight);
    doc.rect(60, y, 4, 80).fill(this.colors.error);

    doc.font('Helvetica-Bold').fontSize(10).fillColor(this.colors.error);
    doc.text('Vorsicht bei diesen Warnsignalen:', 80, y + 10, { lineBreak: false });

    doc.font('Helvetica').fontSize(8).fillColor(this.colors.text);
    const warnings = [
      '• Extrem niedriger Preis ohne nachvollziehbare Kalkulation',
      '• Keine konkreten Antworten auf technische Fragen',
      '• Druck zum schnellen Vertragsabschluss',
      '• Keine QDF-Zertifizierung oder RAL-Gütezeichen',
      '• Keine Möglichkeit, mit Bauherren-Referenzen zu sprechen'
    ];
    warnings.forEach((w, i) => {
      doc.text(w, 80, y + 25 + (i * 10), { lineBreak: false });
    });

    // Lehner Haus Box
    y += 95;
    doc.roundedRect(60, y, 475, 45, 8).fill(this.colors.primary);
    doc.rect(530, y, 4, 45).fill(this.colors.gold);

    doc.font('Helvetica-Bold').fontSize(10).fillColor(this.colors.white);
    doc.text('Bei Lehner Haus können Sie jeden dieser Punkte mit "Ja" beantworten.', 80, y + 12, { lineBreak: false });
    doc.font('Helvetica').fontSize(9).fillColor(this.colors.white);
    doc.text('Überzeugen Sie sich selbst: Besuchen Sie uns im Musterhaus!', 80, y + 28, { lineBreak: false });
  }

  getGrundstueckText(status) {
    const map = { 'vorhanden': 'Vorhanden', 'in_aussicht': 'In Aussicht', 'suche': 'Auf der Suche' };
    return map[status] || status || '-';
  }

  drawFloorPlanPage(doc, submission) {
    let y = 100;

    // Info-Box: Gewähltes Innenwandsystem
    const innerwall = catalogService.getVariantById('innerwalls', submission.innerwall);
    if (innerwall) {
      doc.roundedRect(60, y, 475, 50, 8).fill(this.colors.goldLight);
      doc.rect(60, y, 4, 50).fill(this.colors.gold);

      doc.font('Helvetica-Bold').fontSize(10).fillColor(this.colors.primary);
      doc.text('Ihr Innenwandsystem:', 80, y + 10, { lineBreak: false });

      doc.font('Helvetica-Bold').fontSize(11).fillColor(this.colors.text);
      doc.text(innerwall.name, 80, y + 25, { lineBreak: false });

      // Tech-Details (falls vorhanden)
      if (innerwall.technicalDetails?.soundInsulation || innerwall.technicalDetails?.plasterThickness) {
        const techInfo = [
          innerwall.technicalDetails.plasterThickness,
          innerwall.technicalDetails.soundInsulation
        ].filter(Boolean).join(' | ');

        doc.font('Helvetica').fontSize(8).fillColor(this.colors.textLight);
        doc.text(techInfo, 280, y + 27, { lineBreak: false });
      }

      y += 65;
    }

    const rooms = submission.rooms || {};
    const floors = [
      { name: 'Erdgeschoss', rooms: rooms.erdgeschoss || [] },
      { name: 'Obergeschoss', rooms: rooms.obergeschoss || [] },
      { name: 'Untergeschoss', rooms: rooms.untergeschoss || [] }
    ].filter(floor => floor.rooms.length > 0);

    if (floors.length === 0) {
      doc.font('Helvetica').fontSize(10).fillColor(this.colors.textMuted);
      doc.text('Keine Räume definiert', 80, y);
      return;
    }

    floors.forEach((floor, floorIdx) => {
      if (floorIdx > 0) y += 40;

      // Floor title
      doc.font('Helvetica-Bold').fontSize(13).fillColor(this.colors.primary);
      doc.text(floor.name, 80, y, { lineBreak: false });
      y += 25;

      // Calculate layout grid
      const roomsPerRow = Math.min(3, floor.rooms.length);
      const roomWidth = 140;
      const roomHeight = 100;
      const gap = 15;
      const startX = 80;

      floor.rooms.forEach((room, idx) => {
        const row = Math.floor(idx / roomsPerRow);
        const col = idx % roomsPerRow;
        const rx = startX + col * (roomWidth + gap);
        const ry = y + row * (roomHeight + gap);

        // Validate finite coordinates
        if (!isFinite(rx) || !isFinite(ry)) return;

        // Outer wall (thick)
        doc.rect(rx, ry, roomWidth, roomHeight)
           .lineWidth(3)
           .strokeColor(this.colors.primary)
           .stroke();

        // Inner walls (thin) - vertikale Innenwände zwischen Spalten
        if (col < roomsPerRow - 1) {
          doc.moveTo(rx + roomWidth, ry)
             .lineTo(rx + roomWidth, ry + roomHeight)
             .lineWidth(1)
             .strokeColor(this.colors.textMuted)
             .stroke();
        }

        // Inner walls (thin) - horizontale Innenwände zwischen Reihen
        if (idx + roomsPerRow < floor.rooms.length) {
          doc.moveTo(rx, ry + roomHeight)
             .lineTo(rx + roomWidth, ry + roomHeight)
             .lineWidth(1)
             .strokeColor(this.colors.textMuted)
             .stroke();
        }

        // Room label
        const roomName = room.name || `Raum ${idx + 1}`;
        doc.font('Helvetica-Bold').fontSize(10).fillColor(this.colors.text);
        doc.text(roomName, rx + 5, ry + 5, { width: roomWidth - 10, align: 'center' });

        // Room details (if any)
        if (room.details && room.details.trim()) {
          doc.font('Helvetica').fontSize(8).fillColor(this.colors.textLight);
          doc.text(room.details, rx + 5, ry + 25, {
            width: roomWidth - 10,
            height: roomHeight - 30,
            align: 'left',
            lineGap: 1
          });
        }

        // Floor indicator
        doc.font('Helvetica').fontSize(7).fillColor(this.colors.textMuted);
        doc.text(`${Math.round(roomWidth * 0.3)}m²`, rx + 5, ry + roomHeight - 15, {
          width: roomWidth - 10,
          align: 'center'
        });
      });

      y += Math.ceil(floor.rooms.length / roomsPerRow) * (roomHeight + gap);
    });

    // Legend
    y += 30;
    doc.rect(80, y, 475, 50, 8).fill(this.colors.goldLight);

    doc.font('Helvetica-Bold').fontSize(9).fillColor(this.colors.primary);
    doc.text('Legende:', 90, y + 10, { lineBreak: false });

    doc.font('Helvetica').fontSize(8).fillColor(this.colors.text);
    doc.rect(90, y + 25, 20, 10).lineWidth(3).strokeColor(this.colors.primary).stroke();
    doc.text('Außenwände', 115, y + 25, { lineBreak: false });

    doc.rect(220, y + 25, 20, 10).lineWidth(1).strokeColor(this.colors.textMuted).stroke();
    doc.text('Innenwände', 245, y + 25, { lineBreak: false });

    doc.font('Helvetica').fontSize(7).fillColor(this.colors.textMuted);
    doc.text('Raumgrößen sind Schätzwerte. Finale Planung erfolgt im persönlichen Gespräch.', 90, y + 40, {
      width: 400
    });
  }

  drawImagePlaceholder(doc, x, y, width, height, category) {
    const placeholderColors = {
      'Außenwandsystem': '#2ecc71',      // Grün
      'Innenwandsystem': '#3498db',      // Blau
      'Fenstersystem': '#3498db',        // Blau
      'Dacheindeckung': '#95a5a6',       // Grau
      'Ihr Haustyp': '#9b59b6',          // Lila
      'Heizungssystem': '#e74c3c',       // Rot
      'Lüftungssystem': '#9b59b6'        // Lila
    };

    const color = placeholderColors[category] || '#95a5a6';

    // Farbiges Rechteck
    doc.rect(x, y, width, height).fill(color);

    // Weißer Rahmen
    doc.rect(x, y, width, height).strokeColor('#ffffff').lineWidth(2).stroke();

    // Text
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#ffffff');
    doc.text('Bild', x, y + height/2 - 10, { width: width, align: 'center' });
    doc.text('folgt', x, y + height/2 + 5, { width: width, align: 'center' });
  }
}

module.exports = new PdfService();
