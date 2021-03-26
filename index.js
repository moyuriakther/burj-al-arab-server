const express = require("express");
const cors = require("cors");
const bodyParser = require("body-Parser");
const admin = require("firebase-admin");
const MongoClient = require("mongodb").MongoClient;

require('dotenv').config()
console.log(process.env.DB_USER)
const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.u5uel.mongodb.net/burjAlArab?retryWrites=true&w=majority`;
const port = 4000;

const app = express();

var serviceAccount = require("./config/burj-al-arab-cc6b6-firebase-adminsdk-b9zvo-f8be152420.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});


app.use(cors());
app.use(bodyParser.json());



const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const collection = client.db("burjAlArab").collection("bookings");

  app.post("/addBooking", (req, res) => {
    const newBooking = req.body;
    collection.insertOne(newBooking).then((result) => {
      res.send(result.insertedCount > 0);
    });
    // console.log(newBooking);
  });

  app.get("/bookings", (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith("Bearer ")) {
      const idToken = bearer.split(" ")[1];
      console.log({ idToken });
      // idToken comes from the client app
      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          console.log(tokenEmail, queryEmail);
          if (tokenEmail == queryEmail) {
            collection.find({ email: queryEmail }).toArray((err, document) => {
              res.send(document);
            });
          }
          else{
            res.status(401).send('un-authorized access')
          }
        })
        .catch((error) => {
          // Handle error
          res.status(401).send('un-authorized access')
        });
    } else {
      res.status(401).send('un-authorized access')
    }
  });
});
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port);
