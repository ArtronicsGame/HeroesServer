const Mongoose = require('mongoose');

const MongoDB = module.exports = {};

MongoDB.Users = require('./Queries/Users.js');
MongoDB.Clans = require('./Queries/Clans.js');
MongoDB.ControlPanel = require('./Queries/ControlPanel.js');

var url = "mongodb://heroesAdmin:a1saabvdsaab@localhost:46620/heroes";
Mongoose.set('useCreateIndex', true);
Mongoose.set('useFindAndModify', false);
Mongoose.connect(url, { useNewUrlParser: true }).then(() => console.log("Mongo connected")).catch(err => console.error("Couldn't connect to MongoDB", err));

