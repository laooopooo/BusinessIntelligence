var TaskSnapshot = require('../models/task.snapshot'),
    Enumerable = require('linq'),
    async = require('async'),
    extend = require('extend'),
    Util = require('../modules/util');

import Task = require('../models/task');
import BaseRepository = require('./base');
import ConditionRepository = require('./condition');

class TaskRepository extends BaseRepository {
    constructor(user: User) {
        super(user);
    }

    findByName(name: string, done: ICallback) {
        return Task.find({
            name: new RegExp(name, 'i')
        }, done);
    }

    getById(id: string, done: ICallback) {
        return Task.findById(id, (err, task) => {
            if (err) return done(err);

            var taskDto = task.toDto();

            return async.parallel([
                (callback) => {
                    return async.map(task.inputs, (input, inputCallback) => {
                        return new ConditionRepository(this.user).getByIds(input.conditions, (err, conditions) => {
                            if (err) return inputCallback(err);

                            return inputCallback(err, {
                                id: input.id,
                                conditions: Enumerable.from(conditions).orderBy((condition) => {
                                    return condition.name;
                                }).select((condition) => {
                                        return condition.toDto();
                                    }).toArray()
                            });
                        });
                    }, (err, inputs) => {
                        if (err) return callback(err);

                        taskDto.inputs = inputs;

                        return callback(err);
                    });
                },
                (callback) => {
                    return async.map(task.outputs, (output, outputProcessedCallback) => {
                        return new ConditionRepository(this.user).getByIds(output.conditions, (err, conditions) => {
                            if (err) return outputProcessedCallback(err);

                            return async.map(conditions, (condition, conditionProcessedCallback) => {
                                return async.map(condition.affects, (affect, affectProcessedCallback) => {
                                    return Task.findById(affect.task, (err, task) => {
                                        if (err) return affectProcessedCallback(err);

                                        return affectProcessedCallback(err, {
                                            id: affect.id,
                                            task: task.toDto(),
                                            description: affect.description
                                        });
                                    });
                                }, (err, affects) => {
                                        if (err) return conditionProcessedCallback(err);

                                        condition = extend(condition.toDto(), {
                                            affects: affects
                                        });

                                        return conditionProcessedCallback(err, condition);
                                    });
                            }, (err, conditions) => {
                                    return outputProcessedCallback(err, {
                                        id: output.id,
                                        conditions: Enumerable.from(conditions).orderBy((condition) => {
                                            return condition.name;
                                        }).toArray()
                                    });
                                });
                        });
                    }, (err, outputs) => {
                        if (err) return callback(err);

                        taskDto.outputs = outputs;

                        return callback(err);
                    });
                }, (callback) => {
                    return new ConditionRepository(this.user).getByAffectTask(task, (err, conditions: Condition[]) => {
                        if (err) return callback(err);

                        taskDto.affects = Enumerable.from(conditions).select((condition: Condition) => {
                            return {
                                condition: condition,
                                affects: Enumerable.from(condition.affects).where((affect: ConditionAffect) => {
                                    return affect.task === task.id;
                                }).toArray()
                            }
                        }).toArray();

                        return callback(err);
                    });
                }
            ], (err) => {
                if (err) return done(err);

                return done(err, taskDto);
            });
        });
    }

    getByIds(ids: string[], done: ICallback) {
        return Task.find({
            _id: {
                $in: ids
            }
        }, done);
    }

