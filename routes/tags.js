'use strict';

const express = require('express');
const passport = require('passport');

const {getAllTagsHandler, getTagIdHandler, postTagHandler, updateTagHandler, deleteTagHandler} = require('../controller/controller.tag');

const router = express.Router();

router.use('/', passport.authenticate('jwt', { session: false, failWithError: true }));

router.route('/')
  .get(getAllTagsHandler)
  .post(postTagHandler);

router.route('/:id')
  .get(getTagIdHandler)
  .put(updateTagHandler)
  .delete(deleteTagHandler);

module.exports = router;