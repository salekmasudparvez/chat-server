const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5000"],
    methods: ["GET", "POST"]
  }
});

const port = process.env.PORT || 5000;
const uri = process.env.VITE_uri;

app.use(cors());
app.use(express.json());

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    console.log("Successfully connected to MongoDB!");
    
    const db = client.db("Chat");
    const usersCollection = db.collection("users");
    const messagesCollection = db.collection("messages");

    app.post("/users", async (req, res) => {
      try {
        const newUser = req.body;

        if (!newUser.email || !newUser.username) {
          res.status(400).send({ message: "Invalid input" });
          return;
        }

        const findOldUser = await usersCollection.findOne({ email: newUser.email });
        if (findOldUser) {
          res.status(400).send({ message: "User already exists" });
          return;
        }

        const result = await usersCollection.insertOne(newUser);
        res.status(201).send(result);
      } catch (error) {
        console.error("Error inserting user:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    io.on('connection', (socket) => {
      console.log('a user connected:', socket.id);
      
      socket.on('sendMessage', async (message) => {
        try {
          const result = await messagesCollection.insertOne(message);
          io.emit('receiveMessage', result.ops[0]);
        } catch (error) {
          console.error("Error sending message:", error);
        }
      });

      socket.on('disconnect', () => {
        console.log('user disconnected:', socket.id);
      });
    });

    server.listen(port, () => {
      console.log(`Chat server is running on port: ${port}`);
    });

  } catch (err) {
    console.error("Error running server:", err);
  }
}

run().catch(console.dir);
