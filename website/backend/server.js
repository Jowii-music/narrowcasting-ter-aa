import { createClient } from '@supabase/supabase-js';
import cors from 'cors';
import bcrypt from 'bcrypt';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import session from 'express-session';
import dotenv from 'dotenv'

// Fix __dirname in ES module
dotenv.config()
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(cors({
  origin: 'http://localhost:3000', // your frontend origin
  credentials: true
}));


// Middleware
app.use(cors());
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: false, // true if using HTTPS
    maxAge: 24 * 60 * 60 * 1000 // keeps session alive for 1 day
  }
}));

// Supabase client
const supabase = createClient(
  'https://epujbpdaimfxwchjfyyf.supabase.co',
  'sb_secret_12CQtJR7ug2bPh-M0rjdvw_WtGMlHNB'
);

// Serve static frontend
app.use(express.static(path.join(__dirname, '../frontend')));


function requireLogin(req, res, next){
  if(!req.session.user){
    return res.status(401).json({loggedIn: false})
  }
  next()
}

// ----------------- AUTH ENDPOINTS -----------------

app.get('/auth/check', (req, res) => {
  if (req.session && req.session.user) {
    return res.sendStatus(200);
  }

  return res.sendStatus(401);
});

// Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (error || !data) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  const match = await bcrypt.compare(password, data.password);

  if (match) {
    req.session.user = { id: data.id, username: data.username }
    res.json({ message: 'Login successful', user: { id: data.id, username: data.username } });
  } else {
    res.status(401).json({ message: 'Invalid username or password' });
  }
});

// Signup
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

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

// ----------------- IMAGE UPLOAD -----------------

// Configure multer (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post('/upload', requireLogin, upload.single('image'), async (req, res) => {
  try {
    const file = req.file;
    const { name, duration, display, fileName, type } = req.body; // All provided by frontend

    if (!file) return res.status(400).json({ message: 'No file uploaded' });
    if (!name || !duration || !display || !fileName || !type) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const bucketName = 'slides_bucket'; // Your Supabase bucket
    const folderPath = 'img'
    const bucketFileName = `${folderPath}/${uuidv4()}${path.extname(file.originalname)}`; // Unique backend filename

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(bucketFileName, file.buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.mimetype // use the actual file type, not frontend input
      });

    if (uploadError) return res.status(500).json({ message: 'Upload failed', error: uploadError.message });

    // Build the bucketPath automatically

    // Insert into database
    const durationNum = Number(duration);

    const { data: dbData, error: dbError } = await supabase
      .from('slides')
      .insert([{
        name,
        duration: durationNum,
        display,
        fileName: name,
        type: type,
        bucketPath: `${bucketFileName}`
      }])
      .select()
      .single();

    if (dbError) {
      console.error('Supabase insert error:', dbError);
      return res.status(500).json({ message: 'DB insert failed', error: dbError.message });
    }

    res.status(201).json({ message: 'File uploaded successfully', file: dbData });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.get('/slides', requireLogin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('slides')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      return res.status(500).json({ message: 'Failed to fetch slides', error: error.message });
    }

    // Attach public URLs for each slide
    const slidesWithUrls = data.map(slide => {
      const { data: publicData, error } = supabase
        .storage
        .from('slides_bucket')
        .getPublicUrl(slide.bucketPath);

      if (error) {
        console.error('Error generating public URL', error);
      }

      return {
        ...slide,
        url: publicData.publicUrl // <-- this is the actual URL
      };
    });

    res.json(slidesWithUrls);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


// ----------------- STATIC ROUTES -----------------
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start server
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
