const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const sumberDanaController = require('../controllers/sumberDana.controller');
const { verifikasiToken } = require('../middleware/auth');

// Validasi untuk input sumber dana
const validateSumberDana = [
  body('nama')
    .notEmpty()
    .withMessage('Nama sumber dana harus diisi')
    .isLength({ min: 3, max: 255 })
    .withMessage('Nama sumber dana harus antara 3-255 karakter')
    .trim()
];

// Routes untuk sumber dana
router.get('/', verifikasiToken, sumberDanaController.dapatkanSemuaSumberDana);
router.get('/dropdown', verifikasiToken, sumberDanaController.dapatkanSemuaSumberDanaDropdown);
router.get('/:id', verifikasiToken, sumberDanaController.dapatkanSumberDanaById);
router.post('/', verifikasiToken, validateSumberDana, sumberDanaController.buatSumberDana);
router.put('/:id', verifikasiToken, validateSumberDana, sumberDanaController.updateSumberDana);
router.delete('/:id', verifikasiToken, sumberDanaController.hapusSumberDana);

module.exports = router;