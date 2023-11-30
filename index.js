const express = require('express');
require('dotenv').config()
const cors = require('cors');
var jwt = require('jsonwebtoken');
const app = express()
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
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
        // const reviewsCollection = client.db("uniFoodHubDB").collection("reviews");
        const reviewsAllCollection = client.db("uniFoodHubDB").collection("reviewall");
        const membershipCollection = client.db("uniFoodHubDB").collection("membership");

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

        app.get("/mealitem/:id", async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await mealsCollection.findOne(query)
            res.send(result)
        })
        app.get("/onemeal/:id", async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: new ObjectId(id) }
            const queryreview = { mealId: id }
            const resultreview = await reviewsAllCollection.find(queryreview).toArray()
            const resultmeal = await mealsCollection.findOne(query)
            const result = { resultmeal, resultreview }
            res.send(result)
        })

        app.get("/searchmeals", async (req, res) => {
            const search = req.query.search
            // console.log(search);
            const query = {
                name: { $regex: search, $options: 'i' }
            }
            const result = await mealsCollection.find(query).toArray()
            res.send(result)
        })


        app.get("/membership", async (req, res) => {
            const result = await membershipCollection.find().toArray()
            res.send(result)
        })

        app.get("/singelmembore/:id", async (req, res) => {
            const id = req.params.id
            console.log(id);
            const query = { _id: new ObjectId(id) }
            const result = await membershipCollection.findOne(query)
            res.send(result)
        })
        app.get("/reqallmeals", async (req, res) => {
            const result = await mealsRequestCollection.find().toArray()
            res.send(result)
        })

        app.get("/maelreq/:email", async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const result = await mealsRequestCollection.find(query).toArray()
            res.send(result)
        })

        app.get("/auser", async (req, res) => {
            const email = req.query.email
            const query = { email: email }
            const result = await usersCollection.findOne(query)
            res.send(result)
        })

        app.get("/allreviews", async (req, res) => {
            // console.log("allreview");
            const result = await reviewsAllCollection.find().toArray()
            res.send(result)
        })

        app.get("/userreview", async (req, res) => {
            const email = req.query.email
            const query = { email: email }
            const result = await reviewsAllCollection.find(query).toArray()
            res.send(result)
        })

        app.get("/alluser", async (req, res) => {
            const result = await usersCollection.find().toArray()
            res.send(result)
        })

        app.get("/user/admin/:email", async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const user = await usersCollection.findOne(query)
            let admin = false
            if (user) {
                admin = user?.role === "admin"
            }
            res.send({ admin })
        })

        app.post("/users", async (req, res) => {
            const user = req.body;
            // console.log(user);
            // user duplicate stop
            const query = { email: user?.email }
            const existinguser = await usersCollection.findOne(query)
            if (existinguser) {
                return res.send({ message: "user alredy exists", insertedId: null })
            }
            const result = await usersCollection.insertOne(user)
            res.send(result)
        })

        app.post("/review", async (req, res) => {
            const review = req.body
            const result = await reviewsAllCollection.insertOne(review)
            res.send(result)
        })

        app.post("/mealsRequest", async (req, res) => {
            const meal = req.body
            // console.log(meal);
            const result = await mealsRequestCollection.insertOne(meal)
            res.send(result)
        })

        app.post("/addmeal", async (req, res) => {
            const meal = req.body
            const result = await mealsCollection.insertOne(meal)
            res.send(result)
        })

        app.patch("/adadmin/:id", async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    role: "admin"
                }
            }
            const result = await usersCollection.updateOne(filter, updateDoc)
            res.send(result)
        })

        app.put("/mealsearve/:id", async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const servedoc = {
                $set: {
                    status: "delivered"
                }
            }
            const result = await mealsRequestCollection.updateOne(filter, servedoc)
            res.send(result)
        })

        app.put("/updatesubscribtion", async (req, res) => {
            const id = req.query.id
            const email = req.query.email
            console.log(email, id);
            const query = {_id: new ObjectId(id)}
            const packeg = await membershipCollection.findOne(query)
            console.log(packeg.name);

            const filter = { email: email}
            const updatedoc = {
                $set: {
                    subscription: packeg.name
                }
            }
            const result = await usersCollection.updateOne(filter,updatedoc)
            res.send(result)
        })

        app.put("/mealupdate/:id", async (req, res) => {
            const id = req.params.id
            console.log(id);
            const filter = { _id: new ObjectId(id) }
            const meal = req.body
            console.log(meal);
            const options = { upsert: true };
            const updatedoc = {
                $set: {
                    name: meal.name,
                    distributor_name: meal.distributor_name,
                    category: meal.category,
                    meal_image: meal.meal_image,
                    details: meal.details,
                    ingredients: meal.ingredients,
                    post_time: meal.post_time,
                    price: meal.price,
                    rating: meal.rating,
                    like: meal.like,
                    email: meal.email,
                    reviews: meal.reviews,
                }
            }
            const result = await mealsCollection.updateOne(filter, updatedoc, options)
            res.send(result)
        })

        app.put("/userlike/:id", async (req, res) => {
            const id = req.params.id
            const like = req.body.updatelike
            // console.log(like);
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    like: like,
                }
            }
            const result = await mealsCollection.updateOne(filter, updateDoc)
            res.send(result)
        })
        // TODO REVIEW EDIT 
        app.put("/updatereview/:id", async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const review = req.body
            console.log(review);
            // const updateDoc = {
            //     $set: {

            //     }
            // }
            // const result = await reviewsAllCollection.updateOne(filter)
            // res.send(result)
        })

        app.delete("/deletemeal/:id", async (req, res) => {
            const id = req.params.id
            console.log(id);
            const query = { _id: new ObjectId(id) }
            const result = await mealsCollection.deleteOne(query)
            res.send(result)
        })
        app.delete("/malecancel/:id", async (req, res) => {
            const id = req.params.id
            console.log(id);
            const query = { _id: new ObjectId(id) }
            const result = await mealsRequestCollection.deleteOne(query)
            res.send(result)
        })
        app.delete("/deletereview/:id", async (req, res) => {
            const id = req.params.id
            console.log(id);
            const query = { _id: new ObjectId(id) }
            const result = await reviewsAllCollection.deleteOne(query)
            res.send(result)
        })

        // PAYMENT API  

        app.post("/create-payment-intent", async (req, res) => {
            const { price } = req.body
            const amount = parseInt(price * 100)

            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                payment_method_types: [
                    "card"
                ],
            })
            res.send({ clientSecret: paymentIntent.client_secret, })
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
