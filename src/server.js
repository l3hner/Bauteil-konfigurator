const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Disable view caching in development
if (process.env.NODE_ENV !== 'production') {
  app.set('view cache', false);
}

// Routes
const indexRouter = require('./routes/index');
const submitRouter = require('./routes/submit');
const resultRouter = require('./routes/result');
const pdfRouter = require('./routes/pdf');

app.use('/', indexRouter);
app.use('/submit', submitRouter);
app.use('/result', resultRouter);
app.use('/pdf', pdfRouter);

// Error handling
app.use((req, res) => {
  res.status(404).send('Seite nicht gefunden');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Ein Fehler ist aufgetreten');
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Lehner Konfigurator läuft auf http://localhost:${PORT}`);
  
  // Auto-open browser
  const open = require('child_process').exec;
  open(`xdg-open http://localhost:${PORT}`, (err) => {
    if (err) {
      console.log('Bitte öffnen Sie http://localhost:' + PORT + ' in Ihrem Browser');
    }
  });
});
