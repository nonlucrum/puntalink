"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcular = calcular;
const estructural_js_1 = require("../services/estructural.js");
function calcular(req, res) {
    try {
        const input = estructural_js_1.InputSchema.parse(req.body);
        const result = (0, estructural_js_1.calcularEstructural)(input);
        res.json(result);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}
