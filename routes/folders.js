'use strict';

const express = require('express');
const passport = require('passport');

const {getAllFoldersHandler, getFolderIdHandler, 
  postFolderHandler, updateFolderHandler, deleteFolderHandler} = require('../controller/controller.folder');
const router = express.Router();

router.use('/', passport.authenticate('jwt', { session: false, failWithError: true }));


router.route('/')
  .get(getAllFoldersHandler)
  .post(postFolderHandler);

router.route('/:id')
  .get(getFolderIdHandler)
  .put(updateFolderHandler)
  .delete(deleteFolderHandler);

module.exports = router;
