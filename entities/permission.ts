var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var permissionSchema = new Schema({
    name: { type: String, required: 1, index: { unique: 1 } },
    description: { type: String, default: '' }
});

var Permission = <Permission>mongoose.model('Permission', permissionSchema);
export = Permission;