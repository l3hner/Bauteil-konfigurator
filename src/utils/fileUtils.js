const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Berechnet den SHA256-Hash einer Datei
 */
function getFileHash(filePath) {
    try {
        const content = fs.readFileSync(filePath);
        return crypto.createHash('sha256').update(content).digest('hex');
    } catch (err) {
        console.error(`[HASH] Fehler bei ${filePath}:`, err.message);
        return 'HASH_ERROR';
    }
}

/**
 * Prüft ob ein Pfad sicher innerhalb eines Basisverzeichnisses liegt
 * Verhindert Path-Traversal-Angriffe
 */
function isPathSafe(targetPath, basePath) {
    const resolvedTarget = path.resolve(targetPath);
    const resolvedBase = path.resolve(basePath);

    // Normalize to handle Windows/Unix differences
    const normalizedTarget = resolvedTarget.toLowerCase().replace(/\\/g, '/');
    const normalizedBase = resolvedBase.toLowerCase().replace(/\\/g, '/');

    return normalizedTarget.startsWith(normalizedBase + '/') || normalizedTarget === normalizedBase;
}

/**
 * Gibt die Dateiendung zurück (mit Punkt, lowercase)
 */
function getFileExtension(filePath) {
    return path.extname(filePath).toLowerCase();
}

/**
 * Prüft ob eine Datei existiert und lesbar ist
 */
function fileExists(filePath) {
    try {
        fs.accessSync(filePath, fs.constants.R_OK);
        return true;
    } catch {
        return false;
    }
}

module.exports = {
    getFileHash,
    isPathSafe,
    getFileExtension,
    fileExists
};
