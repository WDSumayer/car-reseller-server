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
        app.get('/products', async(req, res) => {
            const email = req.query.email
            const query = {
                seller_email: email
            }
            const products = await carsCollections.find(query).toArray()
            res.send(products)
        })
        app.get('/orders', async(req, res) => {
            const email = req.query.email
            const query = {email: email}
            const orders = await orderCollections.find(query).toArray()
            res.send(orders)
        })

        app.get('/users/seller/:email',  async(req, res) => {
            const email = req.params.email
            const query = {email}
            const user = await userCollections.findOne(query)
            res.send({isSeller: user?.role === 'Seller'})
        })
        app.get('/users/admin/:email',  async(req, res) => {
            const email = req.params.email
            const query = {email}
            const user = await userCollections.findOne(query)
            res.send({isAdmin: user?.role === 'Admin'})
        })
        app.get('/users/sellers', async(req, res) => {
            const query = {
                role: "Seller"
            }
            const sellers = await userCollections.find(query).toArray()
            res.send(sellers)
        })
        app.get('/users/buyers', async(req, res) => {
            const query = {
                role: "User"
            }
            const buyers = await userCollections.find(query).toArray()
            res.send(buyers)
        })
        app.post('/cars', async(req, res) => {
            const car = req.body
            const result = await carsCollections.insertOne(car)
            res.send(result)
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
       app.put('/orders', async(req, res) => {
           
            const order = req.body
            const email = order.email
            const id = order.car_id
            const query = {email, car_id: id}
            const options = {upsert: true}
            const updatedDoc = {
                $set: order
            }
            const result = await orderCollections.updateOne(query, updatedDoc, options)
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