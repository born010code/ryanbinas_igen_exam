const express = require('express');
const app = express();
const router = express.Router();
// const bodyParser = require('body-parser');
// const expressValidator = require('express-validator');
// const path    = require("path");
const port = process.env.PORT || 3000;

// app.use(bodyParser.json()); // support json encoded bodies
// app.use(bodyParser.urlencoded({ extended: false })); // support encoded bodies

app.use(express.urlencoded({ extended: false }));
app.use(express.json());


// app.use(expressValidator);
app.use(require('trim-request-body'));


// Routes
const treasures = require('./controllers/treasures');
app.use('/treasures', treasures);



app.listen(port, function () {
	console.log('\x1b[33m%s\x1b[0m', '** Express Development is listening on localhost:'+port+', open your browser on http://localhost:'+port+' **');
});

