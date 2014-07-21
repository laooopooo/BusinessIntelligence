var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Group = require('../entities/group');

var BaseRepository = require('./base');

var GroupRepository = (function (_super) {
    __extends(GroupRepository, _super);
    function GroupRepository(user) {
        _super.call(this, user);
    }
    GroupRepository.prototype.getByName = function (name, done) {
        return this.getByNames([name], done);
    };

    GroupRepository.prototype.getByNames = function (names, done) {
        return Group.findOne({
            name: {
                $in: names
            }
        }, done);
    };

    GroupRepository.prototype.getByIds = function (ids, done) {
        return Group.find({
            _id: {
                $in: ids
            }
        }, done);
    };
    return GroupRepository;
})(BaseRepository);

module.exports = GroupRepository;
//# sourceMappingURL=group.js.map
