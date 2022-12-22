const express = require('express')
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken')
const cors = require('cors');
require('dotenv').config()
const stripe = require("stripe")(process.env.STRIPE_SECRET);
const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.nrkuqgj.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT (req, res, next) {
    const authHeader = req.headers.authorization
    if(!authHeader){
        return res.status(401).send('unauthorized access')
    }
    const token = authHeader.split(' ')[1]
   
    jwt.verify(token, process.env.SECTET_TOKEN, function(err, decoded) {
        if(err){
            return res.status(403).send({message: 'fobidden access'})
        }
        req.decoded = decoded
        next()
    })
}



async function run() {

    try{
        const categoryCollections = client.db('car-Reseller').collection('categories')
        const carsCollections = client.db('car-Reseller').collection('cars')
        const userCollections = client.db('car-Reseller').collection('users')
        const orderCollections = client.db('car-Reseller').collection('orders')
        const wishCollections = client.db('car-Reseller').collection('wishes')
        const galleryCollections = client.db('car-Reseller').collection('gallery')
        const paymentCollections = client.db('car-Reseller').collection('payments')
        const addvertiseCollections = client.db('car-Reseller').collection('advertises')
        

        const verifyAdmin = async(req, res, next) => {
            const decodedEmail = req.decoded.email
            const query = {email: decodedEmail}
           
            const user = await userCollections.findOne(query)
            if(user?.role !== "Admin"){
                return res.status(403).send({message: 'forbidden access'})
            }
            next()
        }
        const verifySeller = async(req, res, next) => {
            const decodedEmail = req.decoded.email
            const query = {email: decodedEmail}
           
            const user = await userCollections.findOne(query)
            if(user?.role !== "Seller"){
                return res.status(403).send({message: 'forbidden access'})
            }
            next()
        }




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
        app.get('/galleryItems', async(req, res) => {
           
              
                const query = {}
                const gallery = await galleryCollections.find(query).toArray()
                res.send(gallery)
           
           
        })
        app.get('/products',verifyJWT, verifySeller, async(req, res) => {
            const email = req.query.email
            const query = {
                seller_email: email
            }
            const products = await carsCollections.find(query).toArray()
            res.send(products)
        })
        app.get('/orders',verifyJWT, async(req, res) => {
            const email = req.query.email
            const decodedEmail = req.decoded.email
            if(email !== decodedEmail){
                return res.status(403).send({message: 'forbidden access'})
            }
            const query = {email: email}
            const orders = await orderCollections.find(query).toArray()

           
            res.send(orders)
        })
        app.get('/wishes',verifyJWT, async(req, res) => {
            const email = req.query.email
            const decodedEmail = req.decoded.email
            if(email !== decodedEmail){
                return res.status(403).send({message: 'forbidden access'})
            }
            const query = {email: email}
            const wishes = await wishCollections.find(query).toArray()

           
            res.send(wishes)
        })
        app.get('/orders/:id', async(req, res) => {
            const id = req.params.id
            const query = {_id: ObjectId(id)}
            const order = await orderCollections.findOne(query)
            res.send(order)
        })

        app.get('/user/status/:email', async(req, res) => {
            const email = req.params.email;
            const query = {email: email}
            const result = await userCollections.findOne(query)
            res.send(result)
        })

        app.get('/users/buyer/:email',  async(req, res) => {
            const email = req.params.email
            const query = {email}
            const user = await userCollections.findOne(query)
            res.send({isUser: user?.role === 'User'})
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
        app.get('/users/sellers',verifyJWT, verifyAdmin, async(req, res) => {
            const query = {
                role: "Seller"
            }
            const sellers = await userCollections.find(query).toArray()
            res.send(sellers)
        })
        app.get('/users/buyers',verifyJWT, verifyAdmin, async(req, res) => {
            const query = {
                role: "User"
            }
            const buyers = await userCollections.find(query).toArray()
            res.send(buyers)
        })

        app.get('/jwt', async(req, res) => {
            const email = req.query.email;
            const query = {email: email}
            const user = await userCollections.findOne(query)
            if(user){
                const token = jwt.sign({email}, process.env.SECTET_TOKEN, {expiresIn: '1h'})
                return res.send({accessToken: token})
            }
            res.status(403).send({accessToken: ''})
        })


        app.get('/addvertises', async(req, res) => {
            const query = {}
            const advgProducts = await addvertiseCollections.find(query).toArray()
            res.send(advgProducts)
        })

        app.post('/brand', async(req, res) => {
            const brand = req.body
            const result = await categoryCollections.insertOne(brand)
            res.send(result)
        })

        app.post('/cars', async(req, res) => {
            const car = req.body
            const result = await carsCollections.insertOne(car)
            res.send(result)
        })

        app.post('/create-payment-intent', async(req, res) => {
            const order = req.body
            const price = order.price
            const amount = price * 100

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                  ],
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
              });
        })

        app.put('/payments', async(req, res) => {
            const payment = req.body
            const id = payment.orderId
            const carId = payment.car_id
            const result = await paymentCollections.insertOne(payment)
            const filter = {_id: ObjectId(id)}
            const options = {upsert: true}
            const updatedDoc = {
                $set: {
                    status: "Paid"
                }
            }
            const upadatedResult = await orderCollections.updateOne(filter, updatedDoc, options)

            const query = {_id: ObjectId(carId)}
           const carUpdatedResult = await carsCollections.updateOne(query, updatedDoc, options)

           const advgQuery = {car_id: carId}
           const advgUpdatedResult = await addvertiseCollections.updateOne(advgQuery, updatedDoc, options)
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
       app.put('/users/status/:id',async(req, res) => {      
        const id = req.params.id
        const filter = {_id: ObjectId(id)}
        const options = { upsert: true } 
        const updateDoc = {
            $set: {
                status: 'Verified'
            }
        }
        const result = await userCollections.updateOne(filter, updateDoc, options)
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
       app.put('/wishes', async(req, res) => {
           
            const wish = req.body
            const email = wish.email
            const id = wish.car_id
            const query = {email, car_id: id}
            const options = {upsert: true}
            const updatedDoc = {
                $set: wish
            }
            const result = await wishCollections.updateOne(query, updatedDoc, options)
            res.send(result)
       })
     
       app.put('/addvertise', async(req, res) => {
           
            const advgProduct = req.body
            const email = advgProduct.email
            const id = advgProduct.car_id
            const query = {email, car_id: id}
            const options = {upsert: true}
            const updatedDoc = {
                $set: advgProduct
            }
            const result = await addvertiseCollections.updateOne(query, updatedDoc, options)
            res.send(result)
       })
       app.delete('/users/:id', async(req, res) => {
        const id = req.params.id;
        const filter = {_id: ObjectId(id)}
        const user = await userCollections.deleteOne(filter)
        res.send(user)
       })
       app.delete('/cars/:id', async(req, res) => {
        const id = req.params.id
        const filter = {_id: ObjectId(id)}
        const car = await carsCollections.deleteOne(filter)
        const query = {car_id: id}
        const advgProduct = await addvertiseCollections.deleteOne(query)
        res.send(car)
        
       })
       app.delete('/order/:id', async(req, res) => {
        const id = req.params.id
        const filter = {_id: ObjectId(id)}
        const orderedCar = await orderCollections.deleteOne(filter)
       
        res.send(orderedCar)
        
       })
       app.delete('/wishedCar/:id', async(req, res) => {
        const id = req.params.id
        const filter = {_id: ObjectId(id)}
        const wishedCar = await wishCollections.deleteOne(filter)
       
        res.send(wishedCar)
        
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