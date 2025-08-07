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
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('views'));

// 🌐 Serve reset password form
app.get('/reset-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'reset-password.html'));
});

// 🔐 Handle form submission
app.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // Sign in using access token
    const { data: session, error: sessionError } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: token, // not used but required
    });

    if (sessionError) throw sessionError;

    // Update password
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


// ✅ Email confirmation greeting page
app.get('/email-confirmed', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'email-confirmed.html'));
});



app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
