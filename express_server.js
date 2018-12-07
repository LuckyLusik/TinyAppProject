var express = require("express");
var cookieParser = require('cookie-parser')
var app = express();
var PORT = 8080; // default port 8080
const bcrypt = require('bcrypt');

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.static(__dirname + '/public'));
console.log(__dirname + '/public');

var urlDatabase = {
  "b2xVn2": {
    link: "http://www.lighthouselabs.ca",
    userID: "userRandomID",
  },

  "9sm5xK": {
    link: "http://www.google.com",
    userID: "user3RandomID",
  },
  "9sm566": {
    link: "http://www.bigmir.com",
    userID: "user3RandomID",
  },
}

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  },
  "user3RandomID": {
    id: "user3RandomID",
    email: "user3@example.com",
    password: "nature"
  },
}

function emailCheck(email){
  for (let userID in users) {
    if (users[userID].email === email){
      return userID;
    }
  }
  return false;
}

app.get("/login", (req, res) => {
  let userID = req.cookies["user_id"];
  let userObj = users[userID];
  res.render("login", { userObj });
});

app.post("/login", (req, res) => {
  let { email, password } = req.body;
  let userID = emailCheck(email);
  if (!userID) {
    res.status(403).send('This email is not in our list!');}
    else {
      if (users[userID].password !== password) {
        res.status(403).send('Something wrong with your password...');
    }
  }
  res.cookie("user_id", userID);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  let { user_id } = req.body;
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
  let userIDC = req.cookies["user_id"];
  let userObj = users[userIDC];
  let id2 = req.params.id;
  if (urlDatabase[id2].userID === userObj.id) {
    let templateVars = {
    userObj: userObj,
    urls: urlDatabase };
    delete urlDatabase[id2];
    res.render("urls_index", templateVars);
  } else {
    res.status(403).send("You are not allowed to delete this record!");
  }

});


app.get("/urls/new", (req, res) => {
  let userID = req.cookies["user_id"];
  let userObj = users[userID];
  if (!userObj){
    res.render("login");
  } else {
    let templateVars = {
    userObj: userObj,
    urls: urlDatabase };
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:id", (req, res) => {
  let userID = req.cookies["user_id"];
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


app.post("/urls/:id", (req, res) => {
  let userID = req.cookies["user_id"];
  let userObj = users[userID];
  let id2 = req.params.id;
  let usURLs = urlsForUser(userID);
  if (urlDatabase[id2].userID === userObj.id) {
    let templateVars = {
    userObj: userObj,
    urls: sURLs };
    urlDatabase[id2].link = req.body.longURL;
    res.render("urls_index", templateVars);
    res.redirect("/urls");
  } else {
    res.status(403).send("You are not allowed to update this record!");
  }

});

function urlsForUser(id) {
  let userURLs = {};
  for (let varD in urlDatabase) {
    if (id === urlDatabase[varD].userID) {
      userURLs[varD] = urlDatabase[varD].link;
    }
  }
  return userURLs;
}

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  let { longURL } = req.body;
  let userID = req.cookies["user_id"];
  urlDatabase[shortURL] = { link: longURL, userID: userID  };
  //urlDatabase[shortURL].link = req.body.longURL;
  res.redirect("/urls/" + shortURL);         // Respond with 'Ok' (we will replace this)
});

app.get("/urls", (req, res) => {
  let userID = req.cookies["user_id"];
  let userObj = users[userID];
  let usURLs = urlsForUser(userID);
  let templateVars = {
    urls: usURLs,
    userObj: userObj,
  };
  res.render("urls_index", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].link;
  res.redirect(longURL);
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});


app.get("/register", (req, res) => {
  let userID = req.cookies["user_id"];
  let userObj = users[userID];
  res.render("register", { userObj });
});

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
      res.cookie("user_id", userID);
      res.redirect("/urls");
    } else {
      res.status(400).send('Please, enter emaile and password!');
    }
  }
   else {
    res.status(400).send('This email already exist!');
  }
});

function generateRandomString() {
  let randomStr = "";
  let numLet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 6; i++) {
    randomStr += numLet.charAt(Math.floor(Math.random() * numLet.length));
  }
  return randomStr;
}