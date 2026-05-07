const { PdfReader } = require("pdfreader");
const mammoth = require("mammoth");

// Helper function to extract text using PdfReader
const getPdfText = (buffer) => {
  return new Promise((resolve, reject) => {
    let text = "";
    new PdfReader().parseBuffer(buffer, (err, item) => {
      if (err) reject(err);
      else if (!item)
        resolve(text); // End of file
      else if (item.text) text += item.text + " ";
    });
  });
};

const extractTextFromFile = async (file) => {
  try {
    const { mimetype, buffer } = file;

    if (mimetype === "application/pdf") {
      return await getPdfText(buffer);
    }

    if (
      mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const data = await mammoth.extractRawText({ buffer });
      return data.value;
    }

    if (mimetype === "text/plain") {
      return buffer.toString("utf8");
    }

    throw new Error(`Unsupported mimetype: ${mimetype}`);
  } catch (error) {
    console.error("Extraction Error:", error);
    throw new Error("Failed to extract text from file");
  }
};

module.exports = { extractTextFromFile };
