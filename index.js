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
        app.post('/cars', async(req, res) => {
            const car = req.body
            const result = await carsCollections.insertOne(car)
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