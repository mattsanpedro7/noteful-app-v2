'use strict';

const express = require('express');
const router = express.Router();

const knex = require('../knex');
const { UNIQUE_VIOLATION } = require('pg-error-constants');

/* ========== GET/READ ALL TAGS ========== */
router.get('/folders', (req, res, next) => {
  knex.select('id', 'name')
    .from('folders')
    .then(results => {
      res.json(results);
    })
    .catch(next);
});

/* ========== GET/READ SINGLE TAGS ========== */
router.get('/folders/:id', (req, res, next) => {
  knex.select('id', 'name')
    .where('id', req.params.id)
    .from('folders')
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(next);
});

/* ========== POST/CREATE ITEM ========== */
router.post('/folders', (req, res, next) => {
  const { name } = req.body;

  /***** Never trust users. Validate input *****/
  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  const newItem = { name };

  knex.insert(newItem)
    .into('folders')
    .returning(['id', 'name'])
    .then(([result]) => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => {
      if (err.code === UNIQUE_VIOLATION && err.constraint === 'folders_name_key') {
        err = new Error('Folder name is already taken');
        err.status = 409;
      } 
      next(err);
    });
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/folders/:id', (req, res, next) => {
  const { name } = req.body;

  /***** Never trust users. Validate input *****/
  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  const updateItem = { name };

  knex('folders')
    .update(updateItem)
    .where('id', req.params.id)
    .returning(['id', 'name'])
    .then(([result]) => {
      if (result) {
        res.json(result);
      } else {
        next(); // fall-through to 404 handler
      }
    })
    .catch(err => {
      if (err.code === UNIQUE_VIOLATION && err.constraint === 'folders_name_key') {
        err = new Error('Folder name is already taken');
        err.status = 409;
      } 
      next(err);
    });
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/folders/:id', (req, res, next) => {
  knex.del()
    .where('id', req.params.id)
    .from('folders')
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