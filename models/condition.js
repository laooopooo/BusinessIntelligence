﻿var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var conditionSchema = new Schema({
    name: { type: String, required: 1, index: 1},
    condition_type: { type: String, required: 1 },
    setting: {
        name: { type: String, index: 1 },
        level: String,
        value: { type: String, index: 1 }
    },
    description: { type: String, index: 1},
    ui: {
        input: { type: String, index: 1, default: '' },
        output: { type: String, index: 1, default: '' }
    },
    api: {
        input: { type: String, index: 1, default: '' },
        output: { type: String, index: 1, default: '' }
    },
    note: String,
    audit: {
        created_by: { type: Schema.Types.ObjectId, ref: 'User', index: 1 },
        modified_by: { type: Schema.Types.ObjectId, ref: 'User', index: 1 },
        modified_date: { type: Date, default: Date.now },
        revision: { type: Number, default: 1 }
    }
});

conditionSchema.methods.toDto = function() {
    ///<summary>Converts to DTO</summary>
    
    return {
        id: this.id,
        name: this.name,
        condition_type: this.condition_type,
        setting: this.setting,
        description: this.description,
        ui: this.ui,
        api: this.api,
        note: this.note
    };
};

module.exports = Condition = mongoose.model('Condition', conditionSchema);