var route = require('./route'), TaskService = require('../services/task');

function register(app) {
    app.get('/search/tasks.json/:criteria', route.private({ 'task': ['read'] }), exports.tasks);

    return this;
}
exports.register = register;

function tasks(req, res, next) {
    return new TaskService(req.user).searchTasks(req.params.criteria, function (task) {
        return task;
    }, function (err, tasks) {
        if (err)
            return next(err);

        return res.json(tasks);
    });
}
exports.tasks = tasks;
//# sourceMappingURL=search.js.map
