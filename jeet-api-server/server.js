// server.js – JEET API (Express + PostgreSQL)

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// חיבור ל-PostgreSQL (עדכן בהתאם למחשב שלך)
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'JEET',
  password: 'Ah123md123',
  port: 5432,
});

// בדיקת חיבור מיידית ל-DB
pool.connect()
  .then(() => console.log('✅ Connected to PostgreSQL DB'))
  .catch(err => {
    console.error('❌ Failed to connect to DB:', err);
    process.exit(1); // מפסיק את השרת אם אין חיבור
  });

// בדיקת חיבור
app.get('/health', (req, res) => {
  res.json({ status: 'API is running ✅' });
});

// יצירת הזמנה חדשה (לקוח)
app.post('/orders', async (req, res) => {
  const {
    customer_id,
    restaurant_id,
    courier_id,
    payment_method,
    total_price,
    cash_required,
    preparation_minutes
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO orders (customer_id, restaurant_id, courier_id, status, payment_method, total_price, cash_required, preparation_minutes)
       VALUES ($1, $2, $3, 'placed', $4, $5, $6, $7)
       RETURNING *`,
      [customer_id, restaurant_id, courier_id, payment_method, total_price, cash_required, preparation_minutes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('❌ Failed to create order:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// שליפת כל ההזמנות
app.get('/orders', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Failed to fetch orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// עדכון סטטוס הזמנה
app.patch('/orders/:id/status', async (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;

  try {
    const result = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, orderId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Failed to update status:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// שליפת כל המסעדות
app.get('/restaurants', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM restaurants ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Failed to fetch restaurants:', err);
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
});

// הרצת השרת
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`🚀 JEET API is running on http://localhost:${PORT}`);
}).on('error', (err) => {
  console.error('❌ Server failed to start:', err);
});
