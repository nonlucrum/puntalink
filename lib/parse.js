const parse = {
  csvToArray: (csv) => {
    if (!csv) return [];
    const [headerLine, ...lines] = csv.trim().split('\n');
    const headers = headerLine.split(',').map(h => h.trim());
    return lines.map(line => {
      const values = line.split(',').map(v => v.trim());
      return headers.reduce((obj, header, idx) => {
        obj[header] = values[idx];
        return obj;
      }, {});
    });
  },

  arrayToCsv: (data) => {
    if (!Array.isArray(data) || data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map(obj => headers.map(h => obj[h]).join(','));
    return [headers.join(','), ...rows].join('\n');
  }
};

module.exports = parse;
