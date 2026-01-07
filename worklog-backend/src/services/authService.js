// services/authService.js
const userRepository = require("../repositories/userRepository");
const argon2 = require("argon2");
const jwt = require("jsonwebtoken");

class AuthService {
    // Helper function สร้าง Tokens
    generateTokens(userId) {
        // Access Token (30 นาที) - HS256
        const accessToken = jwt.sign(
            { id: userId }, 
            process.env.JWT_SECRET, 
            { 
                expiresIn: "30m",
                algorithm: "HS256" // <--- ระบุชัดเจน
            }
        );

        // Refresh Token (24 ชม.) - HS256
        const refreshToken = jwt.sign(
            { id: userId }, 
            process.env.JWT_SECRET, 
            { 
                expiresIn: "24h",
                algorithm: "HS256" // <--- ระบุชัดเจน
            }
        );

        return { accessToken, refreshToken };
    }

    async register(data) {
        const isDuplicate = await userRepository.checkDuplicate(data.username, data.email);
        if (isDuplicate) throw new Error("Username or Email already exists");

        const hashedPassword = await argon2.hash(data.password);
        
        const userId = await userRepository.create({
            ...data,
            password: hashedPassword
        });

        return { id: userId, email: data.email, username: data.username, firstname: data.firstname, lastname: data.lastname };
    }

    async login(identifier, password) {
        const user = await userRepository.findByIdentifier(identifier);
        if (!user) throw new Error("Invalid login credentials");

        const isMatch = await argon2.verify(user.password, password);
        if (!isMatch) throw new Error("Invalid login credentials");

        // สร้าง 2 Tokens
        const tokens = this.generateTokens(user.id);

        return { 
            ...tokens,
            user: { id: user.id, username: user.username, firstname: user.firstname, lastname: user.lastname } 
        };
    }

    async refreshToken(oldRefreshToken) {
        try {
            // Verify ก็ต้องระบุ algo ด้วยเพื่อความปลอดภัย (กัน Downgrade attack)
            const decoded = jwt.verify(oldRefreshToken, process.env.JWT_SECRET, { algorithms: ['HS256'] });
            
            const user = await userRepository.findById(decoded.id);
            if(!user) throw new Error("User not found");

            // สร้าง Access Token ใหม่
            const accessToken = jwt.sign(
                { id: user.id }, 
                process.env.JWT_SECRET, 
                { 
                    expiresIn: "30m",
                    algorithm: "HS256" 
                }
            );
            
            return accessToken;
        } catch (error) {
            throw new Error("Invalid Refresh Token");
        }
    }

    async getUserProfile(id) {
        const user = await userRepository.findById(id);
        if(!user) throw new Error("User not found");
        return user;
    }
}

module.exports = new AuthService();