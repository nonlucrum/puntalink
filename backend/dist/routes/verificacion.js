"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
// TODO: reemplaza los handlers con la lógica real convertida desde JS.
router.get('/', (req, res) => res.send('verificacion OK'));
exports.default = router;
