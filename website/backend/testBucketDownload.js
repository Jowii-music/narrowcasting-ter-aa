import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// 1️⃣ Replace with your Supabase project info
const SUPABASE_URL = 'https://epujbpdaimfxwchjfyyf.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_12CQtJR7ug2bPh-M0rjdvw_WtGMlHNB'; // required for private buckets
const BUCKET_NAME = 'slides_bucket';
const FILE_NAME = 'test_python_logo.png'; // e.g., 'images/photo.png'
const LOCAL_PATH = './downloaded_image.png'; // path to save locally

// 2️⃣ Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function downloadImage() {
  try {
    const { data, error } = await supabase
      .storage
      .from(BUCKET_NAME)
      .download(FILE_PATH);

    if (error) {
      console.error('Error downloading file:', JSON.stringify(error, null, 2));
      return;
    }

    // 4️⃣ Convert Blob to Buffer and save
    const buffer = Buffer.from(await data.arrayBuffer());
    fs.writeFileSync(LOCAL_PATH, buffer);

    console.log(`✅ Image saved to project folder: ${LOCAL_PATH}`);
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

downloadImage();
