module Entity {
    export function isEquals(a : any, b: any): boolean {
        return JSON.stringify(a) === JSON.stringify(b);
    }
}