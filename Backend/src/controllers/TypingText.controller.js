import TypingText from "../models/typingText.model";

export const createTypingText = async (req, res) => {
  try {
    const { text, textInfo } = req.body;

    if (!text || !textInfo) {
      console.log("error on text and text info");
      return res.status(400).json({ message: "both fields are required" });
    }

    const newTypingText = await TypingText.create({
      text,
      number: textInfo.number,
      punctuation: textInfo.punctuation,
      symbol: textInfo.symbol,
    });

    return res
      .status(201)
      .json({ message: "new typing text created", info: newTypingText });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "internal server error" });
  }
};
