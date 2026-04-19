const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const { protect } = require('../middleware/authMiddleware'); 

router.get('/', protect, vehicleController.getAllVehicles);
router.get('/available', protect, vehicleController.getAvailableVehicles);
router.post('/', protect, vehicleController.createVehicle);
router.put('/:id', protect, vehicleController.updateVehicle);
router.delete('/:id', protect, vehicleController.deleteVehicle);

module.exports = router;
