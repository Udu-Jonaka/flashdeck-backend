const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload.middleware");
const {
  createDeckFromText,
  createDeckFromDocument,
  generateDeck,
  getAllDecks,
  getDeckById,
  deleteDeck,
} = require("../controllers/deck.controller");
const { protect } = require("../middlewares/auth.middleware");

// All deck routes should be protected
router.use(protect);

// Unified generate endpoint — handles both text and file uploads via multipart/form-data
router.post("/generate", upload.single("file"), generateDeck);
router.get("/", getAllDecks);
router.get("/:id", getDeckById);
router.delete("/:id", deleteDeck);

// Legacy separate routes (kept for backward compatibility)
router.post("/generate-from-text", createDeckFromText);
router.post(
  "/generate-from-file",
  upload.single("file"),
  createDeckFromDocument,
);

module.exports = router;
