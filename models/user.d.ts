interface IUser {
    id: string;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    avatar: string;
    groups: string[];
    audit: IAudit;
    metrics: {
        previous_login_date: any;
        current_login_date: any;
    }
}