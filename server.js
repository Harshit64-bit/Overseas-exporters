const express = require('express');
     const Razorpay = require('razorpay');
     const crypto = require('crypto');
     const cors = require('cors');
     require('dotenv').config();

     const app = express();
     app.use(express.json());
     app.use(cors({
       origin: ['https://your-app-domain', 'http://localhost:19006'], // Replace with your app’s domain and local Expo URL
       methods: ['GET', 'POST'],
       allowedHeaders: ['Content-Type'],
     }));

     const razorpay = new Razorpay({
       key_id: process.env.RAZORPAY_KEY_ID,
       key_secret: process.env.RAZORPAY_KEY_SECRET,
     });

     // Root Route for Debugging
     app.get('/', (req, res) => {
       console.log('Received GET request to /');
       res.json({ message: 'Zoltana Backend is running. Use POST /create-order or POST /verify-payment.' });
     });

     // Create Order
     app.post('/create-order', async (req, res) => {
       try {
         const { amount } = req.body;
         console.log('Creating order with amount:', amount);
         if (!amount || isNaN(amount) || amount <= 0) {
           return res.status(400).json({ error: 'Invalid amount' });
         }
         const options = {
           amount: amount * 100, // Convert INR to paise
           currency: 'INR',
           receipt: `receipt_${Date.now()}`,
           payment_capture: 1, // Auto-capture
         };
         const order = await razorpay.orders.create(options);
         console.log('Order created:', order);
         res.json({
           id: order.id,
           currency: order.currency,
           amount: order.amount,
         });
       } catch (error) {
         console.error('Order creation error:', error);
         res.status(500).json({ error: 'Failed to create order', details: error.message });
       }
     });

     // Verify Payment
     app.post('/verify-payment', (req, res) => {
       try {
         const { order_id, payment_id, signature } = req.body;
         console.log('Verifying payment:', { order_id, payment_id });
         const generatedSignature = crypto
           .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
           .update(`${order_id}|${payment_id}`)
           .digest('hex');

         if (generatedSignature === signature) {
           console.log('Payment verified successfully');
           res.json({ status: 'success', message: 'Payment verified' });
         } else {
           console.error('Invalid signature');
           res.status(400).json({ status: 'failure', message: 'Invalid signature' });
         }
       } catch (error) {
         console.error('Payment verification error:', error);
         res.status(500).json({ error: 'Verification failed', details: error.message });
       }
     });

     const PORT = process.env.PORT || 3000;
     app.listen(PORT, () => {
       console.log(`Server running on port ${PORT}`);
     });