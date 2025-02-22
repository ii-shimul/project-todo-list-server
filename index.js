require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const port = process.env.PORT || 5000;
const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "https://taskflow---todo-app.web.app"],
  })
);
app.use(express.json());
app.use(cookieParser());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.db_user}:${process.env.user_pass}@cluster0.dbupn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const userCollection = client.db("TaskFlow").collection("users");
    const taskCollection = client.db("TaskFlow").collection("tasks");

    //! users api
    app.post("/users", async (req, res) => {
      const user = req.body;
      const isExist = await userCollection.findOne({ email: user.email });
      if (isExist) {
        res.send("User already exists.");
      } else {
        const result = await userCollection.insertOne(user);
        res.send(result);
      }
    });

    //! tasks api
    app.post("/tasks", async (req, res) => {
      const user = req.body;
      const result = await taskCollection.insertOne(user);
      res.send(result);
    });

    app.get("/tasks/:email", async (req, res) => {
      const { email } = req.params;
      const result = await taskCollection
        .find({ email: email })
        .sort({ order: 1 })
        .toArray();
      res.send(result);
    });

    app.delete("/tasks/:id", async (req, res) => {
      const id = req.params;
      const result = await taskCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.put("/tasks/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          ...req.body,
        },
      };
      const result = await taskCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    app.put("/tasks-reorder", async (req, res) => {
      const { tasks } = req.body;
      const bigOps = tasks.map((task) => ({
        updateOne: {
          filter: { _id: new ObjectId(task._id) },
          update: { $set: { order: task.order, category: task.category } },
        },
      }));
      const result = await taskCollection.bulkWrite(bigOps);
      res.send(result);
    });
  } finally {
    // nothing
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Loading tasks...");
});

app.listen(port, () => {
  console.log(`Tasks coming in ${port}`);
});
