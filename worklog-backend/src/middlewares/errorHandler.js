const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        // stack: err.stack // เปิดบรรทัดนี้ถ้าอยากเห็น Stack Trace ตอน Dev
    });
};

module.exports = errorHandler;