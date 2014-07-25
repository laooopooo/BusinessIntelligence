var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Condition = require('../models/condition'), ConditionSnapshot = require('../models/condition.snapshot'), Enumerable = require('linq'), extend = require('extend'), Util = require('../modules/util'), async = require('async');

var BaseRepository = require('./base');

var ConditionRepository = (function (_super) {
    __extends(ConditionRepository, _super);
    function ConditionRepository(user, repositories) {
        _super.call(this, user);
        this.repositories = repositories;
    }
    ConditionRepository.prototype.findByName = function (name, done) {
        return Condition.find({
            name: new RegExp(name, 'i')
        }, done);
    };

    ConditionRepository.prototype.getById = function (id, done) {
        return Condition.findById(id, done);
    };

    ConditionRepository.prototype.getByIds = function (ids, done) {
        return Condition.find({
            _id: {
                $in: ids
            }
        }, done);
    };

    ConditionRepository.prototype.save = function (conditionDto, done) {
        var _this = this;
        return Condition.findById(conditionDto.id, function (err, condition) {
            condition = condition || new Condition({
                _id: conditionDto.id,
                audit: {
                    created_by: _this.user.id
                }
            });

            return async.map(conditionDto.affects, function (affect, affectProcessedCallback) {
                if (affect.task.is_transient) {
                    return _this.repositories.thirdtaskRepository.save(affect.task, function (err, task) {
                        affect.task = task;

                        return affectProcessedCallback(err, affect);
                    });
                }

                return affectProcessedCallback(null, affect);
            }, function (err, affects) {
                if (err)
                    return done(err);

                conditionDto.affects = Enumerable.from(affects).select(function (affect) {
                    return {
                        _id: affect.id,
                        task: affect.task.id,
                        description: affect.description
                    };
                }).toArray();

                extend(condition, conditionDto, {
                    audit: {
                        modified_by: _this.user.id,
                        modified_date: new Date(),
                        revision: condition.audit.revision + 1
                    }
                });

                return condition.save(function (err) {
                    if (err)
                        return done(err);

                    return _this._createSnapshot(condition, function (err) {
                        return done(err, condition);
                    });
                });
            });
        });
    };

    ConditionRepository.prototype.findValues = function (name, value, done) {
        return Condition.distinct(name, function (err, values) {
            if (err)
                return done(err);

            return done(err, Enumerable.from(values).where(function (singleValue) {
                return singleValue && singleValue.match(new RegExp(value, 'i'));
            }).toArray());
        });
    };

    ConditionRepository.prototype._createSnapshot = function (condition, done) {
        return ConditionSnapshot.findOne({ conditionId: condition.id }, {}, {
            sort: {
                _id: -1
            }
        }, function (err, oldestConditionSnapshot) {
            if (err)
                return done(err);

            var newestConditionSnapshot = ConditionSnapshot.create(condition);

            if (!oldestConditionSnapshot || !Util.isEquals(oldestConditionSnapshot.toDto(), newestConditionSnapshot.toDto())) {
                return newestConditionSnapshot.save(done);
            } else {
                return done(null);
            }
        });
    };
    return ConditionRepository;
})(BaseRepository);

module.exports = ConditionRepository;
//# sourceMappingURL=condition.js.map
