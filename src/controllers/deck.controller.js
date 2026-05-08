const Deck = require("../models/Deck");
const { generateFlashcards } = require("../services/groq.service");
const { extractTextFromFile } = require("../services/document.service");
const asyncHandler = require("../utils/asyncHandler");

// CREATE DECK FROM TEXT (LEGACY)
const createDeckFromText = asyncHandler(async (req, res) => {
  const { title, text, difficulty, amount } = req.body;

  // 1. Basic Validation
  if (!text || !difficulty || !amount) {
    res.status(400);
    throw new Error("Please provide text, difficulty, and amount");
  }

  // 2. Call the AI Service
  const generatedCards = await generateFlashcards(text, difficulty, amount);

  if (!generatedCards || generatedCards.length === 0) {
    res.status(500);
    throw new Error("AI failed to generate cards. Please try again.");
  }

  // 3. Save to the Database
  const newDeck = new Deck({
    user: req.user._id,
    title: title || "Untitled Study Deck",
    sourceType: "text",
    difficulty: difficulty.toLowerCase(),
    cards: generatedCards,
  });

  const savedDeck = await newDeck.save();

  // 4. Send the final deck back to the frontend
  res.status(201).json({
    message: "Deck generated successfully!",
    deck: savedDeck,
  });
});

// FETCH ALL DECKS FOR THE LOGGED-IN USER
const getAllDecks = asyncHandler(async (req, res) => {
  const decks = await Deck.find({ user: req.user._id }).sort({
    createdAt: -1,
  });

  res.status(200).json({
    count: decks.length,
    decks,
  });
});

// FETCH A SINGLE DECK BY ID
const getDeckById = asyncHandler(async (req, res) => {
  const deck = await Deck.findById(req.params.id);

  if (!deck) {
    res.status(404);
    throw new Error("Deck not found");
  }

  // Security Check
  if (deck.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error("Not authorized to view this deck");
  }

  res.status(200).json(deck);
});

// DELETE A DECK
const deleteDeck = asyncHandler(async (req, res) => {
  const deck = await Deck.findById(req.params.id);

  if (!deck) {
    res.status(404);
    throw new Error("Deck not found");
  }

  // Security Check
  if (deck.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error("Not authorized to delete this deck");
  }

  await deck.deleteOne();
  res.status(200).json({ message: "Deck removed successfully" });
});

// CREATE DECK FROM DOCUMENT (LEGACY)
const createDeckFromDocument = asyncHandler(async (req, res) => {
  const { title, difficulty, amount } = req.body;

  if (!req.file) {
    res.status(400);
    throw new Error("Please upload a file");
  }

  // 1. Extract text from the uploaded file
  const extractedText = await extractTextFromFile(req.file);

  // 2. Pass that text to our existing Groq logic
  const generatedCards = await generateFlashcards(
    extractedText,
    difficulty,
    amount
  );

  // 3. Save to DB
  const newDeck = new Deck({
    user: req.user._id,
    title: title || req.file.originalname,
    sourceType: "document",
    difficulty: difficulty.toLowerCase(),
    cards: generatedCards,
  });

  const savedDeck = await newDeck.save();

  res.status(201).json({
    message: "Deck generated from document successfully!",
    deck: savedDeck,
  });
});

// GET USER DECKS (SIMPLIFIED)
const getUserDecks = asyncHandler(async (req, res) => {
  const decks = await Deck.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.status(200).json(decks);
});

// UNIFIED GENERATE ENDPOINT
const generateDeck = asyncHandler(async (req, res) => {
  const { topic, text, difficulty } = req.body;
  const amount = req.body.amount || 10;
  const title = topic || "Untitled Study Deck";

  // Determine if this is a file upload or text-based generation
  if (req.file) {
    // --- File-based generation ---
    const extractedText = await extractTextFromFile(req.file);

    const generatedCards = await generateFlashcards(
      extractedText,
      difficulty || "medium",
      amount
    );

    if (!generatedCards || generatedCards.length === 0) {
      res.status(500);
      throw new Error("AI failed to generate cards. Please try again.");
    }

    const newDeck = new Deck({
      user: req.user._id,
      title: title,
      sourceType: "document",
      difficulty: (difficulty || "medium").toLowerCase(),
      cards: generatedCards,
    });

    const savedDeck = await newDeck.save();

    return res.status(201).json({
      message: "Deck generated from document successfully!",
      deck: savedDeck,
    });
  } else {
    // --- Text-based generation ---
    if (!text) {
      res.status(400);
      throw new Error("Please provide text or upload a file.");
    }

    const generatedCards = await generateFlashcards(
      text,
      difficulty || "medium",
      amount
    );

    if (!generatedCards || generatedCards.length === 0) {
      res.status(500);
      throw new Error("AI failed to generate cards. Please try again.");
    }

    const newDeck = new Deck({
      user: req.user._id,
      title: title,
      sourceType: "text",
      difficulty: (difficulty || "medium").toLowerCase(),
      cards: generatedCards,
    });

    const savedDeck = await newDeck.save();

    return res.status(201).json({
      message: "Deck generated successfully!",
      deck: savedDeck,
    });
  }
});

module.exports = {
  createDeckFromText,
  createDeckFromDocument,
  generateDeck,
  getAllDecks,
  getUserDecks,
  getDeckById,
  deleteDeck,
};

