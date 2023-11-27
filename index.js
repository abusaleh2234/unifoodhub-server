const express = require('express');
const cors = require('cors');
var jwt = require('jsonwebtoken');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000


// meddelwere

app.use(cors())
app.use(express.json())




const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_UNIFOODHUB_USER}:${process.env.DB_UNIFOODHUB_PASS}@cluster0.kothmtv.mongodb.net/?retryWrites=true&w=majority`;

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
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const mealsCollection = client.db("uniFoodHubDB").collection("meals");
        const usersCollection = client.db("uniFoodHubDB").collection("users");
        const mealsRequestCollection = client.db("uniFoodHubDB").collection("mealsRequest");

        app.post("/jwt", async (req, res) => {
            const user = req.body
            const token = jwt.sign(user, process.env.WEB_TOKEN_SECURE, { expiresIn: '1h' })
            res.send({ token })
        })

        const verifyToken = async (req, res, next) => {
            if (req.body.token) {
                return res.status(401).send({ message: "unauthorize access" })
            }
            const token = req.body.token
            jwt.verify(token, process.env.WEB_TOKEN_SECURE, (err, docoded) => {
                if (err) {
                    return res.status(401).send({ message: "unauthorize access" })
                }
                req.docoded = docoded;
                next()
            })
            // console.log(token)
        }

        app.get("/meals", async (req, res) => {
            const result = await mealsCollection.find().toArray()
            res.send(result)
        })

        app.get("/meals/:id", async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: new ObjectId(id) }
            const result = await mealsCollection.findOne(query)
            res.send(result)
        })

        app.get("/searchmeals", async (req, res) => {
            const search = req.query.search
            console.log(search);
            const query = {
                name: { $regex: search, $options: 'i' }
            }
            const result = await mealsCollection.find(query).toArray()
            res.send(result)
        })

        app.post("/users", async (req, res) => {
            const user = req.body;
            console.log(user);
            // user duplicate stop
            const query = { email: user?.email }
            const existinguser = await usersCollection.findOne(query)
            if (existinguser) {
                return res.send({ message: "user alredy exists", insertedId: null })
            }
            const result = await usersCollection.insertOne(user)
            res.send(result)
        })

        app.post("/mealsRequest", async (req, res) => {
            const meal = req.body
            console.log(meal);
            const result = await mealsRequestCollection.insertOne(meal)
            res.send(result)
        })


        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get("/", (req, res) => {
    res.send("UniFoodHub is sooming sooon");
})
app.listen(port, (req, res) => {
    console.log(`UniFoodHub is runing on port ${port}`);
})
