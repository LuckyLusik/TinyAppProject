var express = require("express");
var cookieSession = require('cookie-session');
var app = express();
var PORT = 8080; // default port 8080
const bcrypt = require('bcrypt');
const bodyParser = require("body-parser");
console.log(__dirname + '/public');

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));
app.use(cookieSession({
  name: 'session',
  keys: ["TinyAppChernihiv"],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

//Database of short URLs
var urlDatabase = {
  "b2xVn2": {
    link: "www.lighthouselabs.ca",
    userID: "userRandomID",
  },
  "9sm5xK": {
    link: "www.google.com",
    userID: "user3RandomID",
  },
  "9sm566": {
    link: "www.twitter.com",
    userID: "user3RandomID",
  },
}

//Database of users
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10),
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 10),
  },
  "user3RandomID": {
    id: "user3RandomID",
    email: "user3@example.com",
    password: bcrypt.hashSync("nature", 10),
  },
}

//Check if email exist
function emailCheck(email){
  for (let userID in users) {
    if (users[userID].email === email){
      return userID;
    }
  }
  return false;
}

//Check if short URL exist
function linkCheck(link){
  for (let short in urlDatabase) {
    if (short === link){
      return true;
    }
  }
  return false;
}

//Create object with links for this user
function urlsForUser(id) {
  let userURLs = {};
  for (let varD in urlDatabase) {
    if (id === urlDatabase[varD].userID) {
      userURLs[varD] = urlDatabase[varD].link;
    }
  }
  return userURLs;
}

//Generate a random string 6 symbols long (letters and numbers)
function generateRandomString() {
  let randomStr = "";
  let numLet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 6; i++) {
    randomStr += numLet.charAt(Math.floor(Math.random() * numLet.length));
  }
  return randomStr;
}


//End points

//Check if user is not logged in and redirect him to login page
app.get("/login", (req, res) => {
  let userID = req.session.user_id;
  let userObj = users[userID];
  let templateVars = {
    userObj: userObj,
  }
  if (userObj){
    res.redirect("/urls");
  } else {
    res.render("login", templateVars);
  }
});

//Check if user entered full info and if user exist
app.post("/login", (req, res) => {
  let { email, password } = req.body;
  let userID = emailCheck(email);
  if (!email || !password) {
    res.status(400).send('Please, enter emaile and password!');
  } else {
      if (!userID) {
      res.status(403).send('This email is not in our list!');}
      else {
        if (!bcrypt.compareSync(password, users[userID].password)) {
          res.status(403).send('Something wrong with your password...');
      } else {
          req.session.user_id = userID;
          res.redirect("/urls");
      }
    }
  }
});

//Remove cookies when user is loging out
app.post("/logout", (req, res) => {
  let { user_id } = req.body;
  req.session = null;
  res.redirect("/urls");
});

//Delete URL from database if this user created it
app.post("/urls/:id/delete", (req, res) => {
  let userID = req.session.user_id;
  let userObj = users[userID];
  let id2 = req.params.id;
  let usURLs = urlsForUser(userID);
  if (urlDatabase[id2].userID === userObj.id) {
    let templateVars = {
    userObj: userObj,
    urls: usURLs };
    delete urlDatabase[id2];
    res.redirect("/urls");
  } else {
    res.status(403).send("You are not allowed to delete this record!");
  }
});

//Shortening a new URL
app.get("/urls/new", (req, res) => {
  let userID = req.session.user_id;
  let userObj = users[userID];
  if (!userObj){
    res.redirect("/login");
  } else {
    let templateVars = {
    userObj: userObj,
    urls: urlDatabase };
    res.render("urls_new", templateVars);
  }
});

//Display all URLs which belong to this user
app.get("/urls/:id", (req, res) => {
  let userID = req.session.user_id;
  let userObj = users[userID];
  let id2 = req.params.id;
  let usURLs = urlsForUser(userID);
  if (!userObj) {
    res.redirect("/login");
  } else {
    if (urlDatabase[id2].userID === userObj.id) {
      let templateVars = {
      userObj: userObj,
      shortURL: req.params.id,
      urls: usURLs };
      res.render("urls_show", templateVars);
    } else {
      res.status(403).send("You are not allowed to update this record!");
    }
  }
});

//Update long URL
app.post("/urls/:id", (req, res) => {
  let userID = req.session.user_id;
  let userObj = users[userID];
  let id2 = req.params.id;
  let usURLs = urlsForUser(userID);
  if (urlDatabase[id2].userID === userObj.id) {
    let templateVars = {
    userObj: userObj,
    urls: usURLs };
    urlDatabase[id2].link = req.body.longURL;
    res.redirect("/urls");
  } else {
    res.status(403).send("You are not allowed to update this record!");
  }
});

//Add a new short URL to database
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  let { longURL } = req.body;
  let userID = req.session.user_id;
  urlDatabase[shortURL] = { link: longURL, userID: userID  };
  res.redirect("/urls/" + shortURL);
});

//Display all URLs for this user
app.get("/urls", (req, res) => {
  let userID = req.session.user_id;
  let userObj = users[userID];
  let usURLs = urlsForUser(userID);
  let templateVars = {
    urls: usURLs,
    userObj: userObj,
  };
  res.render("urls_index", templateVars);
});

//Use a short URL
app.get("/u/:shortURL", (req, res) => {
  let shortU = req.params.shortURL;
  if (linkCheck(shortU)) {
    let longURL = urlDatabase[req.params.shortURL].link;
    res.redirect(`http://${longURL}`);
  } else {
    res.status(403).send("There is no links for you today...");
  }
});

//If user logged in go to list of URLs
app.get("/", (req, res) => {
  let userID = req.session.user_id;
  let userObj = users[userID];
  if (!userObj) {
    res.redirect("/login");
  } else {
    res.redirect("/urls");
  }
});
//Listen for PORT
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//Send a JSON response
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//Register a new user
app.get("/register", (req, res) => {
  let userID = req.session.user_id;
  let userObj = users[userID];
  let templateVars = {
    userObj: userObj,
  }
  res.render("register", templateVars);
});

//Create a new user if he doesn't exist
app.post("/register", (req, res) => {
  let { email, password } = req.body;
  let emailEx = emailCheck(email);
  if (!emailEx) {
    if (email && password) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      let userID = generateRandomString();
      users[userID] = {
        id: userID,
        email: email,
        password: hashedPassword,
      }
      req.session.user_id = userID;
      res.redirect("/urls");
    } else {
      res.status(400).send('Please, enter emaile and password!');
    }
  }
   else {
    res.status(400).send('This email already exist!');
  }
});

