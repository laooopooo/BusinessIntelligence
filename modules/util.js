var Entity;
(function (Entity) {
    function isEquals(a, b) {
        return JSON.stringify(a) === JSON.stringify(b);
    }
    Entity.isEquals = isEquals;
})(Entity || (Entity = {}));
//# sourceMappingURL=util.js.map
