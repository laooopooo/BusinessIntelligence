var async = require('async'),
    Enumerable = require('linq');

import UserRepository = require('../repository/user');
import ConditionRepository = require('../repository/condition');
import TaskRepository = require('../repository/task');

class TaskService {
    user: User;
    constructor(user: User) {
        this.user = user;
    }

    findTasksByName(name: string, map: Function, done: ICallback) {
        return new TaskRepository(this.user).findByName(name, (err: any, tasks: Task[]) => {
            if (err) return done(err);

            return done(err, Enumerable.from(tasks).select(map).toArray());
        });
    }

    saveTask(taskDto: Task, done: ICallback) {
        return new TaskRepository(this.user).save(taskDto, (err: any, user: User) => {
            if (err) return done(err);

            return done(err, user.toDto());
        });
    }

    findPartnersByName(name: string, map: Function, done: ICallback) {
        return new TaskRepository(this.user).findPartnersByName(name, (err: any, partners) => {
            if (err) return done(err);

            return done(err, Enumerable.from(partners).select(map).toArray());
        });
    }

    getTaskById(id: string, done: ICallback) {
        return new TaskRepository(this.user).getById(id, (err: any, task: Task) => {
            if (err) return done(err);

            return async.series([
                (callback) => {
                    return new UserRepository(this.user).getById(task.audit.created_by, (err: any, user: User) => {
                        task.audit.created_by = user.toDto();
                        task.audit.created_date = task.audit.created_date;

                        return callback(err);
                    });
                },
                (callback) => {
                    return new UserRepository(this.user).getById(task.audit.modified_by, (err: any, user: User) => {
                        task.audit.modified_by = user.toDto();
                        task.audit.modified_date = task.audit.modified_date;

                        return callback(err);
                    });
                }], (err: any) => {
                    if (err) return done(err);

                    return done(err, task);
                });
        });
    }

    searchTasks(criteria: string, map: Function, done: ICallback) {
        return new TaskRepository(this.user).search(criteria, (err: any, tasks: Task[]) => {
            if (err) return done(err);

            return done(err, Enumerable.from(tasks).select(map).toArray());
        });
    }

    findTasks(taskCriteria, map: Function, done: ICallback) {
        return new TaskRepository(this.user).findAllTasks(taskCriteria, (err, tasks) => {
            if (err) return done(err);

            var userRepository = new UserRepository(this.user);
            return async.map(tasks, (task: Task, callback: ICallback) => {
                return userRepository.getById(task.audit.created_by, (error: any, user: User) => {
                    if (error) return callback(error);

                    return callback(error, {
                        task: task,
                        params: {
                            owner: user.toDto(),
                            created_date: task.audit.created_date
                        }
                    });
                });

            }, (error: any, results: Task[]) => {
                return done(error, Enumerable.from(results).select((result) => {
                    return map(result.task, result.params);
                }).toArray());
            });
        });
    }

    findProducerTasksByCondition(conditionId: string, map: Function, done: ICallback) {
        return new TaskRepository(this.user).findProducerTasksByCondition(conditionId, (err: any, tasks: Task[]) => {
            if (err) return done(err);

            return done(err, Enumerable.from(tasks).distinct((task: Task) => {
                return task.id;
            }).orderBy((task: Task) => {
                return task.name;
            }).select(map).toArray());
        });
    }

    findConsumerTasksByCondition(conditionId: string, map: Function, done: ICallback) {
        return new TaskRepository(this.user).findConsumerTasksByCondition(conditionId, (err: any, tasks: Task[]) => {
            if (err) return done(err);

            return done(err, Enumerable.from(tasks).distinct((task: Task) => {
                return task.id;
            }).orderBy((task: Task) => {
                return task.name;
            }).select(map).toArray());
        });
    }

    calculateMetrics(done: ICallback) {
        return new TaskRepository(this.user).findTasksCreatedAfter(this.user.metrics.previous_login_date, (err: any, tasks: Task[]) => {
            if (err) return done(err);

            return done(err, {
                newly_added_tasks_count: tasks.length
            });
        });
    }
}

export = TaskService;