const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Enable CORS for frontend access
app.use(cors());
app.use(express.json());

// Multer config to save uploads to /uploads
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Health check
app.get('/', (req, res) => {
  res.send('🚀 ContractorReg backend is running');
});

// Upload endpoint
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');


app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  const filePath = req.file.path;

  try {
    let text = '';

    if (ext === '.pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      text = pdfData.text;
    } else if (ext === '.docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      text = result.value;
    } else {
      return res.status(400).json({ error: 'Unsupported file type' });
    }


    const abnMatch = text.match(/\b(\d[\s-]?){11}\b/g);

    let abn = null;
    if (abnMatch) {

    abn = abnMatch[0].replace(/[^\d]/g, '');
    }

    res.json({
      message: '✅ File uploaded and parsed',
      filename: req.file.filename,abn,
      extractedText: text
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to extract text' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
