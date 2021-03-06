/// <reference path="typescript/express/express.d.ts" />
/// <reference path="typescript/async/async.d.ts" />
/// <reference path="typescript/linq/linq.d.ts" />
/// <reference path="typescript/lodash/lodash.d.ts" />
/// <reference path="typescript/mongoose/mongoose.d.ts" />

interface ICallback {
    (error: any, item?: any): void;
}

interface IMongooseSearchable {
    findOne(cond: Object, callback: ICallback): void;
    find(cond: Object, callback: ICallback): void;
    find(cond: Object, fields: Object, options: Object, callback: ICallback): void;
    findById(id: string, callback: ICallback): void;
    distinct(path: string, callback: ICallback): void;
    save(callback: ICallback): void;
}

interface Transferable {
    toDto(): any;
}

interface Auditable {
    created_by: string;
    created_date: Date;
    modified_by: string;
    modified_date: Date;
    revision: number;
}

interface Model extends Transferable, IMongooseSearchable {
    id: string;
    audit?: Auditable;
}

interface User extends Model {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    display_name: string;
    avatar: string;
    groups: string[];
    permissions: string[];
    metrics: {
        previous_login_date: Date;
        current_login_date: Date;
    };
}

interface UserSnapshot extends User {
    userId: string;
}

interface ConditionAffect {
    task: string;
    description: string;
}

interface Condition extends Model {
    name: string;
    condition_type: string;
    setting: {
        name: string;
        level: string;
        value: string;
    };
    description: string;
    ui: {
        input: string[];
        output: string[];
    };
    api: {
        input: string[];
        output: string[];
    };
    note: string;
    affects: ConditionAffect[];
}

interface ConditionSnapshot extends Condition {
    conditionId: string;
}

interface Group extends Model {
    name: string;
}

interface Permission extends Model {
    new (obj?: {
        name: string
    });
    name: string;
}

interface TaskInput {
    conditions: string[];
}

interface TaskOutput {
    conditions: string[];
}

interface Task extends Model {
    new (obj?: Object);
    name: string;
    description: string;
    external_id: string;
    availability: {
        availability_type: number;
        partners: string[];
    };
    inputs: TaskInput[];
    outputs: TaskOutput[];
}

interface TaskSnapshot extends Task {
    taskId: string;
}