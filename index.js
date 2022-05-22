const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require("jsonwebtoken");

require('dotenv').config();

const port = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        console.log('decoded', decoded);
        req.decoded = decoded;
        next();
    })
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@posterisks.o0zsr.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        console.log("db connected");

        const database = client.db('posterisksDB');
        const postersCollection = database.collection('posters');




        app.post('/signin', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1d'
            });
            res.send({ accessToken });
        });

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
        //deleting a poster
        app.delete('/posters/:posterId', async (req, res) => {
            const id = req.params.posterId;
            const query = { _id: ObjectId(id) };
            const deletePoster = await postersCollection.deleteOne(query);
            res.send(deletePoster);
        });
        //adding new poster
        app.post("/posters", async (req, res) => {
            const currentProduct = req.body;
            const product = await postersCollection.insertOne(currentProduct);
            res.json(product);
        });
        // updating poster quantity
        app.put("/posters/:posterId", async (req, res) => {
            const id = req.params.posterId;
            const newQuantity = req.body.newQuantity;
            const query = { _id: ObjectId(id) };
            const updateDoc = {
                $set: {
                    quantity: newQuantity,
                },
            };
            await postersCollection.updateOne(query, updateDoc);
        });
        //getting my products by jwt
        app.get('/myproducts', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            if (email === decodedEmail) {
                const query = { admin: email };
                const cursor = postersCollection.find(query);
                const posters = await cursor.toArray();
                res.send(posters);
            }
            else {
                res.status(403).send({ message: 'forbidden access' });
            }
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