const verifyToken = (req, res, next) => {
    // Cho phép mọi request đi qua mà không cần kiểm tra Token
    // Khi nào làm đến phần Đăng nhập xong, mình sẽ chỉ bạn viết logic thật ở đây
    console.log("🛡️ Middleware: Đã cho phép request đi qua...");
    next();
};

module.exports = { verifyToken };