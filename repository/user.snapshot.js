var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BaseRepository = require('./base');

var UserSnapshotRepository = (function (_super) {
    __extends(UserSnapshotRepository, _super);
    function UserSnapshotRepository(user) {
        _super.call(this, user);
    }
    UserSnapshotRepository.prototype.insert = function (userSnapshot, done) {
        return userSnapshot.save(done);
    };
    return UserSnapshotRepository;
})(BaseRepository);

module.exports = UserSnapshotRepository;
//# sourceMappingURL=user.snapshot.js.map
