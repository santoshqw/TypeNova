
import TypingText from "../models/typingText.model.js";

function getTypingTextController() {
  return {
    createTypingText: async (req, res) => {
      try {
        const { text, textInfo } = req.body;

        if (!text || !textInfo) {
         
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
       
        return res.status(500).json({ message: "internal server error" });
      }
    },
   
  };
}

export default getTypingTextController;
