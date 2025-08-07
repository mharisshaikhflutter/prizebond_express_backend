const express = require('express');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const path = require('path');

// ✅ Supabase credentials
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const app = express();
const PORT = process.env.PORT || 3000;

// 🔧 Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('views')); // Serve static files (html, css, etc.)

// 🌐 Home Page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'home.html'));
});

// 🌐 Reset Password Form
app.get('/reset-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'reset-password.html'));
});

// 🔐 Handle Reset Password Submission
app.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const { data: session, error: sessionError } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: token, // required, but not actually used here
    });

    if (sessionError) throw sessionError;

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) throw updateError;

    res.send('✅ Password updated successfully!');
  } catch (error) {
    console.error(error);
    res.status(400).send('❌ Failed to reset password.');
  }
});

// ✅ Email Confirmation Greeting Page
app.get('/email-confirmed', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'email-confirmed.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
