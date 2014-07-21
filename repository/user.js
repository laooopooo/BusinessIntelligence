var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var config = require('../config'), crypto = require("crypto-js"), extend = require('extend'), User = require('../entities/user');

var BaseRepository = require('./base');

var UserRepository = (function (_super) {
    __extends(UserRepository, _super);
    function UserRepository(user) {
        _super.call(this, user);
    }
    UserRepository.prototype.getById = function (id, done) {
        return User.findById(id, done);
    };

    UserRepository.prototype.create = function (email, password, done) {
        var _this = this;
        email = email.toLowerCase();

        return User.findOne({
            email: email
        }, function (err, user) {
            if (user) {
                return done('The user is already exists.', null);
            }

            user = new User({
                email: email,
                password: _this._hashPassword(password),
                avatar: 'uploads/unknown_user.png'
            });

            return user.save(function (err) {
                return done(err, extend(user, {
                    password: ''
                }));
            });
        });
    };

    UserRepository.prototype.update = function (user, done) {
        var set = {
            groups: user.groups,
            first_name: user.first_name,
            last_name: user.last_name,
            avatar: user.avatar,
            email: user.email,
            audit: {
                modified_date: user.audit.modified_date,
                revision: user.audit.revision
            }
        };

        if (user.password) {
            extend(set, {
                password: this._hashPassword(user.password)
            });
        }

        User.findByIdAndUpdate(user.id, {
            $set: set
        }, done);
    };

    UserRepository.prototype.updateMetrics = function (user, done) {
        ///<summary>Updates metrics</summary>
        return User.findByIdAndUpdate(user.id, {
            $set: {
                metrics: {
                    previous_login_date: user.metrics.previous_login_date,
                    current_login_date: user.metrics.current_login_date
                }
            }
        }, done);
    };

    UserRepository.prototype.findByEmailPassword = function (email, password, done) {
        return User.findOne({
            email: email.toLowerCase(),
            password: this._hashPassword(password)
        }, done);
    };

    UserRepository.prototype.getAll = function (done) {
        return User.find({}).populate('groups').sort({ email: 1 }).exec(done);
    };

    UserRepository.prototype._hashPassword = function (text) {
        return crypto.SHA256(text + config.hash.salt).toString(crypto.enc.Hex);
    };
    return UserRepository;
})(BaseRepository);

module.exports = UserRepository;
//# sourceMappingURL=user.js.map
