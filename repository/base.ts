/// <reference path="../compiler/bi.d.ts" />
/// <reference path="../models/user.ts" />

class BaseRepository {
    user: User;
    constructor(user: User) {
        this.user = user;
    }
}

export = BaseRepository;