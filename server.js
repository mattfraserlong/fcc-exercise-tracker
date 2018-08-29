//working version: https://github.com/npwilliams09/FCC-Back-End/blob/master/Excercise%20Tracker/server.js

//assign and require express, body parser, cors and mongoose
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const shortId = require('shortid');


//create mongoose schema for users and their data
var schema = new Schema({
    shortId: {type: String, unique: true, default: shortId.generate},
    userName: String,
    exercise: [{
      description: String,
      duration: Number,
      date: Date
    }],
});

//create mongoose model from schema
var User = mongoose.model('User', schema);

//connect to db
mongoose.connect(process.env.MLAB_URI, function(err) {
  if(err) {console.log("err");}
  console.log("connected to db ");
});


//cross-origin browsing middleware
app.use(cors())


/*----bodyParser middleware----*/
//body-parser extracts the entire body portion of an incoming request stream and exposes it on req.body as something easier to interface with
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


//allows app to access public static files
app.use(express.static('public'))
//with a req to / responds with views/index.html with any dependencies to public static files from line23.
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


/*----routes----*/

/*----post requests----*/

//route for posting new user to db
app.post('/api/exercise/new-user',function (req, res) {
  //check if user exists
  User.findOne({userName:req.body.userName}, function(err, findData){
    console.log(req.body.userName);
    if (findData == null){
      console.log("no dupe found");
          //if no dupe create instance of userInst, username only
        var userInst = new User(
          {userName : req.body.userName,
           exercise : []
          }
        );
    //save this instance to db with err handling
    userInst.save(function(err) {
      if(err) {
        console.log("err saving to db");
      } else {
      res.send(req.body.userName + " has been saved to db. <p><a href=\"https://fcc-exercise-tracker-ml.glitch.me\">Go Back</a></p>"); 
      console.log(req.body.userName + ' successfully saved.');
      }
    });
    } else {
      res.send(req.body.userName + " already exists. <p>Please enter a new username, or just enter an exercise for this user.</p><p><a href=\"https://fcc-exercise-tracker-ml.glitch.me\">Go Back</a></p>");
      console.log("that user already exists.")
    }
  });
});
  
//route for posting new exercise to db
app.post('/api/exercise/add',function (req, res) {
  if (req.body.description === "" || req.body.duration === "" || req.body.date === "") {
       res.send("All fields are required, please go back and try again.<p><a href=\"https://fcc-exercise-tracker-ml.glitch.me\">Go Back</a>");
      console.log("Missing fields");
    } else
  //try to find a posted userId to match shortId in document in collection User
  User.findOne({shortId:req.body.userId}, function(err, data){
    if (data === null) {
      console.log("Sorry, we could not find that user, please try again")
      res.send("Sorry, we could not find that user<p>Please try again.</p><p><a href=\"https://fcc-exercise-tracker-ml.glitch.me\">Go Back</a></p>")
    } else {
    //param data now has document selected with findOne
    //we add exercise object to document 
      var index = data.exercise.length;
      data.exercise[index] = {
          description : req.body.description,
          duration : req.body.duration,
          date : req.body.date
        }
    //then add object data.exercise to document with err handling
    data.save(function(err) {
      if(err) {
        console.log("err saving to db");
      } else {
      res.send("exercise for " + data.userName + " has been saved to db. <p><a href=\"https://fcc-exercise-tracker-ml.glitch.me\">Go Back</a></p>"); 
      console.log("exercise for " + data.userName + ' successfully saved.');
      }
    });
    }
  })
});

/*----get requests*/
app.get('/api/exercise/log/:userId', function(req,res) {
  
  User.findOne({shortId:req.params.userId}, function(err,data) {
    if (data == null){
      res.send({"error":"User not found"});
    }else{
      let results = data.exercise;
      
      let fromDate = new Date(req.query.from);
      let toDate = new Date(req.query.to);
      let limit = Number(req.query.limit);
      
      //check if to date is defined
      if (isValidDate(toDate)){ //why isn't the non arrow function stuff working here?
        results = results.filter(function (item) {
          return item.date >= fromDate && item.date <= toDate;
        });
      //check if from date is define THIS COMMENT IS WRONG
      } else if (isValidDate(fromDate)){
        results = results.filter(function (item) {
          return item.date >= fromDate;
        })
      }
      //apply limit if defined and applicable
      if (!isNaN(limit) && results.length > limit){
        results = results.slice(0,limit);
      }
      
      res.send({"exercise":results});
    }
  });
});



/*----end of routes----*/

/*----functions----*/

function isValidDate(d) {
  return d instanceof Date && !isNaN(d);
}


// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: '404 not found error'})
})


// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})




