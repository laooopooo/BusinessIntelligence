import BaseRepository = require('./base');

class UserSnapshotRepository extends BaseRepository {
    constructor(user: User) {
        super(user);
    }

    insert(userSnapshot: UserSnapshot, done: ICallback) {
        return userSnapshot.save(done);
    }
}

export = UserSnapshotRepository;