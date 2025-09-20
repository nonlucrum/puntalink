"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTextTable = parseTextTable;
const numberish = (v) => {
    if (!v)
        return undefined;
    const n = Number(String(v).replace(/\./g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : undefined;
};
function parseTextTable(input) {
    const raw = input.replace(/\r\n?/g, '\n').trim();
    const lines = raw.split('\n').filter(Boolean);
    if (!lines.length)
        return [];
    const header = lines[0];
    const sep = header.includes('\t') ? '\t' : ',';
    const headers = header.split(new RegExp(sep)).map(h => h.trim());
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(new RegExp(sep)).map(c => c.trim());
        const row = {};
        headers.forEach((h, idx) => {
            const key = h.replace(/\s+/g, '_');
            const val = cols[idx] ?? '';
            const num = numberish(val);
            row[h] = num ?? val;
        });
        rows.push(row);
    }
    return rows;
}
