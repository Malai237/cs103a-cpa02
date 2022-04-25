const express = require("express");
const path = require("path");  // to refer to local paths
const layouts = require("express-ejs-layouts");
const axios = require("axios")
const debug = require("debug")("personalapp:server"); 
// const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, './.env') });

// const options = {headers: {Accept: 'application/json', 'X-API-KEY': process.env.MORALIS_API_KEY}};
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const apiKey = process.env.alchemy_api;
// *********************************************************** //
//  Loading models
// *********************************************************** //
const WatchListItem = require("./models/TokenAddress")

// *********************************************************** //
//  Connecting to the database
// *********************************************************** //

const mongoose = require( 'mongoose' );
const mongodb_URI = process.env.mongo_db_uri;
//why isnt thist working
// const mongodb_URI = "mongodb+srv://malai:QlxZZTwUBvxn5XqT@cluster0.z1uwk.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"

mongoose.connect( mongodb_URI, { useNewUrlParser: true, useUnifiedTopology: true } );
// // fix deprecation warnings
// mongoose.set('useFindAndModify', false); 
// mongoose.set('useCreateIndex', true);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {console.log("we are connected!!!")});



// *********************************************************** //
// Initializing the Express server 
// This code is run once when the app is started and it creates
// a server that respond to requests by sending responses
// *********************************************************** //
const app = express();

// Here we specify that we will be using EJS as our view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// this allows us to use page layout for the views 
// so we don't have to repeat the headers and footers on every page ...
// the layout is in views/layout.ejs
app.use(layouts);

// Here we process the requests so they are easy to handle
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


// *********************************************************** //
//  Defining the routes the Express server will respond to
// *********************************************************** //


// specify that the server should render the views/index.ejs page for the root path
// and the index.ejs code will be wrapped in the views/layouts.ejs code which provides
// the headers and footers for all webpages generated by this app
app.get("/", (req, res, next) => {
  res.render("index");
});

app.get('/watchlist',
  async (req,res,next) => {
    try{
            //    console.log("YOOOO")
      let items = await WatchListItem.find({}); // lookup the user's todo items
      res.locals.items = items;  //make the items available in the view
      res.render("watchlist"); 
    } catch (e){
      next(e);
    }
})

app.get('/watchlist/:ownerAdd/:owner',
  async (req,res,next) => {
    try{
        const ownerName = req.params.owner;
        const ownerAddr = req.params.ownerAdd;
      //Do an axios call to the alchemy api and add the tokenaddress
        let nftsOwned = await axios.get(`https://eth-mainnet.alchemyapi.io/v2/${apiKey}/getNFTs/?owner=${ownerAddr}`);
        res.locals.ownerName = ownerName;
        res.locals.nftsOwned = nftsOwned;
        res.render("indv_watchlist");  // render to the toDo page
    } catch (e){
      next(e);
    }
})


app.post('/watchlist/add',

async (req,res,next) => {
try{
    const {tokenAddress,ownerName} = req.body; // get tokenAddress and ownerName from the body
    // const userId = res.locals.user._id; // get the user's id
    const createdAt = new Date(); // get the current date/time
    let data = {tokenAddress,ownerName, createdAt,} // create the data object
    let item = new WatchListItem(data) // create the database object (and test the types are correct)
    await item.save() // save the watchlist item in the database
    res.redirect('/watchlist')  // go back to the watchlist
} catch (e){
    next(e);
}
}
)

  app.get("/watchlist/delete/:itemId",
    async (req,res,next) => {
      try{
        const itemId=req.params.itemId; // get the id of the item to delete
        await WatchListItem.deleteOne({_id:itemId}) // remove that item from the database
        res.redirect('/watchlist') // go back to the watchlist page
      } catch (e){
        next(e);
      }
    }
  )


// *********************************************************** //
//  Starting up the server!
// *********************************************************** //
//Here we set the port to use between 1024 and 65535  (2^16-1)
const port = "5000";
app.set("port", port);

// and now we startup the server listening on that port
const http = require("http");
const server = http.createServer(app);

server.listen(process.env.PORT || 5000)
;

function onListening() {
  var addr = server.address();
  var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  debug("Listening on " + bind);
}

function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  var bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}

server.on("error", onError);

server.on("listening", onListening);

module.exports = app;