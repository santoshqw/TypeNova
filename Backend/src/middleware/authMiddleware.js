 const jwt = require("jsonwebtoken");

export const isLoggedIn = (req, res, next) => {
  try {
    // get token from cookie
     const token = req.cookies.jwt;

    // check token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "User not logged in",
      });
    }

    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // attach user info to request
    req.user = decoded;
    next(); 

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

