const sharp = require('sharp');
const fs = require('fs');

async function processImage() {
  const inputPath = 'public/og-image.jpg';
  const outputPath = 'public/og-image-optimized.jpg';

  try {
    await sharp(inputPath)
      .resize(1200, 630, { fit: 'cover' })
      .jpeg({ quality: 80, progressive: true, mozjpeg: true })
      .toFile(outputPath);

    // Replace original with optimized
    fs.renameSync(outputPath, inputPath);
    
    const stats = fs.statSync(inputPath);
    console.log("Successfully optimized image. New size: " + (stats.size / 1024).toFixed(2) + " KB");
  } catch (error) {
    console.error('Error processing image:', error);
  }
}

processImage();
