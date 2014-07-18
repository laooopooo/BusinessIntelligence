class BaseRepository {
    user: IUser;
    constructor(user: IUser) {
        this.user = user;
    }
}

export = BaseRepository;