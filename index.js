const express = require('express')
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.nrkuqgj.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {

    try{
        const categoryCollections = client.db('car-Reseller').collection('categories')
        const carsCollections = client.db('car-Reseller').collection('cars')
        const userCollections = client.db('car-Reseller').collection('users')
        const orderCollections = client.db('car-Reseller').collection('orders')

        app.get('/categories', async(req, res) => {
            const query = {}
            const categories = await categoryCollections.find(query).toArray()
            res.send(categories)
        })
        app.get('/cars/brand/:id', async(req, res) => {
            const id = req.params.id
            const query = {
                category_id: id
            }
            const cars = await carsCollections.find(query).toArray()
            res.send(cars)
        })
       app.put('/users/:email', async(req, res) => {
        const email = req.params.email
        const user = req.body
        const query = {email: email}
        const options = {upsert: true}
        const updatedDoc = {
            $set: user
        }
        const result = await userCollections.updateOne(query, updatedDoc, options)
        res.send(result)
       })
       app.post('/orders/:id', async(req, res) => {
            const id = req.params.id
            const order = req.body
            const email = order.email
            const query = {email: email}
            const booked = await orderCollections.find(query).toArray()
            console.log(booked)
            const band = booked.map(book => book._id === id)
            if(band.length){
                const message = `you have already booked`
                return res.send({acknowledged: false, message})
            }
            const result = await orderCollections.insertOne(order)
            res.send(result)
       })

    }
    finally{

    }
}
run().catch(err => console.log(err))


app.get('/', (req, res) => {
    res.send('car-reseller server is running')
})
app.listen(port, () => {
    console.log('car-reseller running on ', port)
})