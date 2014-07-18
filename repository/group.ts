/// <reference path="../compiler/bi.d.ts" />
/// <reference path="./base.ts" />
/// <reference path="../models/user.ts" />

var Group = require('../models/group'),
    Permission = require('../models/permission');

import BaseRepository = require('./base');

class GroupRepository extends BaseRepository {
    constructor(user: User) {
        super(user);
    }

    getByName(name, done: Function) {
        return this.getByNames([name], done);
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