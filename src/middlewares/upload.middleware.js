const multer = require("multer");

// We use memory storage because we don't need to keep the file
// after we extract the text for Groq.
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit files to 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error("Invalid file type. Only PDF, DOCX, and TXT are allowed."),
        false,
      );
    }
  },
});

module.exports = upload;
