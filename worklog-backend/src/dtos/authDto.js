// dtos/authDto.js
const AppError = require("../utils/AppError");

class RegisterDTO {
    constructor({ username, email, password, firstname, lastname }) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.firstname = firstname;
        this.lastname = lastname;
    }

    validate() {
        if (!this.username) throw new AppError("Username is required", 400);
        if (!this.email || !this.email.includes("@")) throw new AppError("Invalid email format", 400);
        if (!this.firstname) throw new AppError("Firstname is required", 400);
        if (!this.lastname) throw new AppError("Lastname is required", 400);

        // Password Validation
        // > 8 chars (คือ 9 ตัวขึ้นไป), 1 number, 1 special char
        const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{9,}$/;
        
        if (!this.password || !passwordRegex.test(this.password)) {
            throw new AppError("Password must be > 8 characters, contain at least 1 number and 1 special character", 400);
        }
    }
}

class LoginDTO {
    constructor({ identifier, password }) {
        this.identifier = identifier; // จะเป็น username หรือ email ก็ได้
        this.password = password;
    }

    validate() {
        if (!this.identifier || !this.password) {
            throw new AppError("Username/Email and password are required", 400);
        }
    }
}

module.exports = { RegisterDTO, LoginDTO };