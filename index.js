const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

require('dotenv').config();

const port = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@posterisks.o0zsr.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        console.log("db connected");

        const database = client.db('posterisksDB');
        const postersCollection = database.collection('posters');


        // -----Operations on postersCollection
        // getting all posters
        app.get('/posters', async (req, res) => {
            const cursor = postersCollection.find({});
            const posters = await cursor.toArray();
            res.send(posters);
        });
        // getting single poster by id
        app.get("/posters/:posterId", async (req, res) => {
            const id = req.params.posterId;
            const query = { _id: ObjectId(id) };
            const singlePoster = await postersCollection.findOne(query);
            res.send(singlePoster);
        });
        // updating poster quantity
        app.put("/posters/:posterId", async (req, res) => {
            const id = req.params.posterId;
            const newQuantity = parseInt(req.body);
            const query = { _id: ObjectId(id) };
            const updateDoc = {
                $set: {
                    quantity: newQuantity
                }
            };
            const updateStatus = await postersCollection.updateOne(query, updateDoc);
            res.send(updateStatus);
        });
    }
    finally {
        // await client.close();
    }
}

run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello Bohemian!')
})

app.listen(port, () => {
    console.log(`listening at ${port}`)
})