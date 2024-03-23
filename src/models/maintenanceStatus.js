const mongoose = require('mongoose');

const maintenanceStatusSchema = new mongoose.Schema({
    isMaintenanceMode: Boolean,
});

const MaintenanceStatus = mongoose.model('MaintenanceStatus', maintenanceStatusSchema);

module.exports = MaintenanceStatus;
