const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const userSchema = new mongoose.Schema({
  username:String
});

const exerciseSchema = new mongoose.Schema({
  _id: String,
  description: String,
  duration: Number,
  date: String
});

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

app.use(bodyParser.urlencoded({ extended: false })); // Parses URL-encoded form data
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//create new user
app.post('/api/users',async(req,res)=>{
  try{
    var username = req.body.username;

    const newUser = new User({username: username});
    const savedUser = await newUser.save();
    res.json({username:savedUser.username, _id:savedUser._id.toString()});
  } catch(error){
    res.status(500).json({ error: 'Failed to create user' });
  }
});

//GET request to /api/users to get a list of all users.
app.get('/api/users',async(req,res)=>{
  var users = await User.find({}, 'username _id').exec();
  res.json(users);
});

//create new exercise
app.post('/api/users/:_id/exercises',async(req,res)=>{
  
  try{
    var userId = req.params._id;

    // get date fron form, if not available get today's date
    let date = req.body.date? new Date(req.body.date): new Date();
    date = date.toDateString();

    // create & save new exercise
    var newExercise = new Exercise({
      _id: userId,
      description: req.body.description,
      duration: req.body.duration,
      date:date
    });
    var savedExercise = await newExercise.save();

    var user = await User.findById(userId,'username');
    res.json({
      username: user.username,
      description: savedExercise.description,
      duration: savedExercise.duration,
      date:savedExercise.date,
      _id: savedExercise._id
    });
  }catch(error){
    res.status(500).json({ error: 'Failed to create exercise' });
  }
});

app.get('/api/users/:_id/logs', async(req,res)=>{
  try{
    console.log(req.query);
    const { _id } = req.params;
    var {from, to, limit} = req.query;
    var dateFilter = {};
    var filter = {_id};

    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to); 

    if(from || to) filter.date = dateFilter;

    // Query the user's logs
    let userLogs = await Exercise.find(filter)
    .sort({ date: 1 }) // Sort logs by date (ascending)
    .limit(parseInt(limit) || 0) // Apply limit if provided
    .select('description duration date'); // Select only relevant fields

    var user = await User.findById(_id);

    res.json({
      username: user.username,
      count: userLogs.length,
      _id: user._id,
      log: userLogs
    });

    console.log({
      username: user.username,
      count: userLogs.length,
      _id: user._id,
      log: userLogs
    });
  } catch (error){
    res.status(500).json({ error: 'Failed to log' });
  }

  
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
