// utils/upload.js
import multer from 'multer';

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
      // Word Documents
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx

      // Excel Documents
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx

      // PowerPoint
      'application/vnd.ms-powerpoint', // .ppt
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx

      // PDF and Text
      'application/pdf', // .pdf
      'text/plain',      // .txt
      'text/csv',        // .csv

      // Images
      'image/jpeg',      // .jpg/.jpeg
      'image/png',       // .png
    ];

  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

const upload = multer({
  storage: multer.memoryStorage(), // Store file in memory as Buffer
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 15 // 16MB limit (MongoDB document size limit is 16MB)
  }
});

export default upload;