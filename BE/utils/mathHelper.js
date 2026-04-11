// Hàm làm tròn lên giá trị chuẩn gần nhất trong mảng tiêu chuẩn
const roundToStandard = (value, standardArray) => {
    // Tìm giá trị nhỏ nhất trong mảng mà lớn hơn hoặc bằng value
    const standardValue = standardArray.find(std => std >= value);
    return standardValue || value; // Trả về chính nó nếu vượt mảng
};

module.exports = {
    roundToStandard
};