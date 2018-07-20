'use strict';

const express = require('express');
const passport = require('passport');

const {getAllNotesHandler, getNoteIdHandler, postNoteHandler, updateNoteHandler, deleteNoteHandler} = require('../controller/controller.note');

const router = express.Router();

router.use('/', passport.authenticate('jwt', { session: false, failWithError: true }));

router.route('/')
  .get(getAllNotesHandler)
  .post(postNoteHandler);

router.route('/:id')
  .get(getNoteIdHandler)
  .put(updateNoteHandler)
  .delete(deleteNoteHandler);

module.exports = router;