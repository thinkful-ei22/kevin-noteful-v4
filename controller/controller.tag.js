'use strict';

const mongoose = require('mongoose');

const Tag = require('../models/tag');
const Note = require('../models/note');

exports.getAllTagsHandler = (req, res, next) => {
  const userId = req.user.id;
  Tag.find({userId})
    .sort('name')
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      next(err);
    });
};

exports.getTagIdHandler = (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }
  
  Tag.findOne({_id: id, userId})
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

exports.postTagHandler = (req, res, next) => {
  const { name } = req.body;
  const userId = req.user.id;
  
  const newTag = { name, userId };
  
  /***** Never trust users - validate input *****/
  
  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }
  
  Tag.create(newTag)
    .then(result => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('Tag name already exists');
        err.status = 400;
      }
      next(err);
    });
};

exports.updateTagHandler = (req, res, next) => {
  const { id } = req.params;
  const { name } = req.body;
  const userId = req.user.id;
  
  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }
  
  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }
  
  const updateTag = { name };
  
  Tag.findOneAndUpdate({_id: id, userId}, updateTag, { new: true })
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('Tag name already exists');
        err.status = 400;
      }
      next(err);
    });
};

exports.deleteTagHandler = (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }
  
  const tagRemovePromise = Tag.findOneAndDelete({_id: id, userId});
  
  const noteUpdatePromise = Note.updateMany(
    { tags: id, },
    { $pull: { tags: id } }
  );
  
  Promise.all([tagRemovePromise, noteUpdatePromise])
    .then(results => {
      if(results[0]){
        res.sendStatus(204).end();
      }
      else{
        next();
      }
    })
    .catch(err => {
      next(err);
    });
  
};