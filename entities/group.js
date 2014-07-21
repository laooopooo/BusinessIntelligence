var mongoose = require('mongoose'), Schema = mongoose.Schema;

var groupSchema = new Schema({
    name: { type: String, required: 1, index: { unique: 1 } },
    permissions: [{ type: Schema.Types.ObjectId, ref: 'Permission', index: 1 }]
});

var Group = mongoose.model('Group', groupSchema);
module.exports = Group;
//# sourceMappingURL=group.js.map
