
const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app= express();
const port = process.env.PORT || 5000;
const uri = process.env.VITE_uri;

app.use(cors());
app.use(express.json());

const corsOptions = {
    origin: [
      "http://localhost:5173",
      "http://localhost:5000",
     
    ],
    credentials: true,
    optionSuccessStatus: 200,
  };

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const db = client.db("Chat");
    const usersCollection = db.collection("users");
     

    app.post("/users", async (req, res) => {
        try {
          const newUser = req.body;
      
          // Input validation 
          if (!newUser.email || !newUser.username) {
            res.status(400).send({message:"Invalid input"});
            return;
          }
      
          // Check if user already exists
          const findOldUser = await usersCollection.findOne({ email: newUser.email });
          if (findOldUser) {
            res.status(400).send({message:"User already exists"});
            return;
          }
      
          // Insert new user
          const result = await usersCollection.insertOne(newUser);
          res.status(201).send(result); // 201 Created
        } catch (error) {
          console.error("Error inserting user:", error);
          res.status(500).send("Internal Server Error");
        }
      });

    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
   // await client.db("admin").command({ ping: 1 });
    console.log("successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
app.listen(port, () => {
    console.log(`Chat server is running on port: ${port}`);
  });
  
run().catch(console.dir);
