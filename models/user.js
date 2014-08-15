/// <reference path="../lib.d.ts" />
var util = require('util'), mongoose = require('mongoose'), Schema = mongoose.Schema;

var userSchema = new Schema({
    email: { type: String, required: 1, index: { unique: 1 } },
    password: { type: String, required: 1, index: 1, select: 0 },
    groups: [{ type: Schema.Types.ObjectId, ref: 'Group', index: 1 }],
    permissions: [{ type: Schema.Types.ObjectId, ref: 'Permission', index: 1 }],
    first_name: { type: String, default: '' },
    last_name: { type: String, default: '' },
    avatar: String,
    audit: {
        modified_date: { type: Date, default: Date.now },
        revision: { type: Number, default: 1 }
    },
    metrics: {
        previous_login_date: { type: Date, default: Date.now },
        current_login_date: { type: Date, default: Date.now }
    }
});

userSchema.methods.toDto = function () {
    var dto = {
        id: this.id,
        email: this.email,
        first_name: this.first_name,
        last_name: this.last_name,
        display_name: '',
        avatar: this.avatar,
        access: this.access,
        metrics: this.metrics
    };

    if (this.first_name || this.last_name) {
        dto.display_name = util.format('%s %s', this.first_name, this.last_name);
    } else {
        dto.display_name = util.format('%s', this.email);
    }

    return dto;
};

var User = mongoose.model('User', userSchema);
module.exports = User;
//# sourceMappingURL=user.js.map
