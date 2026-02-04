const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class SubmissionService {
  constructor() {
    this.submissionsDir = path.join(__dirname, '../../data/submissions');
  }

  async ensureSubmissionsDir() {
    try {
      await fs.mkdir(this.submissionsDir, { recursive: true });
    } catch (error) {
      console.error('Fehler beim Erstellen des Submissions-Ordners:', error);
    }
  }

  async saveSubmission(data) {
    await this.ensureSubmissionsDir();
    
    const id = uuidv4();
    const timestamp = new Date().toISOString();
    
    const submission = {
      id,
      timestamp,
      ...data
    };

    const filePath = path.join(this.submissionsDir, `${id}.json`);
    await fs.writeFile(filePath, JSON.stringify(submission, null, 2), 'utf8');
    
    return { id, submission };
  }

  async getSubmission(id) {
    // Sanitize ID
    const sanitizedId = id.replace(/[^a-zA-Z0-9-]/g, '');
    const filePath = path.join(this.submissionsDir, `${sanitizedId}.json`);
    
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Fehler beim Laden der Submission:', error);
      return null;
    }
  }

  async getAllSubmissions() {
    await this.ensureSubmissionsDir();
    
    try {
      const files = await fs.readdir(this.submissionsDir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      
      const submissions = await Promise.all(
        jsonFiles.map(async (file) => {
          const filePath = path.join(this.submissionsDir, file);
          const data = await fs.readFile(filePath, 'utf8');
          return JSON.parse(data);
        })
      );
      
      return submissions.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
    } catch (error) {
      console.error('Fehler beim Laden aller Submissions:', error);
      return [];
    }
  }

  parseRoomData(formData) {
    const rooms = {
      erdgeschoss: [],
      obergeschoss: [],
      untergeschoss: []
    };

    // Parse Erdgeschoss rooms
    if (formData.eg_rooms) {
      const egRooms = Array.isArray(formData.eg_rooms) 
        ? formData.eg_rooms 
        : [formData.eg_rooms];
      const egDetails = Array.isArray(formData.eg_details) 
        ? formData.eg_details 
        : [formData.eg_details];
      
      egRooms.forEach((room, index) => {
        if (room) {
          rooms.erdgeschoss.push({
            name: room,
            details: egDetails[index] || ''
          });
        }
      });
    }

    // Parse Obergeschoss rooms
    if (formData.og_rooms) {
      const ogRooms = Array.isArray(formData.og_rooms) 
        ? formData.og_rooms 
        : [formData.og_rooms];
      const ogDetails = Array.isArray(formData.og_details) 
        ? formData.og_details 
        : [formData.og_details];
      
      ogRooms.forEach((room, index) => {
        if (room) {
          rooms.obergeschoss.push({
            name: room,
            details: ogDetails[index] || ''
          });
        }
      });
    }

    // Parse Untergeschoss rooms
    if (formData.ug_rooms) {
      const ugRooms = Array.isArray(formData.ug_rooms) 
        ? formData.ug_rooms 
        : [formData.ug_rooms];
      const ugDetails = Array.isArray(formData.ug_details) 
        ? formData.ug_details 
        : [formData.ug_details];
      
      ugRooms.forEach((room, index) => {
        if (room) {
          rooms.untergeschoss.push({
            name: room,
            details: ugDetails[index] || ''
          });
        }
      });
    }

    return rooms;
  }

  parseEigenleistungen(formData) {
    const eigenleistungen = [];
    
    if (formData.eigenleistungen) {
      const leistungen = Array.isArray(formData.eigenleistungen) 
        ? formData.eigenleistungen 
        : [formData.eigenleistungen];
      
      leistungen.forEach(leistung => {
        if (leistung && leistung.trim()) {
          eigenleistungen.push(leistung.trim());
        }
      });
    }

    return eigenleistungen;
  }
}

module.exports = new SubmissionService();
