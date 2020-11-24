require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express')
const cors = require('cors')
const multer = require('multer')
const upload = multer()
const fs = require( 'fs');
const jwt = require('jsonwebtoken');
const utils = require('./utils');

const app = express()
const port = process.env.PORT || 5000

const userData = {
  userId: "1",
  password: "123456",
  name: "Deon Swart",
  username: "Deon19",
  isAdmin: true
};

// any request coming in, transfer all body into JSON
app.use(express.json())

// allow cross origin from client localhost
app.use(cors())

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

// creating POST endpoint /file
app.post('/file', upload.single('file'), (req, res) => {
  console.log('body', req.file.length, req.file)
  var data = JSON.stringify(req.file)
  fs.writeFile('data.json', data,(err) =>
  {
    if(err) throw err;
    console.log("file has been written");
  })

  // here you can do anything that you want for the file
  // ex: you want to save it to database here

  res.json({ success: true })
})
app.use(function (req, res, next) {
  // check header or url parameters or post parameters for token
  var token = req.headers['authorization'];
  if (!token) return next(); //if no token, continue

  token = token.replace('Bearer ', '');
  jwt.verify(token, process.env.JWT_SECRET, function (err, user) {
    if (err) {
      return res.status(401).json({
        error: true,
        message: "Invalid user."
      });
    } else {
      req.user = user; //set the user to req so other routes can use it
      next();
    }
  });
});
app.get('/', (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Invalid user to access it.' });
  res.send('Welcome to the Node.js Tutorial! - ' + req.user.name);
});

app.post('/users/signin', function (req, res) {
  const user = req.body.username;
  const pwd = req.body.password;

  // return 400 status if username/password is not exist
  if (!user || !pwd) {
    return res.status(400).json({
      error: true,
      message: "Username or Password required."
    });
  }

  // return 401 status if the credential is not match.
  if (user !== userData.username || pwd !== userData.password) {
    return res.status(401).json({
      error: true,
      message: "Username or Password is Wrong."
    });
  }
    // generate token
    const token = utils.generateToken(userData);
    // get basic user details
    const userObj = utils.getCleanUser(userData);
    // return the token along with user details
    return res.json({ user: userObj, token });

});
app.get('/verifyToken', function (req, res) {
  // check header or url parameters or post parameters for token
  var token = req.body.token || req.query.token;
  if (!token) {
    return res.status(400).json({
      error: true,
      message: "Token is required."
    });
  }
  // check token that was passed by decoding token using secret
  jwt.verify(token, process.env.JWT_SECRET, function (err, user) {
    if (err) return res.status(401).json({
      error: true,
      message: "Invalid token."
    });

    // return 401 status if the userId does not match.
    if (user.userId !== userData.userId) {
      return res.status(401).json({
        error: true,
        message: "Invalid user."
      });
    }
    // get basic user details
    var userObj = utils.getCleanUser(userData);
    return res.json({ user: userObj, token });
  });
});
app.listen(port, () => {
  console.log('Server started on: ' + port);
});
