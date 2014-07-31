var route = require('./route'),
    TaskService = require('../services/task');

import express = require('express');

export function register(app: express.Router) {

    app.get('/search/tasks.json/:criteria', route.private({ 'task': ['read'] }), exports.tasks);

    return this;
}

export function tasks(req: express.Request, res: express.Response, next: Function) {
    return new TaskService(req.user).searchTasks(req.params.criteria, (task) => {
        return task;
    }, (err, tasks) => {
        if (err) return next(err);

        return res.json(tasks);
    });
}