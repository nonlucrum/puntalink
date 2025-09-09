const units = {
  toPercentage: (value, decimals = 2) => {
    return `${(value * 100).toFixed(decimals)}%`;
  },
  fromPercentage: (str) => {
    return parseFloat(str.replace('%', '')) / 100;
  },
  round: (value, decimals = 2) => {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }
};

module.exports = units;
