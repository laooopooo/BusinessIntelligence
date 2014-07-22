import Group = require('../models/group');
import BaseRepository = require('./base');

class GroupRepository extends BaseRepository {
    constructor(user: User) {
        super(user);
    }

    getByName(name: string, done: ICallback) {
        return this.getByNames([name], done);
    }

    getByNames(names: string[], done: ICallback) {
        return Group.findOne({
            name: {
                $in: names
            }
        }, done);
    }

    getByIds(ids: string[], done: ICallback) {
        return Group.find({
            _id: {
                $in: ids
            }
        }, done);
    }
}

export = GroupRepository;