var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Permission = require('../models/permission');
var BaseRepository = require('./base');

var PermissionRepository = (function (_super) {
    __extends(PermissionRepository, _super);
    function PermissionRepository(user) {
        _super.call(this, user);
    }
    PermissionRepository.prototype.getByName = function (name, done) {
        return Permission.findOne({
            name: name
        }, done);
    };

    PermissionRepository.prototype.getByIds = function (ids, done) {
        return Permission.find({
            _id: {
                $in: ids
            }
        }, done);
    };

    PermissionRepository.prototype.create = function (name, done) {
        return this.getByName(name, function (err, permission) {
            if (err)
                return done(err);

            if (permission) {
                return done('The permission is already exists.', null);
            }

            permission = new Permission({
                name: name
            });

            return permission.save(function (err) {
                return done(err, permission);
            });
        });
    };
    return PermissionRepository;
})(BaseRepository);

module.exports = PermissionRepository;
//# sourceMappingURL=permission.js.map
