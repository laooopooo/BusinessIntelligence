﻿var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var permissionSchema = new Schema({
    name: { type: String, required: 1, index: { unique: 1 } },
    description: { type: String, default: '' },
    audit: {
        modified_date: { type: Date, default: Date.now },
        modified_by: { type: String, default: '' }
    }
});

module.exports = Permission = mongoose.model('Permission', permissionSchema);