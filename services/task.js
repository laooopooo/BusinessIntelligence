var async = require('async'), Enumerable = require('linq');

var UserRepository = require('../repository/user');

var TaskRepository = require('../repository/task');

var TaskService = (function () {
    function TaskService(user) {
        this.user = user;
    }
    TaskService.prototype.findTasksByName = function (name, map, done) {
        return new TaskRepository(this.user).findByName(name, function (err, tasks) {
            if (err)
                return done(err);

            return done(err, Enumerable.from(tasks).select(map).toArray());
        });
    };

    TaskService.prototype.saveTask = function (taskDto, done) {
        return new TaskRepository(this.user).save(taskDto, function (err, user) {
            if (err)
                return done(err);

            return done(err, user.toDto());
        });
    };

    TaskService.prototype.findPartnersByName = function (name, map, done) {
        return new TaskRepository(this.user).findPartnersByName(name, function (err, partners) {
            if (err)
                return done(err);

            return done(err, Enumerable.from(partners).select(map).toArray());
        });
    };

    TaskService.prototype.getTaskById = function (id, done) {
        var _this = this;
        return new TaskRepository(this.user).getById(id, function (err, task) {
            if (err)
                return done(err);

            return async.series([
                function (callback) {
                    return new UserRepository(_this.user).getById(task.audit.created_by, function (err, user) {
                        task.audit.created_by = user.toDto();
                        task.audit.created_date = task.audit.created_date;

                        return callback(err);
                    });
                },
                function (callback) {
                    return new UserRepository(_this.user).getById(task.audit.modified_by, function (err, user) {
                        task.audit.modified_by = user.toDto();
                        task.audit.modified_date = task.audit.modified_date;

                        return callback(err);
                    });
                }], function (err) {
                if (err)
                    return done(err);

                return done(err, task);
            });
        });
    };

    TaskService.prototype.searchTasks = function (criteria, map, done) {
        return new TaskRepository(this.user).search(criteria, function (err, tasks) {
            if (err)
                return done(err);

            return done(err, Enumerable.from(tasks).select(map).toArray());
        });
    };

    TaskService.prototype.findTasks = function (taskCriteria, map, done) {
        var _this = this;
        return new TaskRepository(this.user).findAllTasks(taskCriteria, function (err, tasks) {
            if (err)
                return done(err);

            var userRepository = new UserRepository(_this.user);
            return async.map(tasks, function (task, callback) {
                return userRepository.getById(task.audit.created_by, function (error, user) {
                    if (error)
                        return callback(error);

                    return callback(error, {
                        task: task,
                        params: {
                            owner: user.toDto(),
                            created_date: task.audit.created_date
                        }
                    });
                });
            }, function (error, results) {
                return done(error, Enumerable.from(results).select(function (result) {
                    return map(result.task, result.params);
                }).toArray());
            });
        });
    };

    TaskService.prototype.findProducerTasksByCondition = function (conditionId, map, done) {
        return new TaskRepository(this.user).findProducerTasksByCondition(conditionId, function (err, tasks) {
            if (err)
                return done(err);

            return done(err, Enumerable.from(tasks).distinct(function (task) {
                return task.id;
            }).orderBy(function (task) {
                return task.name;
            }).select(map).toArray());
        });
    };

    TaskService.prototype.findConsumerTasksByCondition = function (conditionId, map, done) {
        return new TaskRepository(this.user).findConsumerTasksByCondition(conditionId, function (err, tasks) {
            if (err)
                return done(err);

            return done(err, Enumerable.from(tasks).distinct(function (task) {
                return task.id;
            }).orderBy(function (task) {
                return task.name;
            }).select(map).toArray());
        });
    };

    TaskService.prototype.calculateMetrics = function (done) {
        return new TaskRepository(this.user).findTasksCreatedAfter(this.user.metrics.previous_login_date, function (err, tasks) {
            if (err)
                return done(err);

            return done(err, {
                newly_added_tasks_count: tasks.length
            });
        });
    };
    return TaskService;
})();

module.exports = TaskService;
//# sourceMappingURL=task.js.map
