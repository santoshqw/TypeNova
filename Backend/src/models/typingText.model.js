import mongoose from "mongoose";

const { Schema } = mongoose;

const typingTextSchema = new Schema(
  {
    text: {
      type: String,
      required: true,
      minLength: 800,
      maxLength: 1500,
    },
    number: {
      type: Boolean,
      default: false,
    },
    punctuation: {
      type: Boolean,
      default: false,
    },
    symbol: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const TypingText = mongoose.model("TypingText", typingTextSchema);

export default TypingText;
