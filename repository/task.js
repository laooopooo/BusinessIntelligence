var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var TaskSnapshot = require('../models/task.snapshot'), Enumerable = require('linq'), async = require('async'), extend = require('extend'), Util = require('../modules/util');

var Task = require('../models/task');
var BaseRepository = require('./base');
var ConditionRepository = require('./condition');

var TaskRepository = (function (_super) {
    __extends(TaskRepository, _super);
    function TaskRepository(user) {
        _super.call(this, user);
    }
    TaskRepository.prototype.findByName = function (name, done) {
        return Task.find({
            name: new RegExp(name, 'i')
        }, done);
    };

    TaskRepository.prototype.getById = function (id, done) {
        var _this = this;
        return Task.findById(id, function (err, task) {
            if (err)
                return done(err);

            var taskDto = task.toDto();
            return async.parallel([
                function (callback) {
                    return async.map(task.inputs, function (input, inputCallback) {
                        return new ConditionRepository(_this.user).getByIds(input.conditions, function (err, conditions) {
                            if (err)
                                return inputCallback(err);

                            return inputCallback(err, {
                                id: input.id,
                                conditions: Enumerable.from(conditions).orderBy(function (condition) {
                                    return condition.name;
                                }).select(function (condition) {
                                    return condition.toDto();
                                }).toArray()
                            });
                        });
                    }, function (err, inputs) {
                        if (err)
                            return callback(err);

                        taskDto.inputs = inputs;

                        return callback(err);
                    });
                },
                function (callback) {
                    return async.map(task.outputs, function (output, outputProcessedCallback) {
                        return new ConditionRepository(_this.user).getByIds(output.conditions, function (err, conditions) {
                            if (err)
                                return outputProcessedCallback(err);

                            return async.map(conditions, function (condition, conditionProcessedCallback) {
                                return async.map(condition.affects, function (affect, affectProcessedCallback) {
                                    return Task.findById(affect.task, function (err, task) {
                                        if (err)
                                            return affectProcessedCallback(err);

                                        return affectProcessedCallback(err, {
                                            id: affect.id,
                                            task: task.toDto(),
                                            description: affect.description
                                        });
                                    });
                                }, function (err, affects) {
                                    if (err)
                                        return conditionProcessedCallback(err);

                                    condition = extend(condition.toDto(), {
                                        affects: affects
                                    });

                                    return conditionProcessedCallback(err, condition);
                                });
                            }, function (err, conditions) {
                                return outputProcessedCallback(err, {
                                    id: output.id,
                                    conditions: Enumerable.from(conditions).orderBy(function (condition) {
                                        return condition.name;
                                    }).toArray()
                                });
                            });
                        });
                    }, function (err, outputs) {
                        if (err)
                            return callback(err);

                        taskDto.outputs = outputs;

                        return callback(err);
                    });
                }
            ], function (err) {
                if (err)
                    return done(err);

                return done(err, taskDto);
            });
        });
    };

    TaskRepository.prototype.getByIds = function (ids, done) {
        return Task.find({
            _id: {
                $in: ids
            }
        }, done);
    };

    TaskRepository.prototype.save = function (taskDto, done) {
        var _this = this;
        var conditionRepository = new ConditionRepository(this.user, {
            taskRepository: this
        });

        return Task.findById(taskDto.id, function (err, task) {
            task = task || new Task({
                audit: {
                    created_by: _this.user.id,
                    created_date: new Date()
                }
            });

            extend(task, {
                id: taskDto.id,
                name: taskDto.name,
                description: taskDto.description,
                external_id: taskDto.external_id,
                availability: {
                    availability_type: taskDto.availability.availability_type,
                    partners: taskDto.availability.partners
                },
                audit: extend(true, {}, task.audit, {
                    modified_by: _this.user.id,
                    modified_date: new Date(),
                    revision: task.audit.revision + 1
                })
            });

            return async.series([
                function (callback) {
                    return async.mapSeries(Enumerable.from(taskDto.inputs).where(function (input) {
                        return input.conditions.length;
                    }).toArray(), function (input, inputCallback) {
                        return async.mapSeries(input.conditions, function (condition, conditionCallback) {
                            return conditionRepository.save(condition, conditionCallback);
                        }, function (err, conditions) {
                            if (err)
                                return inputCallback(err);

                            return inputCallback(err, {
                                _id: input.id,
                                conditions: Enumerable.from(conditions).select(function (condition) {
                                    return condition.id;
                                }).toArray()
                            });
                        });
                    }, function (err, inputs) {
                        if (err)
                            return callback(err);

                        task.inputs = inputs;

                        return callback(err);
                    });
                },
                function (callback) {
                    return async.mapSeries(Enumerable.from(taskDto.outputs).where(function (output) {
                        return output.conditions.length;
                    }).toArray(), function (output, outputCallback) {
                        return async.mapSeries(output.conditions, function (condition, conditionCallback) {
                            return conditionRepository.save(condition, conditionCallback);
                        }, function (err, conditions) {
                            if (err)
                                return outputCallback(err);

                            return outputCallback(err, {
                                _id: output.id,
                                conditions: Enumerable.from(conditions).select(function (condition) {
                                    return condition.id;
                                }).toArray()
                            });
                        });
                    }, function (err, outputs) {
                        if (err)
                            return callback(err);

                        task.outputs = outputs;

                        return callback(err);
                    });
                }
            ], function (err) {
                if (err)
                    return done(err);

                return task.save(function (err) {
                    if (err)
                        return done(err);

                    return _this._createSnapshot(task, function (err) {
                        return done(err, task);
                    });
                });
            });
        });
    };

    TaskRepository.prototype.findPartnersByName = function (name, done) {
        return Task.distinct('availability.partners', function (err, partners) {
            if (err)
                return done(err);

            return done(err, Enumerable.from(partners).where(function (partner) {
                return partner.match(new RegExp(name, 'i'));
            }).toArray());
        });
    };

    TaskRepository.prototype.search = function (criteria, done) {
        ///<summary>Finds tasks by term</summary>
        ///<param name="criteria">Criteria</param>
        ///<param name="done">Done callback</param>
        var _this = this;
        return async.parallel({
            byName: function (callback) {
                return Task.find({ name: new RegExp(criteria, 'i') }, function (err, tasks) {
                    if (err)
                        return callback(err);

                    return callback(err, Enumerable.from(tasks).select(function (task) {
                        return {
                            id: task.id,
                            name: task.name,
                            description: task.description
                        };
                    }).toArray());
                });
            },
            byDescription: function (callback) {
                return Task.find({ description: new RegExp(criteria, 'i') }, function (err, tasks) {
                    if (err)
                        return callback(err);

                    return callback(err, Enumerable.from(tasks).select(function (task) {
                        return {
                            id: task.id,
                            name: task.name,
                            description: task.description
                        };
                    }).toArray());
                });
            },
            byInputs: function (callback) {
                return new ConditionRepository(_this.user).findByName(criteria, function (err, conditions) {
                    if (err)
                        return callback(err);

                    return Task.find({
                        'inputs.conditions': {
                            $in: Enumerable.from(conditions).select(function (condition) {
                                return condition.id;
                            }).toArray()
                        }
                    }, function (err, tasks) {
                        if (err)
                            return callback(err);

                        return async.map(tasks, function (task, taskInputCallback) {
                            var taskInputConditions = Enumerable.from(task.inputs).selectMany(function (input) {
                                return input.conditions;
                            });

                            var matchedConditions = Enumerable.from(conditions).where(function (condition) {
                                return taskInputConditions.any(function (taskInputCondition) {
                                    return taskInputCondition == condition.id;
                                });
                            }).toArray();

                            return taskInputCallback(err, {
                                id: task.id,
                                name: task.name,
                                description: task.description,
                                inputs: matchedConditions
                            });
                        }, function (err, tasks) {
                            if (err)
                                return callback(err);

                            return callback(err, tasks);
                        });
                    });
                });
            },
            byOutputs: function (callback) {
                return new ConditionRepository(_this.user).findByName(criteria, function (err, conditions) {
                    if (err)
                        return callback(err);

                    return Task.find({
                        'outputs.conditions': {
                            $in: Enumerable.from(conditions).select(function (condition) {
                                return condition.id;
                            }).toArray()
                        }
                    }, function (err, tasks) {
                        if (err)
                            return callback(err);

                        return async.map(tasks, function (task, taskOutputCallback) {
                            var taskOutputConditions = Enumerable.from(task.outputs).selectMany(function (output) {
                                return output.conditions;
                            });

                            var matchedConditions = Enumerable.from(conditions).where(function (condition) {
                                return taskOutputConditions.any(function (taskOutputCondition) {
                                    return taskOutputCondition == condition.id;
                                });
                            }).toArray();

                            return taskOutputCallback(err, {
                                id: task.id,
                                name: task.name,
                                description: task.description,
                                outputs: matchedConditions
                            });
                        }, function (err, tasks) {
                            if (err)
                                return callback(err);

                            return callback(err, tasks);
                        });
                    });
                });
            },
            byExternalId: function (callback) {
                return Task.find({ external_id: new RegExp(criteria, 'i') }, function (err, tasks) {
                    if (err)
                        return callback(err);

                    return callback(err, Enumerable.from(tasks).select(function (task) {
                        return {
                            id: task.id,
                            name: task.name,
                            description: task.description,
                            external_id: task.external_id
                        };
                    }).toArray());
                });
            }
        }, function (err, results) {
            if (err)
                return done(err);

            var taskCandidates = Enumerable.from(results.byName).union(results.byDescription).union(results.byInputs).union(results.byOutputs).union(results.byExternalId);

            var tasks = Enumerable.empty();
            taskCandidates.forEach(function (taskCandidate) {
                var task = tasks.firstOrDefault(function (task) {
                    return task.id == taskCandidate.id;
                });

                if (task) {
                    extend(task, taskCandidate);
                } else {
                    tasks = tasks.union(Enumerable.from([taskCandidate]));
                }
            });

            tasks.orderBy(function (task) {
                return task.name;
            }).toArray();

            return done(err, tasks);
        });
    };

    TaskRepository.prototype.findAllTasks = function (taskCriteria, done) {
        if (taskCriteria.startDate && taskCriteria.endDate) {
            return Task.find({
                'audit.created_date': {
                    $gt: taskCriteria.startDate, $lt: taskCriteria.endDate
                }
            }, {}, { sort: { 'audit.created_date': -1 } }, done);
        }

        return Task.find(taskCriteria, {}, { sort: { 'audit.created_date': -1 } }, done);
    };

    TaskRepository.prototype.findProducerTasksByCondition = function (condition, done) {
        return Task.find({ 'outputs.conditions': condition }, done);
    };

    TaskRepository.prototype.findConsumerTasksByCondition = function (condition, done) {
        return Task.find({ 'inputs.conditions': condition }, done);
    };

    TaskRepository.prototype.findTasksCreatedAfter = function (date, done) {
        var _this = this;
        return Task.find({
            'audit.created_date': {
                $gt: date
            }
        }, function (err, tasks) {
            if (err)
                return done(err);

            return done(err, Enumerable.from(tasks).where(function (task) {
                return task.audit.created_by != _this.user.id;
            }).toArray());
        });
    };

    TaskRepository.prototype._createSnapshot = function (task, done) {
        return TaskSnapshot.findOne({ taskId: task.id }, {}, {
            sort: {
                _id: -1
            }
        }, function (err, oldestTaskSnapshot) {
            if (err)
                return done(err);

            var newestTaskSnapshot = TaskSnapshot.create(task);

            if (!oldestTaskSnapshot || !Util.isEquals(oldestTaskSnapshot.toDto(), newestTaskSnapshot.toDto())) {
                return newestTaskSnapshot.save(done);
            } else {
                return done();
            }
        });
    };
    return TaskRepository;
})(BaseRepository);

module.exports = TaskRepository;
//# sourceMappingURL=task.js.map
