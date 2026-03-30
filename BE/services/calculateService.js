exports.calculateGear = (data) => {
  const { input } = data;

  // ví dụ đơn giản
  const result = input * 2;

  return {
    input,
    result
  };
};