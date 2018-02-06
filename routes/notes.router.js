'use strict';

const express = require('express');
const knex = require('../knex');

const router = express.Router();

/* ========== GET/READ ALL NOTES ========== */
router.get('/notes', (req, res, next) => {
  const searchTerm = req.query.searchTerm;

  knex.select('notes.id', 'title', 'content'
  ).from('notes')
    .where(function () {
      if (searchTerm) {
        this.where('title', 'like', `%${searchTerm}%`);
      }
    })
    .orderBy('notes.id')
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      console.error(err);
    });
});

/* ========== GET/READ SINGLE NOTES ========== */
router.get('/notes/:id', (req, res, next) => {
  const noteId = req.params.id;

  // 3 variations:
  //   - Array Item `res.json(result[0]);`
  //   - Array Destructuring `.then(([result]) => {...`
  //   - Use `.first()` instead of `.select()`

  knex.select('notes.id', 'title', 'content')
    .from('notes')
    .where('notes.id', noteId)
    .then(result => {
      if (result) {
        res.json(result[0]);
      } else {
        next(); // fall-through to 404 handler
      }
    })
    .catch(next);
});

/* ========== POST/CREATE ITEM ========== */
router.post('/notes', (req, res, next) => {
  const { title, content } = req.body;

  /***** Never trust users. Validate input *****/
  if (!req.body.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  const newItem = {
    title: title,
    content: content
  };

  knex.insert(newItem)
    .into('notes')
    .returning(['id', 'title', 'content'])
    .then(([result]) => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => {
      console.error(err);
    });
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/notes/:id', (req, res, next) => {
  const noteId = req.params.id;
  const { title, content } = req.body;

  /***** Never trust users. Validate input *****/
  if (!req.body.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  const updateItem = {
    title: title,
    content: content
  };

  knex('notes')
    .update(updateItem)
    .where('id', noteId)
    .returning(['id', 'title', 'content'])
    .then(([result]) => {
      res.json(result);
    })
    .catch(err => {
      console.error(err);
    });
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/notes/:id', (req, res, next) => {
  knex.del()
    .where('id', req.params.id)
    .from('notes')
    .then(count => {
      if (count) {
        res.status(204).end();
      } else {
        next(); // fall-through to 404 handler
      }
    })
    .catch(next);
});

module.exports = router;