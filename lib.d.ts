/// <reference path="typescript/express/express.d.ts" />

interface Transferable {
    toDto(): any;
}

interface Auditable {
    modified_date: any;
    revision: number;
}

interface Entity extends Transferable {
    id: string;
    audit: Auditable;
}

interface User extends Entity {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    avatar: string;
    groups: string[];
    permissions: string[];
    metrics: {
        previous_login_date: any;
        current_login_date: any;
    };
}

interface UserSnapshot extends User {
    userId: string;
}

interface ConditionAffect {
    task: string;
    description: string;
}

interface Condition extends Entity {
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

interface Group extends Entity {
    name: string;
}

interface Permission extends Entity {
    name: string;
}

interface TaskInput {
    conditions: string[];
}

interface TaskOutput {
    conditions: string[];
}

interface Task extends Entity {
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