const mongoose = require("mongoose");
const deckSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }, // Ties the deck to the verified profile
    title: {
      type: String,
      default: "Untitled Study Deck",
    },
    sourceType: {
      type: String,
      enum: ["text", "document"],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },
    cards: [
      {
        q: { type: String, required: true }, // The front of the card
        a: { type: String, required: true }, // The back of the card
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Deck", deckSchema);
