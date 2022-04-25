const express = require('express');
require('dotenv').config()
var jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cros = require('cors')
const app = express();
const port = process.env.PORT || 5000;

//midleware
app.use(express.json())
app.use(cros())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.6ni17.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const serviceCollection = client.db('geniusCar').collection('services');
        const orderCollection = client.db('geniusCar').collection('order');

        //verify token 
        function verifyJwt(req, res, next) {
            const headers = (req.headers.atorization)
            if (!headers) {
                return res.status(401).send({ message: 'unathorized access' })
            }
            const token = headers.split(' ')[1]
            jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
                if (err) {
                    return res.status(403).send({ message: 'forbidden access' })
                }
                req.decoded = decoded
                next();
            })

        }

        // auth
        app.post('/login', async (req, res) => {
            const user = req.body;
            const token = await jwt.sign(user, process.env.ACCESS_TOKEN, {
                expiresIn: '1d'
            })
            res.send({ token })
        })
        //load data from data base
        app.get('/services', async (req, res) => {
            const query = req.query;
            const cursor = serviceCollection.find(query);
            const result = await cursor.toArray();
            res.send(result)
        })
        //load single service 
        app.get('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await serviceCollection.findOne(query);
            res.send(result);
        })
        //post order 
        app.post('/order', async (req, res) => {
            const data = req.body;
            const result = await orderCollection.insertOne(data);
            res.send(result)
        })
        //get orders
        app.get('/order', verifyJwt, async (req, res) => {
            const email = (req.query.email)
            const decodedEmail = req.decoded.email;
            if (email === decodedEmail) {
                const query = { email }
                const cursor = orderCollection.find(query)
                const result = await cursor.toArray()
                res.send(result)
            }
            else {
                res.status(403).send({ message: 'unathorization' })
            }

        })



    } finally {
        // client.close()
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('start the genius server')
})
app.listen(port, () => {
    console.log('listening port', port)
})