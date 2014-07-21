﻿var Group = require('../entities/group');

import BaseRepository = require('./base');

class GroupRepository extends BaseRepository {
    constructor(user: User) {
        super(user);
    }

    getByName(name: string, done: Function) {
        return this.getByNames([name], done);
    }

    getByNames(names: string[], done: Function) {
        return Group.findOne({
            name: {
                $in: names
            }
        }, done);
    }

    getByIds(ids: string[], done: Function) {
        return Group.find({
            _id: {
                $in: ids
            }
        }, done);
    }
}

export = GroupRepository;