const express = require('express');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const path = require('path');

// ✅ Supabase credentials
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const app = express();
const PORT = process.env.PORT || 3000;

// 🔧 Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'views')));

// 🌐 Home Page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'home.html'));
});

app.get("/reset-password", async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("❌ Missing code");
  }

  // try {
    // Exchange code for token
    const tokenRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=pkce`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.SUPABASE_KEY,
      },
      body: JSON.stringify({
        code,
        redirect_uri: "https://prizebond-mauve.vercel.app/reset-password" // Must match Supabase settings
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      throw new Error(tokenData.error_description || "Token exchange failed");
    }

    const accessToken = tokenData.access_token;

    // Redirect to Flutter with token
    return res.redirect(`${REDIRECT_TO_FLUTTER}?access_token=${encodeURIComponent(accessToken)}`);
  // } catch (err) {
  //   console.error("err ${err}");
  //   return res.status(500).send("❌ Failed to reset password.");
  // }
});

// 🔐 Handle Reset Password Form Submission
app.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).send('❌ Token and new password are required.');
  }

  try {
    // Set session using token
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: token, // required by API, but not used
    });

    if (sessionError) throw sessionError;

    // Update user password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) throw updateError;

    res.send('✅ Password updated successfully!');
  } catch (error) {
    console.error('❌ Error resetting password:', error.message || error);
    res.status(400).send('❌ Failed to reset password.');
  }
});

// ✅ Email Confirmation Greeting Page
app.get('/email-confirmed', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'email-confirmed.html'));
});

// 🚀 Start server (only locally, not on Vercel)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
}

// 👉 Export app for Vercel
module.exports = app;
