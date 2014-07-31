var Condition = require('../models/condition'),
    ConditionSnapshot = require('../models/condition.snapshot'),
    Enumerable = require('linq'),
    extend = require('extend'),
    Util = require('../modules/util'),
    async = require('async');

import BaseRepository = require('./base');

class ConditionRepository extends BaseRepository {
    repositories: any;
    constructor(user: User, repositories?: any) {
        super(user);
        this.repositories = repositories;
    }

    findByName(name: string, done: ICallback) {
        return Condition.find({
            name: new RegExp(name, 'i')
        }, done);
    }

    getById(id: string, done: ICallback) {
        return Condition.findById(id, done);
    }

    getByIds(ids: string[], done: ICallback) {
        return Condition.find({
            _id: {
                $in: ids
            }
        }, done);
    }

    save(conditionDto: Condition, done: ICallback) {
        return Condition.findById(conditionDto.id, (err, condition) => {
            condition = condition || new Condition({
                _id: conditionDto.id,
                audit: {
                    created_by: this.user.id
                }
            });

            return async.map(conditionDto.affects, (affect, affectProcessedCallback) => {
                if (affect.task.is_transient) {
                    return this.repositories.thirdtaskRepository.save(affect.task, (err, task) => {

                        affect.task = task;

                        return affectProcessedCallback(err, affect);
                    });
                }

                return affectProcessedCallback(null, affect);
            }, (err: any, affects: ConditionAffect[]) => {
                    if (err) return done(err);

                    conditionDto.affects = Enumerable.from(affects).select(affect => {
                        return {
                            _id: affect.id,
                            task: affect.task.id,
                            description: affect.description
                        };
                    }).toArray();

                    extend(condition, conditionDto, {
                        audit: {
                            modified_by: this.user.id,
                            modified_date: new Date(),
                            revision: condition.audit.revision + 1
                        }
                    });

                    return condition.save((err: any) => {
                        if (err) return done(err);

                        return this._createSnapshot(condition, err => done(err, condition));
                    });
                });
        });
    }

    findValues(name: string, value: string, done: ICallback) {
        return Condition.distinct(name, (err, values) => {
            if (err) return done(err);

            return done(err, Enumerable.from(values).where((singleValue) => {
                return singleValue && singleValue.match(new RegExp(value, 'i'));
            }).toArray());
        });
    }

    _createSnapshot(condition: Condition, done: ICallback) {
        return ConditionSnapshot.findOne({ conditionId: condition.id }, {}, {
                sort: {
                    _id: -1
                }
            }, (err, oldestConditionSnapshot) => {
                    if (err) return done(err);

                    var newestConditionSnapshot = ConditionSnapshot.create(condition);

                    if (!oldestConditionSnapshot || !Util.isEquals(oldestConditionSnapshot.toDto(), newestConditionSnapshot.toDto())) {
                        return newestConditionSnapshot.save(done);
                    } else {
                        return done(null);
                    }
                });
    }
}

export = ConditionRepository;