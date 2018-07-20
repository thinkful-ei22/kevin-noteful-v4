'use strict';

const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');

const Note = require('../models/note');
const Folder = require('../models/folder');
const Tag = require('../models/tag');

const validateFolderId  = function (folderId, userId) {
  // console.log('======================', folderId === '');
  if (folderId === undefined) {
    return Promise.resolve();
  }
  
  // if(folderId === ''){
  //   const err = new Error ('You need a `folderId` name');
  //   err.status = 400;
  //   return Promise.reject(err);
  // }
  
  return Folder.count({_id: folderId, userId})
    .then(count => {
      console.log('ttttttttttttttttttttt', count);
      if(count === 0){
        const err = new Error ('This `folderId` is not valid');
        err.status = 400;
        return Promise.reject(err);
      }
    });
};

const validateTagId= function(tags =[], userId){
  if (!Array.isArray(tags)) {
    return Promise.resolve();
  }
  return Tag.find(
    {$and: 
        [{_id: {$in: tags}, userId}]
    })
    .then(result => {
      // console.log('111111111111111111111111111111', result);
      if(result.length !== tags.length){
        const err = new Error ('This `tagId` is not valid');
        err.status = 400;
        return Promise.reject(err);
      }
    });
};

exports.getAllNotesHandler = (req, res, next) => {
  const { searchTerm, folderId, tagId } = req.query;
  const userId = req.user.id;
  
  let filter = {userId};
  
  if (searchTerm) {
    const re = new RegExp(searchTerm, 'i');
    filter.$or = [{ 'title': re }, { 'content': re }];
  }
  
  if (folderId) {
    filter.folderId = folderId;
  }
  
  if (tagId) {
    filter.tags = tagId;
  }
  
  Note.find(filter)
    .populate('tags')
    .sort({'updatedAt': 'desc'})
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      next(err);
    });
};

exports.getNoteIdHandler = (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }
  
  Note.findOne({_id: id, userId})
    .populate('tags')
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
};

exports.postNoteHandler = (req, res, next) => {
  const { title, content, tags = []} = req.body;
  const userId = req.user.id;
  
  const folderId = req.body.folderId === '' ? undefined : req.body.folderId;
  /***** Never trust users - validate input *****/
  if (/* ( */folderId /* || folderId === '') */ && !mongoose.Types.ObjectId.isValid(folderId)) {
    const err = new Error('The `folderId` is not valid');
    err.status = 400;
    return next(err);
  }
  
  //   if(folderId === ' '){
  //     const err = new Error('The `folderId` needs a name');
  //     err.status = 400;
  //     return next(err);
  //   }
  
  // if (tags && !mongoose.Types.ObjectId.isValid(tags)) {
  //   const err = new Error('The `tagId` is not valid');
  //   err.status = 400;
  //   return Promise.reject(err);
  // }
  
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }
   
  if (tags) {
    tags.forEach((tag) => {
      if (!mongoose.Types.ObjectId.isValid(tag)) {
        // console.log('==================',tag);
        const err = new Error('The tags `id` is not valid');
        err.status = 400;
        return next(err);
      }
    });
  }
  const newNote = { title, content, tags, userId, folderId };
  Promise.all([
    validateFolderId(folderId, userId),
    validateTagId(tags, userId)
  ])
    .then(() => {
      return Note.create(newNote);
    })
    .then(result => {
      if(result){
        res
          .location(`${req.originalUrl}/${result.id}`)
          .status(201)
          .json(result);
      }
      else{
        next();
      }
    })
    .catch(err => {
      if (err === 'This `folderId` is not valid') {
        err = new Error('The `folderId` is not valid');
        err.status = 400;
      }
      if (err === 'This `tagId` is not valid') {
        err = new Error('This `tagId` is not valid');
        err.status = 400;
      }
      next(err);
    });
};

exports.updateNoteHandler = (req, res, next) => {
  const { id } = req.params;
  const { title, content, folderId, tags = [] } = req.body;
  const userId = req.user.id;
  
  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }
  
  if (title === '') {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }
  
  if (folderId && !mongoose.Types.ObjectId.isValid(folderId)) {
    const err = new Error('The `folderId` is not valid');
    err.status = 400;
    return next(err);
  }
  
  if (tags) {
    const badIds = tags.filter((tag) => !mongoose.Types.ObjectId.isValid(tag));
    if (badIds.length) {
      const err = new Error('The tags `id` is not valid');
      err.status = 400;
      return next(err);
    }
  }
  
  const updateNote = { title, content, folderId, tags };
  Promise.all([
    validateFolderId(folderId, userId),
    validateTagId(tags, userId)
  ])
    .then(() => {
      return Note.findOneAndUpdate({_id: id, userId}, updateNote, { new: true });
    })
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
};

exports.deleteNoteHandler = (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }
  
  Note.findOneAndDelete({_id: id, userId})
    .then(() => {
      res.sendStatus(204);
    })
    .catch(err => {
      next(err);
    });
};