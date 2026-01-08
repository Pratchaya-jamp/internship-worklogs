// controllers/authController.js
const authService = require("../services/authService");
const { RegisterDTO, LoginDTO } = require("../dtos/authDto");

// Config Cookie Options
const cookieOptions = {
    httpOnly: true,
    secure: true, // set true ถ้าใช้ https (Production)
    sameSite: 'none'
};

class AuthController {
    register = async (req, res, next) => {
        try {
            const dto = new RegisterDTO(req.body);
            dto.validate();
            const user = await authService.register(dto);
            res.status(201).json({ status: 'success', data: user });
        } catch (error) { next(error); }
    }

    login = async (req, res, next) => {
        try {
            const dto = new LoginDTO(req.body);
            dto.validate();

            const { accessToken, refreshToken, user } = await authService.login(dto.identifier, dto.password);

            // ฝัง Cookies
            res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 30 * 60 * 1000 }); // 30 mins
            res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 24 * 60 * 60 * 1000 }); // 24 hours

            res.status(200).json({ status: 'success', data: user });
        } catch (error) { next(error); }
    }

    refreshToken = async (req, res, next) => {
        try {
            const refreshToken = req.cookies.refreshToken;
            if (!refreshToken) return res.status(401).json({ error: "Refresh Token missing" });

            const newAccessToken = await authService.refreshToken(refreshToken);

            // Update Access Token Cookie
            res.cookie('accessToken', newAccessToken, { ...cookieOptions, maxAge: 30 * 60 * 1000 });

            res.status(200).json({ status: 'success', message: "Token Refreshed" });
        } catch (error) {
            // ถ้า Refresh ไม่ผ่าน (หมดอายุ/ปลอม) -> Clear Cookies ให้ Login ใหม่
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
            res.status(401).json({ error: "Session expired, please login again" });
        }
    }

    getMe = async (req, res, next) => {
        try {
            // req.user มาจาก Middleware
            const user = await authService.getUserProfile(req.user.id);
            res.status(200).json({ status: 'success', data: user });
        } catch (error) { next(error); }
    }

    logout = (req, res) => {
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        res.status(200).json({ status: 'success', message: 'Logged out successfully' });
    }
}

module.exports = new AuthController();