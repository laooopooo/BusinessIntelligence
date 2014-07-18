/// <reference path="../compiler/bi.d.ts" />
var Base = require('./base'),
    Group = require('../models/group'),
    Permission = require('../models/permission');

class GroupRepository {
    constructor() {
    }

    getByName(name, done: Function) {
        return new GroupRepository().getByNames([name], done);
    }

    getByNames(names, done) {
        return Group.findOne({
            name: {
                $in: names
            }
        }, done);
    }

    getByIds(ids, done: Function) {
        return Group.find({
            _id: {
                $in: ids
            }
        }, done);
    }
}

export = GroupRepository;