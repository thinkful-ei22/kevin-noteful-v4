'use strict';
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const app = require('../server');
const User = require('../models/user');
const { TEST_MONGODB_URI } = require('../config');

chai.use(chaiHttp);
const expect = chai.expect;

describe('Noteful API - Users', function(){
  const fullname = 'Example Name';
  const username = 'exampleuser';
  const password = 'examplepass';
  before(function () {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });
    
  beforeEach(function () {
    return User.createIndexes();
  });
    
  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });
    
  after(function () {
    return mongoose.disconnect();
  });

  describe('/api/users', function(){
    describe('POST', function () {
      it('Should reject users with missing username', function () {
        return chai
          .request(app)
          .post('/api/users')
          .send({
            password,
            fullname
          })
          .then(function(res){
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('Validation Error');
            expect(res.body.message).to.equal('Missing username in request body');
            expect(res.body.location).to.equal('username');
          });
      });
      it('Should reject users with missing password', function () {
        return chai
          .request(app)
          .post('/api/users')
          .send({
            username,
            fullname
          })
          .then(function(res){
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('Validation Error');
            expect(res.body.message).to.equal('Missing password in request body');
            expect(res.body.location).to.equal('password');
          });
      });
      it('Should reject users with non-string username', function () {
        return chai
          .request(app)
          .post('/api/users')
          .send({
            username: 1234,
            password,
            fullname
          })
          .then(function(res){
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('Validation Error');
            expect(res.body.message).to.equal(
              'Incorrect field type: expected string'
            );
            expect(res.body.location).to.equal('username');
          });
      });
      it('Should reject users with non-string password', function () {
        return chai
          .request(app)
          .post('/api/users')
          .send({
            username,
            password: 1234,
            fullname
          })
          .then(function(res){
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('Validation Error');
            expect(res.body.message).to.equal(
              'Incorrect field type: expected string'
            );
            expect(res.body.location).to.equal('password');
          });
      });
      it('Should reject users with non-string full name', function () {
        return chai
          .request(app)
          .post('/api/users')
          .send({
            username,
            password,
            fullname: 1234
          })
          .then(function(res){
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('Validation Error');
            expect(res.body.message).to.equal(
              'Incorrect field type: expected string'
            );
            expect(res.body.location).to.equal('fullname');
          });
      });
    });
    it('Should reject users with non-trimmed username', function () {
      return chai
        .request(app)
        .post('/api/users')
        .send({
          username: ` ${username} `,
          password,
          fullname
        })
        .then(function(res){
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('Validation Error');
          expect(res.body.message).to.equal(
            'Cannot start or end with whitespace'
          );
          expect(res.body.location).to.equal('username');
        });
    });
    it('Should reject users with non-trimmed password', function () {
      return chai
        .request(app)
        .post('/api/users')
        .send({
          username,
          password: ` ${password} `,
          fullname
        })
        .then(function(res){
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('Validation Error');
          expect(res.body.message).to.equal(
            'Cannot start or end with whitespace'
          );
          expect(res.body.location).to.equal('password');
        });
    });
    it('Should reject users with empty username', function () {
      return chai
        .request(app)
        .post('/api/users')
        .send({
          username: '',
          password,
          fullname
        })
        .then(function(res){
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('Validation Error');
          expect(res.body.message).to.equal(
            'Must be at least 1 characters long'
          );
          expect(res.body.location).to.equal('username');
        });
    });
    it('Should reject users with password less than eight characters', function () {
      return chai
        .request(app)
        .post('/api/users')
        .send({
          username,
          password: '1234',
          fullname
        })
        .then(function(res){
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('Validation Error');
          expect(res.body.message).to.equal(
            'Must be at least 8 characters long'
          );
          expect(res.body.location).to.equal('password');
        });
    });
    it('Should reject users with password greater than 72 characters', function () {
      return chai
        .request(app)
        .post('/api/users')
        .send({
          username,
          password: new Array(73).fill('a').join(''),
          fullname
        })
        .then(function(res){
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('Validation Error');
          expect(res.body.message).to.equal(
            'Must be at most 72 characters long'
          );
          expect(res.body.location).to.equal('password');
        });
    });
    it('Should reject users with duplicate username', function () {
      // Create an initial user
      return User.create({
        username,
        password,
        fullname
      })
        .then(() =>
          // Try to create a second user with the same username
          chai.request(app).post('/api/users').send({
            username,
            password,
            fullname
          })
        )
        // .then(() =>
        //   expect.fail(null, null, 'Request should not succeed')
        // )
        // .catch(err => {
        //   if (err instanceof chai.AssertionError) {
        //     throw err;
        //   }
        .then(function(res){
          expect(res).to.have.status(422);
          expect(res.body.message).to.equal(
            'The username already exists' );
        });
    });
    it('Should create a new user', function () {
      return chai
        .request(app)
        .post('/api/users')
        .send({
          username,
          password,
          fullname
        })
        .then(res => {
          expect(res).to.have.status(201);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys(
            'username',
            'fullname',
            'id'
          );
          expect(res.body.username).to.equal(username);
          expect(res.body.fullname).to.equal(fullname);
          return User.findOne({
            username
          });
        })
        .then(user => {
          expect(user).to.not.be.null;
          expect(user.fullname).to.equal(fullname);
          return user.validatePassword(password);
        })
        .then(passwordIsCorrect => {
          expect(passwordIsCorrect).to.be.true;
        });
    });
    it('Should trim full name', function () {
      return chai
        .request(app)
        .post('/api/users')
        .send({
          username,
          password,
          fullname: ` ${fullname} `
        })
        .then(res => {
          expect(res).to.have.status(201);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys(
            'username',
            'fullname',
            'id'
          );
          expect(res.body.username).to.equal(username);
          expect(res.body.fullname).to.equal(fullname);
          return User.findOne({
            username
          });
        })
        .then(user => {
          expect(user).to.not.be.null;
          expect(user.fullname).to.equal(fullname);
        });
    });
  });
  
//   describe('GET', function () {
//     it('Should return an empty array initially', function () {
//       return chai.request(app).get('/api/users').then(res => {
//         expect(res).to.have.status(200);
//         expect(res.body).to.be.an('array');
//         expect(res.body).to.have.length(0);
//       });
//     });
//     it('Should return an array of users', function () {
//       return User.create(
//         {
//           username,
//           password,
//           fullname
//         },
//         {
//           username: usernameB,
//           password: passwordB,
//           firstName: fullnameB,
//         }
//       )
//         .then(() => chai.request(app).get('/api/users'))
//         .then(res => {
//           expect(res).to.have.status(200);
//           expect(res.body).to.be.an('array');
//           expect(res.body).to.have.length(2);
//           expect(res.body[0]).to.deep.equal({
//             username,
//             fullname
//           });
//           expect(res.body[1]).to.deep.equal({
//             username: usernameB,
//             firstName: firstNameB,
//             lastName: lastNameB
//           });
//         });
  // });
//   });
});


   