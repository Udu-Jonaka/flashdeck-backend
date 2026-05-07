const Deck = require("../models/Deck");
const { generateFlashcards } = require("../services/groq.service");
const { extractTextFromFile } = require("../services/document.service");

const createDeckFromText = async (req, res) => {
  try {
    const { title, text, difficulty, amount } = req.body;

    // 1. Basic Validation
    if (!text || !difficulty || !amount) {
      return res
        .status(400)
        .json({ message: "Please provide text, difficulty, and amount" });
    }

    // 2. Call the AI Service
    // This might take 1-3 seconds depending on the text size, so we await it
    const generatedCards = await generateFlashcards(text, difficulty, amount);

    if (!generatedCards || generatedCards.length === 0) {
      return res
        .status(500)
        .json({ message: "AI failed to generate cards. Please try again." });
    }

    // 3. Save to the Database
    // Notice how we use req.user.id from your JWT middleware!
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
  } catch (error) {
    console.error("Deck Generation Error:", error);
    res.status(500).json({ message: "Server error during deck generation" });
  }
};

// FETCH ALL DECKS FOR THE LOGGED-IN USER
const getAllDecks = async (req, res) => {
  try {
    // We find all decks where the 'user' field matches the current logged-in user ID
    // We sort by 'createdAt' so the newest decks appear first
    const decks = await Deck.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      count: decks.length,
      decks,
    });
  } catch (error) {
    console.error("Fetch Decks Error:", error);
    res.status(500).json({ message: "Server error while fetching decks" });
  }
};

// FETCH A SINGLE DECK BY ID
const getDeckById = async (req, res) => {
  try {
    const deck = await Deck.findById(req.params.id);

    if (!deck) {
      return res.status(404).json({ message: "Deck not found" });
    }

    // Security Check: Ensure the deck belongs to the user trying to view it
    if (deck.user.toString() !== req.user._id.toString()) {
      return res
        .status(401)
        .json({ message: "Not authorized to view this deck" });
    }

    res.status(200).json(deck);
  } catch (error) {
    console.error("Fetch Single Deck Error:", error);
    res.status(500).json({ message: "Server error while fetching the deck" });
  }
};

// DELETE A DECK
const deleteDeck = async (req, res) => {
  try {
    const deck = await Deck.findById(req.params.id);

    if (!deck) {
      return res.status(404).json({ message: "Deck not found" });
    }

    // Security Check: Ensure the deck belongs to the user trying to delete it
    if (deck.user.toString() !== req.user._id.toString()) {
      return res
        .status(401)
        .json({ message: "Not authorized to delete this deck" });
    }

    await deck.deleteOne();
    res.status(200).json({ message: "Deck removed successfully" });
  } catch (error) {
    console.error("Delete Deck Error:", error);
    res.status(500).json({ message: "Server error while deleting the deck" });
  }
};

const createDeckFromDocument = async (req, res) => {
  try {
    const { title, difficulty, amount } = req.body;

    // Check if file exists
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a file" });
    }

    // 1. Extract text from the uploaded file
    const extractedText = await extractTextFromFile(req.file);

    // 2. Pass that text to our existing Groq logic
    const generatedCards = await generateFlashcards(
      extractedText,
      difficulty,
      amount,
    );

    // 3. Save to DB (Same as before)
    const newDeck = new Deck({
      user: req.user._id,
      title: title || req.file.originalname, // Use filename as title if none provided
      sourceType: "document",
      difficulty: difficulty.toLowerCase(),
      cards: generatedCards,
    });

    const savedDeck = await newDeck.save();

    res.status(201).json({
      message: "Deck generated from document successfully!",
      deck: savedDeck,
    });
  } catch (error) {
    console.error("Document Processing Error:", error);
    res
      .status(500)
      .json({
        message: error.message || "Server error during document processing",
      });
  }
};

const getUserDecks = async (req, res) => {
  try {
    // req.user.id comes from your auth middleware (verifying the JWT)
    const decks = await Deck.find({ user: req.user.id }).sort({ createdAt: -1 });
    
    res.status(200).json(decks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch decks" });
  }
};

// UNIFIED GENERATE ENDPOINT
// Handles both text and file uploads from the frontend's single /generate route
const generateDeck = async (req, res) => {
  try {
    const { topic, text, difficulty } = req.body;
    const amount = req.body.amount || 10; // Default to 10 cards if not specified
    const title = topic || "Untitled Study Deck";

    // Determine if this is a file upload or text-based generation
    if (req.file) {
      // --- File-based generation ---
      const extractedText = await extractTextFromFile(req.file);

      const generatedCards = await generateFlashcards(
        extractedText,
        difficulty || "medium",
        amount,
      );

      if (!generatedCards || generatedCards.length === 0) {
        return res
          .status(500)
          .json({ message: "AI failed to generate cards. Please try again." });
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
        return res
          .status(400)
          .json({ message: "Please provide text or upload a file." });
      }

      const generatedCards = await generateFlashcards(
        text,
        difficulty || "medium",
        amount,
      );

      if (!generatedCards || generatedCards.length === 0) {
        return res
          .status(500)
          .json({ message: "AI failed to generate cards. Please try again." });
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
  } catch (error) {
    console.error("Deck Generation Error:", error);
    res
      .status(500)
      .json({ message: error.message || "Server error during deck generation" });
  }
};

// Add it to your exports!
module.exports = {
  createDeckFromText,
  createDeckFromDocument,
  generateDeck,
  getAllDecks,
  getUserDecks,
  getDeckById,
  deleteDeck,
};

