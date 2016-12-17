"use strict";
var EPSILON = 1e-10;
var Vec3 = (function () {
    function Vec3(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    Vec3.equals = function (a, b) {
        return (Math.abs(a.x - b.x) < EPSILON
            && Math.abs(a.y - b.y) < EPSILON
            && Math.abs(a.z - b.z) < EPSILON);
    };
    Vec3.prototype.equals = function (vec) {
        return Vec3.equals(this, vec);
    };
    Vec3.prototype.toString = function () {
        return "Vec3(" + this.x + ", " + this.y + ", " + this.z + ")";
    };
    return Vec3;
}());
exports.Vec3 = Vec3;
var Bbox = (function () {
    function Bbox(min, max) {
        this.min = new Vec3(Math.min(min.x, max.x), Math.min(min.y, max.y), Math.min(min.z, max.z));
        this.max = new Vec3(Math.max(min.x, max.x), Math.max(min.y, max.y), Math.max(min.z, max.z));
    }
    Bbox.create = function (a, b, c, x, y, z) {
        return new Bbox((new Vec3(a, b, c)), (new Vec3(x, y, z)));
    };
    Bbox.equals = function (a, b) {
        return a.min.equals(b.min) && a.max.equals(b.max);
    };
    // test for intersection
    Bbox.prototype.intersects = function (box) {
        var a = this, b = box;
        // prove that they don't not intersect is more efficient
        // than constructing an intersection
        return !((a.max.x < b.min.x
            || a.max.y < b.min.y
            || a.max.z < b.min.z)
            || (a.min.x > b.max.x
                || a.min.y > b.max.y
                || a.min.z > b.max.z));
    };
    // return centroid of bbox
    Bbox.prototype.center = function () {
        return new Vec3((this.min.x + this.max.x) / 2, (this.min.y + this.max.y) / 2, (this.min.z + this.max.z) / 2);
    };
    Bbox.prototype.toString = function () {
        return "Bbox(" + this.min + ", " + this.max + ")";
    };
    return Bbox;
}());
exports.Bbox = Bbox;
var RegionOctree = (function () {
    function RegionOctree(width, height, depth) {
    }
    return RegionOctree;
}());
var OctreeNode = (function () {
    function OctreeNode() {
    }
    return OctreeNode;
}());
