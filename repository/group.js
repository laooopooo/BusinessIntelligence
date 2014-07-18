/// <reference path="../compiler/bi.d.ts" />
var Base = require('./base'), Group = require('../models/group'), Permission = require('../models/permission');

var GroupRepository = (function () {
    function GroupRepository() {
    }
    GroupRepository.prototype.getByName = function (name, done) {
        return new GroupRepository().getByNames([name], done);
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
})();

module.exports = GroupRepository;
//# sourceMappingURL=group.js.map
