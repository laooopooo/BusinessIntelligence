var extend = require('extend'), mongoose = require('mongoose'), Schema = mongoose.Schema;

var Input = new Schema({
    conditions: [{ type: Schema.Types.ObjectId, ref: 'Condition' }]
});

var Output = new Schema({
    conditions: [{ type: Schema.Types.ObjectId, ref: 'Condition' }]
});

var taskSnapshotSchema = new Schema({
    taskId: { type: Schema.Types.ObjectId, required: 1, index: 1 },
    name: String,
    description: String,
    external_id: String,
    availability: {
        availability_type: Number,
        partners: [{ type: String }]
    },
    inputs: [Input],
    outputs: [Output],
    audit: {
        created_by: { type: Schema.Types.ObjectId, ref: 'User' },
        created_date: Date,
        modified_by: { type: Schema.Types.ObjectId, ref: 'User' },
        modified_date: Date,
        revision: Number
    }
});

taskSnapshotSchema.statics.create = function (task) {
    return new TaskSnapshot({
        taskId: task.id,
        name: task.name,
        description: task.description,
        external_id: task.external_id,
        availability: task.availability,
        inputs: task.inputs,
        outputs: task.outputs,
        audit: task.audit
    });
};

taskSnapshotSchema.methods.toDto = function () {
    return {
        taskId: this.taskId,
        name: this.name,
        description: this.description,
        external_id: this.external_id,
        availability: {
            availability_type: this.availability.availability_type,
            partners: this.availability.partners
        },
        inputs: this.inputs,
        outputs: this.outputs
    };
};

var TaskSnapshot = mongoose.model('TaskSnapshot', taskSnapshotSchema);
module.exports = TaskSnapshot;
//# sourceMappingURL=task.snapshot.js.map
