const express = require("express");
const session = require("express-session");
require("dotenv").config();
const axios = require('axios');

const db = require("./config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const app = express();
const SECRET_KEY = "yA%55G_9;;y7ttFFF%5VVeer547^^8gf5AAWJ88990OHHtvr5:</";
// Rate Limiting for Login Attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: "Too many login attempts. Please try again later.",
});
//middleware setup
app.use(cors());
app.use(bodyParser.json());
app.use(
  session({
    secret: SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict", 
      maxAge: 3600000,
    },
  })
);
// Register Route
app.post("/register", (req, res) => {
  const { name, email, phone, username, password, confirmPassword } = req.body;

  const isStrongPassword = (password) => {
    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongPasswordRegex.test(password);
  };

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  if (!isStrongPassword(password)) {
    return res.status(400).json({
      message:
        "Password must be at least 8 characters, include uppercase, lowercase, number, and special character.",
    });
  }

  // Check for existing username or email
  const checkUserQuery = "SELECT * FROM users WHERE username = ? OR email = ?";
  db.query(checkUserQuery, [username, email], async (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Database error", error: err.message });
    }

    if (result.length > 0) {
      const existingUser = result[0];
      if (existingUser.username === username) {
        return res
          .status(400)
          .json({ message: "Username already exists, try again" });
      }
      if (existingUser.email === email) {
        return res
          .status(400)
          .json({ message: "Email already registered, try another one" });
      }
    }

    try {
      // Hash the password before storing
      const hashedPassword = await bcrypt.hash(password, 10);
      const insertUserQuery =
        "INSERT INTO users (name, email, phone, username, password) VALUES (?, ?, ?, ?, ?)";
      db.query(
        insertUserQuery,
        [name, email, phone, username, hashedPassword],
        (err) => {
          if (err) {
            return res
              .status(500)
              .json({ message: "Database error", error: err.message });
          }
          res.json({
            success: true,
            message: "User registered successfully",
            redirectUrl: "/login",
          });
        }
      );
    } catch (hashError) {
      res
        .status(500)
        .json({ message: "Error hashing password", error: hashError.message });
    }
  });
});

// Login Route with Rate Limiting
app.post("/login", loginLimiter, (req, res) => {
  const { username, password } = req.body;
  const findUserQuery = "SELECT * FROM users WHERE username = ?";
  db.query(findUserQuery, [username], async (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });

    if (result.length === 0) {
      return res.status(400).json({ message: "Invalid username or password" });
    }
    const user = result[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid username or password" });
    }
    req.session.userId = user.id;
    req.session.username = user.username;
    const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: "1h" });
    res.json({
      success: true,
      token,
      message: "Login successful",
      redirectUrl: "/Categories",
    });
  });
});

