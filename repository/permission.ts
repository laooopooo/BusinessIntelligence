import Permission = require('../models/permission');
import BaseRepository = require('./base');

class PermissionRepository extends BaseRepository {
    constructor(user: User) {
        super(user);
    }

    getByName(name: string, done: ICallback) {
        return Permission.findOne({
            name: name
        }, done);
    }

    getByIds(ids: string[], done: ICallback) {
        return Permission.find({
            _id: {
                $in: ids
            }
        }, done);
    }

    create(name: string, done: ICallback) {
        return this.getByName(name, (err, permission) => {
            if (err) return done(err);

            if (permission) {
                return done('The permission is already exists.', null);
            }

            permission = new Permission({
                name: name
            });

            return permission.save((err) => {
                return done(err, permission);
            });
        });
    }
}

export = PermissionRepository;