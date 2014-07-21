﻿var mongoose = require('mongoose'), Schema = mongoose.Schema;

var permissionSchema = new Schema({
    name: { type: String, required: 1, index: { unique: 1 } },
    description: { type: String, default: '' }
});

var Permission = mongoose.model('Permission', permissionSchema);
module.exports = Permission;
//# sourceMappingURL=permission.js.map
