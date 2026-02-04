const express = require('express');
const router = express.Router();
const submissionService = require('../services/submissionService');

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const submission = await submissionService.getSubmission(id);

    if (!submission) {
      return res.status(404).send('Anfrage nicht gefunden');
    }

    res.render('result', { submission });

  } catch (error) {
    console.error('Fehler beim Laden der Ergebnisseite:', error);
    res.status(500).send('Ein Fehler ist aufgetreten');
  }
});

module.exports = router;
