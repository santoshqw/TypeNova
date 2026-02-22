import jwt from "jsonwebtoken";

export const generateTokenAndSetCookie = (userId, res) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {   // the {userId} is passed in a playload in this creacted token. Is used in protectRoute.js
        expiresIn: "15d"
    });

    res.cookie("jwt", token, {
        maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days in milliseconds
        httpOnly: true, // prevents XSS attacks
        sameSite: "strict", // prevents CSRF attacks
        secure: process.env.NODE_ENV !== "development",
    });

    return token;
};
