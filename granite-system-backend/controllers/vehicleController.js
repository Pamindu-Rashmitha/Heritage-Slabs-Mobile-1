const Vehicle = require('../models/Vehicle');

const getAllVehicles = async (req, res) => {
    try {
        const vehicles = await Vehicle.find({}).sort({ createdAt: -1 });
        res.status(200).json(vehicles);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching vehicles' });
    }
};

const getAvailableVehicles = async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ status: 'AVAILABLE' });
        res.status(200).json(vehicles);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching available vehicles' });
    }
};

const createVehicle = async (req, res) => {
    try {
        const { licensePlate, type, capacity, status } = req.body;
        const vehicleExists = await Vehicle.findOne({ licensePlate });
        if (vehicleExists) return res.status(400).json({ message: 'Vehicle already exists' });

        const vehicle = await Vehicle.create({ licensePlate, type, capacity, status });
        res.status(201).json(vehicle);
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server error creating vehicle' });
    }
};

const updateVehicle = async (req, res) => {
    try {
        const updatedVehicle = await Vehicle.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );
        if (!updatedVehicle) return res.status(404).json({ message: 'Vehicle not found' });
        res.status(200).json(updatedVehicle);
    } catch (error) {
        res.status(500).json({ message: 'Server error updating vehicle' });
    }
};

const deleteVehicle = async (req, res) => {
    try {
        const deletedVehicle = await Vehicle.findByIdAndDelete(req.params.id);
        if (!deletedVehicle) return res.status(404).json({ message: 'Vehicle not found' });
        res.status(200).json({ message: 'Vehicle deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error deleting vehicle' });
    }
};

module.exports = { getAllVehicles, getAvailableVehicles, createVehicle, updateVehicle, deleteVehicle };
