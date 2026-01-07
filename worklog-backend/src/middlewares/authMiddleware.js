// middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");

const protect = (req, res, next) => {
    let token = req.cookies.accessToken;

    if (!token) {
        return next(new AppError("You are not logged in! Please log in to get access.", 401));
    }

    try {
        // บังคับว่าต้องเป็น HS256 เท่านั้น
        const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
        req.user = decoded;
        next();
    } catch (error) {
        return next(new AppError("Token invalid or expired", 401));
    }
};

module.exports = protect;