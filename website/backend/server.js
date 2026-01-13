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
    const { name, duration, display } = req.body;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!name || !duration || !display) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Decide type from mimetype
    let type;
    let folder;

    if (file.mimetype.startsWith('image/')) {
      type = 'img';
      folder = 'img';
    } else if (file.mimetype.startsWith('video/')) {
      type = 'vid';
      folder = 'vid';
    } else {
      return res.status(400).json({ message: 'Unsupported file type' });
    }

    const bucketName = 'slides_bucket';
    const bucketFileName = `${folder}/${uuidv4()}${path.extname(file.originalname)}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(bucketFileName, file.buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.mimetype
      });

    if (uploadError) {
      return res.status(500).json({ message: 'Upload failed', error: uploadError.message });
    }

    // Insert into DB
    const { data, error } = await supabase
      .from('slides')
      .insert([{
        name,
        duration: Number(duration),
        display,
        fileName: name, // or rename this column later if it annoys you
        type,
        bucketPath: bucketFileName
      }])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ message: 'DB insert failed', error: error.message });
    }

    res.status(201).json({ message: 'File uploaded successfully', file: data });

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

app.patch('/slides/:id', requireLogin, async(req, res)=>{
  const slideId = Number(req.params.id);
  const {name, duration, display} = req.body;

  try {
    const { data, error } = await supabase
      .from('slides')
      .update({ name, duration: Number(duration), display })
      .eq('id', slideId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ message: 'Failed to update slide', error: error.message });
    }

    res.json({ message: 'Slide updated successfully', slide: data });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }

})

// Delete slide
app.delete('/slides/:id', requireLogin, async (req, res) => {
  const slideId = Number(req.params.id);

  try {
    // First, fetch the slide to get its storage path
    const { data: slide, error: fetchError } = await supabase
      .from('slides')
      .select('*')
      .eq('id', slideId)
      .single();

    if (fetchError || !slide) {
      return res.status(404).json({ message: 'Slide not found', error: fetchError?.message });
    }

    // Delete file from Supabase Storage if exists
    if (slide.bucketPath) {
      const { error: storageError } = await supabase
        .storage
        .from('slides_bucket')
        .remove([slide.bucketPath]);

      if (storageError) console.error('Failed to remove file from storage', storageError.message);
    }

    // Delete slide record from database
    const { error: deleteError } = await supabase
      .from('slides')
      .delete()
      .eq('id', slideId);

    if (deleteError) {
      return res.status(500).json({ message: 'Failed to delete slide', error: deleteError.message });
    }

    res.json({ message: 'Slide deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.get('/dashboard', requireLogin, async (req, res) => {
  try {
    // total slides
    const { data: totalData, error: totalError } = await supabase
      .from('slides')
      .select('id', { count: 'exact' });
    if (totalError) throw totalError;
    const totalSlides = totalData.length;

    // image count
    const { data: imageData, error: imageError } = await supabase
      .from('slides')
      .select('id', { count: 'exact' })
      .eq('type', 'img');
    if (imageError) throw imageError;
    const imageCount = imageData.length;

    // last upload + most recent slide name
    const { data: lastData, error: lastError } = await supabase
      .from('slides')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (lastError) throw lastError;
    const lastUpload = lastData.created_at;
    const mostRecentSlide = lastData.name;

    // most used type
    const { data: typeData, error: typeError } = await supabase
      .from('slides')
      .select('type');
    if (typeError) throw typeError;
    const counts = {};
    typeData.forEach(s => counts[s.type] = (counts[s.type] || 0) + 1);
    const mostUsedType = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);

    // average duration
    const { data: durationData, error: durationError } = await supabase
      .from('slides')
      .select('duration');
    if (durationError) throw durationError;
    const totalDuration = durationData.reduce((sum, s) => sum + s.duration, 0);
    const averageDuration = durationData.length ? Math.round(totalDuration / durationData.length) : 0;

    // send final JSON
    res.json({
      totalSlides,
      imageCount,
      lastUpload,
      mostUsedType,
      averageDuration,
      mostRecentSlide
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load dashboard data' });
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
