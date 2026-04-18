const PurchaseOrder = require('../models/PurchaseOrder');

const createPurchaseOrder = async (req, res) => {
    try {
        const { supplierName, supplierContact, items, expectedDeliveryDate, notes } = req.body;

        if (!supplierName) {
            return res.status(400).json({ message: 'Supplier name is required' });
        }
        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'At least one item is required' });
        }

        const processedItems = items.map(item => ({
            product: item.product,
            stoneName: item.stoneName,
            quantityInSqFt: item.quantityInSqFt,
            unitPrice: item.unitPrice,
            subtotal: item.quantityInSqFt * item.unitPrice,
        }));

        const totalAmount = processedItems.reduce((sum, item) => sum + item.subtotal, 0);

        const purchaseOrder = await PurchaseOrder.create({
            supplierName,
            supplierContact,
            items: processedItems,
            totalAmount,
            expectedDeliveryDate: expectedDeliveryDate || undefined,
            notes,
            createdBy: req.user.id,
        });

        res.status(201).json(purchaseOrder);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getPurchaseOrders = async (req, res) => {
    try {
        const purchaseOrders = await PurchaseOrder
            .find({})
            .populate('createdBy', 'name email')
            .populate('items.product', 'stoneName pricePerSqFt stockInSqFt imageUrl')
            .sort({ createdAt: -1 });
        res.status(200).json(purchaseOrders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getPurchaseOrderById = async (req, res) => {
    try {
        const purchaseOrder = await PurchaseOrder
            .findById(req.params.id)
            .populate('createdBy', 'name email')
            .populate('items.product', 'stoneName pricePerSqFt stockInSqFt imageUrl');

        if (!purchaseOrder) {
            return res.status(404).json({ message: 'Purchase order not found' });
        }

        res.status(200).json(purchaseOrder);
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid ID format' });
        }
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const updatePurchaseOrder = async (req, res) => {
    try {
        const purchaseOrder = await PurchaseOrder.findById(req.params.id);
        if (!purchaseOrder) {
            return res.status(404).json({ message: 'Purchase order not found' });
        }

        const { supplierName, supplierContact, items, status, expectedDeliveryDate, notes } = req.body;

        const updateData = {
            supplierName,
            supplierContact,
            status,
            expectedDeliveryDate: expectedDeliveryDate || undefined,
            notes,
        };

        if (items && items.length > 0) {
            updateData.items = items.map(item => ({
                product: item.product,
                stoneName: item.stoneName,
                quantityInSqFt: item.quantityInSqFt,
                unitPrice: item.unitPrice,
                subtotal: item.quantityInSqFt * item.unitPrice,
            }));
            updateData.totalAmount = updateData.items.reduce((sum, item) => sum + item.subtotal, 0);
        }

        const updated = await PurchaseOrder.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json(updated);
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid ID format' });
        }
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const deletePurchaseOrder = async (req, res) => {
    try {
        const purchaseOrder = await PurchaseOrder.findById(req.params.id);
        if (!purchaseOrder) {
            return res.status(404).json({ message: 'Purchase order not found' });
        }

        await purchaseOrder.deleteOne();
        res.status(200).json({ id: req.params.id, message: 'Purchase order deleted' });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid ID format' });
        }
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    createPurchaseOrder,
    getPurchaseOrders,
    getPurchaseOrderById,
    updatePurchaseOrder,
    deletePurchaseOrder,
};
