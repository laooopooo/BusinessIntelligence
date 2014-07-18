var config = require('../config'),
    crypto = require("crypto-js"),
    extend = require('extend'),
    User = require('../models/user');

import BaseRepository = require('./base');

class UserRepository extends BaseRepository {
    constructor(user: IUser) {
        super(user);
    }

    getById(id: string, done: Function) {
        return User.findById(id, done);
    }

    create(email: string, password: string, done: Function) {
        email = email.toLowerCase();

        return User.findOne({
            email: email
        }, (err, user) => {
            if (user) {
                return done('The user is already exists.', null);
            }

            user = new User({
                email: email,
                password: this._hashPassword(password),
                avatar: 'uploads/unknown_user.png'
            });

            return user.save((err) => {
                return done(err, extend(user, {
                    password: ''
                }));
            });
        });
    }

    update(user: IUser, done: Function) {
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
    }

    updateMetrics(user: IUser, done: Function) {
        ///<summary>Updates metrics</summary>

        return User.findByIdAndUpdate(user.id, {
            $set: {
                metrics: {
                    previous_login_date: user.metrics.previous_login_date,
                    current_login_date: user.metrics.current_login_date
                }
            }
        }, done);
    }

    findByEmailPassword(email: string, password: string, done: Function) {
        return User.findOne({
            email: email.toLowerCase(),
            password: this._hashPassword(password)
        }, done);
    }

    getAll(done: Function) {
        return User.find({})
            .populate('groups')
            .sort({ email: 1 })
            .exec(done);
    }

    _hashPassword(text: string) {
        return crypto.SHA256(text + config.hash.salt).toString(crypto.enc.Hex);
    }
}

export = UserRepository;