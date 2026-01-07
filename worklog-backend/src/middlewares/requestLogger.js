const requestLogger = (req, res, next) => {
    const start = Date.now(); // จับเวลาเริ่ม

    // รอจนกว่า response จะทำงานเสร็จ (finish event)
    res.on('finish', () => {
        const duration = Date.now() - start; // คำนวณเวลาที่ใช้
        const status = res.statusCode;
        const method = req.method;
        const url = req.originalUrl;

        // กำหนดสีให้ Status Code ดูง่ายๆ (Optional)
        let statusColor = status >= 500 ? '\x1b[31m' : // Red
                          status >= 400 ? '\x1b[33m' : // Yellow
                          status >= 300 ? '\x1b[36m' : // Cyan
                          '\x1b[32m';                  // Green
        const resetColor = '\x1b[0m';

        // Format: [METHOD] URL STATUS - Xms
        console.log(`${method} ${url} ${statusColor}${status}${resetColor} - ${duration}ms`);
    });

    next();
};

module.exports = requestLogger;