'use strict';

const express = require('express');
const morgan = require('morgan');

const { PORT } = require('./config');

const notesRouterV2 = require('./routes/notes.router');
const foldersRouterV2 = require('./routes/folders.router');
const tagsRouterV2 = require('./routes/tags.router');

// Create an Express application
const app = express();

// Log all requests. Skip logging during
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'common', {
  skip: () => process.env.NODE_ENV === 'test'
}));

// Create a static webserver
app.use(express.static('public'));

// Parse request body
app.use(express.json());

// Mount router on "/v2"
app.use('/v2', notesRouterV2);
app.use('/v2', foldersRouterV2);
app.use('/v2', tagsRouterV2);

// Catch-all 404
app.use(function (req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Catch-all Error handler
// Add NODE_ENV check to prevent stacktrace leak
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: app.get('env') === 'development' ? err : {}
  });
});

// Listen for incoming connections
app.listen(PORT, function () {
  console.info(`Server listening on ${this.address().port}`);
}).on('error', err => {
  console.error(err);
});