    save(taskDto: Task, done: ICallback) {
        var conditionRepository = new ConditionRepository(this.user, {
                taskRepository: this
            });

        return Task.findById(taskDto.id, (err, task) => {
            task = task || new Task({
                audit: {
                    created_by: this.user.id,
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
                    modified_by: this.user.id,
                    modified_date: new Date(),
                    revision: task.audit.revision + 1
                })
            });

            return async.series([
                (callback) => {
                    return async.mapSeries(Enumerable.from(taskDto.inputs).where((input) => {
                        return input.conditions.length;
                    }).toArray(), (input, inputCallback) => {
                            return async.mapSeries(input.conditions, (condition, conditionCallback) => {
                                return conditionRepository.save(condition, conditionCallback);
                            }, (err, conditions) => {
                                if (err) return inputCallback(err);

                                return inputCallback(err, {
                                    _id: input.id,
                                    conditions: Enumerable.from(conditions).select((condition) => {
                                        return condition.id;
                                    }).toArray()
                                });
                            });
                        }, (err, inputs) => {
                            if (err) return callback(err);

                            task.inputs = inputs;

                            return callback(err);
                        });
                },
                (callback) => {
                    return async.mapSeries(Enumerable.from(taskDto.outputs).where((output) => {
                        return output.conditions.length;
                    }).toArray(), (output, outputCallback) => {
                            return async.mapSeries(output.conditions, (condition, conditionCallback) => {
                                return conditionRepository.save(condition, conditionCallback);
                            }, (err, conditions) => {
                                    if (err) return outputCallback(err);

                                    return outputCallback(err, {
                                        _id: output.id,
                                        conditions: Enumerable.from(conditions).select((condition) => {
                                            return condition.id;
                                        }).toArray()
                                    });
                                });
                        }, (err, outputs) => {
                            if (err) return callback(err);

                            task.outputs = outputs;

                            return callback(err);
                        });
                }
            ], (err) => {
                if (err) return done(err);

                return task.save((err) => {
                    if (err) return done(err);

                    return this._createSnapshot(task, (err) => {
                        return done(err, task);
                    });
                });
            });
        });
    }

    findPartnersByName(name: string, done: ICallback) {
        return Task.distinct('availability.partners', (err, partners) => {
            if (err) return done(err);

            return done(err, Enumerable.from(partners).where((partner) => {
                return partner.match(new RegExp(name, 'i'));
            }).toArray());
        });
    }

    search(criteria: string, done: ICallback) {
        ///<summary>Finds tasks by term</summary>
        ///<param name="criteria">Criteria</param>
        ///<param name="done">Done callback</param>

        return async.parallel({
            byName: (callback: ICallback) => {
                return Task.find({ name: new RegExp(criteria, 'i') }, (err, tasks: Task[]) => {
                    if (err) return callback(err);

                    return callback(err, Enumerable.from(tasks).select((task: Task) => {
                        return {
                            id: task.id,
                            name: task.name,
                            description: task.description
                        };
                    }).toArray());
                });
            },
            byDescription: (callback: ICallback) => {
                return Task.find({ description: new RegExp(criteria, 'i') }, (err, tasks: Task[]) => {
                    if (err) return callback(err);

                    return callback(err, Enumerable.from(tasks).select((task: Task) => {
                        return {
                            id: task.id,
                            name: task.name,
                            description: task.description
                        };
                    }).toArray());
                });
            },
            byInputs: (callback: ICallback) => {
                return new ConditionRepository(this.user).findByName(criteria, (err, conditions: Condition[]) => {
                    if (err) return callback(err);

                    return Task.find({
                        'inputs.conditions': {
                            $in: Enumerable.from(conditions).select((condition: Condition) => {
                                return condition.id;
                            }).toArray()
                        }
                    }, (err, tasks: Task[]) => {
                        if (err) return callback(err);

                        return async.map(tasks, (task: Task, taskInputCallback: ICallback) => {
                            var taskInputConditions = Enumerable.from(task.inputs).selectMany((input: TaskInput) => {
                                return input.conditions;
                            });

                            var matchedConditions = Enumerable.from(conditions).where((condition: Condition) => {
                                return taskInputConditions.any((taskInputCondition) => {
                                    return taskInputCondition == condition.id;
                                });
                            }).toArray();

                            return taskInputCallback(err, {
                                id: task.id,
                                name: task.name,
                                description: task.description,
                                inputs: matchedConditions
                            });
                        }, (err, tasks) => {
                            if (err) return callback(err);

                            return callback(err, tasks);
                        });
                    });
                });
            },
            byOutputs: (callback: ICallback) => {
                return new ConditionRepository(this.user).findByName(criteria, (err, conditions: Condition[]) => {
                    if (err) return callback(err);

                    return Task.find({
                        'outputs.conditions': {
                            $in: Enumerable.from(conditions).select((condition: Condition) => {
                                return condition.id;
                            }).toArray()
                        }
                    }, (err, tasks: Task[]) => {
                        if (err) return callback(err);

                        return async.map(tasks, (task: Task, taskOutputCallback: ICallback) => {
                            var taskOutputConditions = Enumerable.from(task.outputs).selectMany((output: TaskOutput) => {
                                return output.conditions;
                            });

                            var matchedConditions = Enumerable.from(conditions).where((condition: Condition) => {
                                return taskOutputConditions.any((taskOutputCondition) => {
                                    return taskOutputCondition == condition.id;
                                });
                            }).toArray();

                            return taskOutputCallback(err, {
                                id: task.id,
                                name: task.name,
                                description: task.description,
                                outputs: matchedConditions
                            });
                        }, (err, tasks) => {
                            if (err) return callback(err);

                                return callback(err, tasks);
                            });
                    });
                });
            },
            byExternalId: (callback: ICallback) => {
                return Task.find({ external_id: new RegExp(criteria, 'i') }, (err, tasks: Task[]) => {
                    if (err) return callback(err);

                    return callback(err, Enumerable.from(tasks).select((task: Task) => {
                        return {
                            id: task.id,
                            name: task.name,
                            description: task.description,
                            external_id: task.external_id
                        };
                    }).toArray());
                });
            }
        }, (err, results) => {
            if (err) return done(err);

            var taskCandidates = Enumerable
                .from(results.byName)
                .union(results.byDescription)
                .union(results.byInputs)
                .union(results.byOutputs)
                .union(results.byExternalId);

            var tasks = Enumerable.empty();
            taskCandidates.forEach((taskCandidate: Task) => {
                var task: Task = tasks.firstOrDefault((task: Task) => {
                    return task.id == taskCandidate.id;
                });

                if (task) {
                    extend(task, taskCandidate);
                } else {
                    tasks = tasks.union(Enumerable.from([taskCandidate]));
                }
            });

            tasks.orderBy((task: Task) => {
                return task.name;
            }).toArray();

            return done(err, tasks);
        });
    }

    findAllTasks(taskCriteria, done: ICallback) {
        if (taskCriteria.startDate && taskCriteria.endDate) {
            return Task.find({
                'audit.created_date': {
                    $gt: taskCriteria.startDate, $lt: taskCriteria.endDate
                },
            }, {}, { sort: { 'audit.created_date': -1 } }, done);
        }

        return Task.find(taskCriteria, {}, { sort: { 'audit.created_date': -1 } }, done);
    }

    findProducerTasksByCondition(condition: string, done: ICallback) {
        return Task.find({ 'outputs.conditions': condition }, done);
    }

    findConsumerTasksByCondition(condition: string, done: ICallback) {
        return Task.find({ 'inputs.conditions': condition }, done);
    }

    findTasksCreatedAfter(date: Date, done: ICallback) {
        return Task.find({
            'audit.created_date': {
                $gt: date
            }
        }, (err, tasks) => {
            if (err) return done(err);

            return done(err, Enumerable.from(tasks).where((task) => {
                    return task.audit.created_by != this.user.id;
                }).toArray());
            });
    }

    _createSnapshot(task, done) {
        return TaskSnapshot.findOne({ taskId: task.id }, {}, {
            sort: {
                _id: -1
            }
        }, (err, oldestTaskSnapshot) => {
            if (err) return done(err);

            var newestTaskSnapshot = TaskSnapshot.create(task);

            if (!oldestTaskSnapshot || !Util.isEquals(oldestTaskSnapshot.toDto(), newestTaskSnapshot.toDto())) {
                return newestTaskSnapshot.save(done);
            } else {
                return done();
            }
        });
    }
}

export = TaskRepository;