// Get Username
app.get("/user", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token)
    return res.status(401).json({ success: false, message: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const findUserQuery = "SELECT username FROM users WHERE id = ?";
    db.query(findUserQuery, [decoded.id], (err, result) => {
      if (err)
        return res
          .status(500)
          .json({ success: false, message: "Database error" });
      if (result.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      res.json({ success: true, username: result[0].username });
    });
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
});


//products and product details categories
// Get all categories
app.get("/api/categories", (req, res) => {
  db.query("SELECT * FROM categories ORDER BY id ASC", (err, results) => {
    if (err) res.status(500).send(err);
    else res.json(results);
  });
});


// Get products by category
app.get("/api/products/:categoryId", (req, res) => {
    const { categoryId } = req.params;
    db.query("SELECT * FROM products WHERE category_id = ?", [categoryId], (err, results) => {
        if (err) res.status(500).send(err);
        else res.json(results);
    });
});

// Get product details by ID
app.get("/api/product/:id", (req, res) => {
    const { id } = req.params;
    db.query("SELECT * FROM products WHERE id = ?", [id], (err, result) => {
        if (err) res.status(500).send(err);
        else res.json(result[0]);
    });
});

app.get("/api/similar-products/:categoryId/:productId", (req, res) => {
  const { categoryId, productId } = req.params;
  db.query(
    "SELECT * FROM products WHERE category_id = ? AND id != ? LIMIT 4",
    [categoryId, productId],
    (err, results) => {
      if (err) res.status(500).send(err);
      else res.json(results);
    }
  );
});

app.get("/products", async (req, res) => {
  try {
    const [products] = await db.query("SELECT id, name, image_key, images, category_id, description, shipping_info, social_media_sharing FROM products");
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Error fetching products" });
  }
});
app.put("/products/:id/social-media", async (req, res) => {
  const { id } = req.params;
  const { socialMediaLink } = req.body;
  
  try {
    await db.query("UPDATE products SET social_media_sharing = ? WHERE id = ?", [socialMediaLink, id]);
    res.json({ message: "Social media sharing link updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error updating social media link" });
  }
});
app.post('/api/cart/add', (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.id;
    const cartItems = req.body;

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    const insertQuery = `
      INSERT INTO orders (user_id, product_id, product_name, quantity, price, total_price)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    cartItems.forEach((item) => {
      const totalPrice = item.price * item.quantity;
      db.query(
        insertQuery,
        [userId, item.product_id, item.product_name, item.quantity, item.price, totalPrice], // Added item.name
        (err) => {
          if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ success: false, message: "Database error" });
          }
        }
      );
    });

    res.status(200).json({ success: true, message: "Order placed successfully" });
  } catch (err) {
    console.error("Error:", err);
    res.status(401).json({ success: false, message: "Invalid token" });
  }
});


//DARAJA API INTEGRATION
app.get('/api/mpesa/token', async (req, res) => {
  const CONSUMER_KEY = 'tEVkQMy0kecFolAABzL19kRyyDzb0KtYu1AHGG7tuH5n5cmw';
  const CONSUMER_SECRET = 'StopXyRZsDcN4Zzhzxd4CFeFoIoidVz64qTgMtVufonG22pS5iRuxAVCOBKx1yNF';
  const BUSINESS_SHORT_CODE = '174379';
  const PASSKEY = 'bfb279f9aa9bdbcf158e97dd71a467cd2c2e74c9c644c13c7e5a2cddf672c9b0';
  const CALLBACK_URL ='https://sandbox.safaricom.co.ke/mpesa/';
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  console.log('Authorization Header:', `Basic ${auth}`); // Log Authorization Header

  try {
    const response = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      headers: {
        Authorization: `Basic ${auth}`
      }
    });

    console.log('Token Response:', response.data); // Log the token response
    res.json({ access_token: response.data.access_token });
  } catch (error) {
    console.error('Error fetching token:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to get access token' });
  }
});


const moment = require('moment');

app.post('/api/mpesa/stkpush', async (req, res) => {
  const { phone, amount } = req.body;

  try {
    // Get access token
    const tokenResponse = await axios.get('http://localhost:5000/api/mpesa/token');
    const accessToken = tokenResponse.data.access_token;

    // Generate Timestamp and Password
    const timestamp = moment().format('YYYYMMDDHHmmss');
    const password = Buffer.from(
      `${process.env.SHORTCODE}${process.env.PASSKEY}${timestamp}`
    ).toString('base64');

    // Prepare STK Push request payload
    const requestBody = {
      BusinessShortCode: process.env.SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phone,
      PartyB: process.env.SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: process.env.CALLBACK_URL,
      AccountReference: "Order123",
      TransactionDesc: "Payment for Order"
    };

    // Initiate STK Push
    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('STK Push Error:', error);
    res.status(500).json({ error: 'Failed to initiate payment' });
  }
});
app.post('/api/mpesa/callback', (req, res) => {
  const { Body } = req.body;

  if (!Body) {
    return res.status(400).json({ message: 'Invalid callback data' });
  }

  const callbackData = Body.stkCallback;
  const resultCode = callbackData.ResultCode;
  const resultDesc = callbackData.ResultDesc;
  const merchantRequestID = callbackData.MerchantRequestID;
  const checkoutRequestID = callbackData.CheckoutRequestID;

  console.log('Callback Data:', callbackData);

  if (resultCode === 0) {
    // Payment was successful
    const amount = callbackData.CallbackMetadata.Item.find(i => i.Name === "Amount").Value;
    const mpesaReceiptNumber = callbackData.CallbackMetadata.Item.find(i => i.Name === "MpesaReceiptNumber").Value;
    const phoneNumber = callbackData.CallbackMetadata.Item.find(i => i.Name === "PhoneNumber").Value;

    // Store payment details in the database
    const insertPaymentQuery = `
      INSERT INTO payments (merchantRequestID, checkoutRequestID, mpesaReceiptNumber, amount, phoneNumber, resultDesc)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    db.query(insertPaymentQuery, [merchantRequestID, checkoutRequestID, mpesaReceiptNumber, amount, phoneNumber, resultDesc], (err) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ success: false, message: "Database error" });
      }
    });

    console.log('Payment Successful:', mpesaReceiptNumber);
  } else {
    // Payment failed or was cancelled
    console.log('Payment Failed:', resultDesc);
  }

  res.status(200).json({ message: 'Callback received successfully' });
});


app.listen(5000, () => {
  console.log("Server started on port 5000");
});
