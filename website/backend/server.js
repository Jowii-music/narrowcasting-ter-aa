import { createClient } from '@supabase/supabase-js';
import cors from 'cors';
import bcrypt from 'bcrypt';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const supabase = createClient(
  'https://epujbpdaimfxwchjfyyf.supabase.co',
  'sb_secret_12CQtJR7ug2bPh-M0rjdvw_WtGMlHNB'
);

// Serve static files from the frontend folder
app.use(express.static(path.join(__dirname, '../frontend')));

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single(); // get one user

  if (error || !data) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  const match = await bcrypt.compare(password, data.password);

  if (match) {
    res.json({ message: 'Login successful', user: { id: data.id, username: data.username } });
  } else {
    res.status(401).json({ message: 'Invalid username or password' });
  }
});

// Add this before app.listen(...)
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10); // 10 salt rounds

        // Insert the new user into Supabase
        const { data, error } = await supabase
            .from('users')
            .insert([{ username, password: hashedPassword }])
            .select()
            .single();

        if (error) {
            return res.status(400).json({ message: error.message });
        }

        res.status(201).json({ message: 'User created successfully', user: { id: data.id, username: data.username } });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
