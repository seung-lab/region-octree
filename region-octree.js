"use strict";
var EPSILON = 1e-10;
var Vec3 = (function () {
    function Vec3(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    Vec3.create = function (x, y, z) {
        return new Vec3(x, y, z);
    };
    Vec3.equals = function (a, b) {
        return (Math.abs(a.x - b.x) < EPSILON
            && Math.abs(a.y - b.y) < EPSILON
            && Math.abs(a.z - b.z) < EPSILON);
    };
    Vec3.prototype.clone = function () {
        return new Vec3(this.x, this.y, this.z);
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
    function Bbox(a, b) {
        this.min = new Vec3(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.min(a.z, b.z));
        this.max = new Vec3(Math.max(a.x, b.x), Math.max(a.y, b.y), Math.max(a.z, b.z));
    }
    Bbox.create = function (a, b, c, x, y, z) {
        return new Bbox((new Vec3(a, b, c)), (new Vec3(x, y, z)));
    };
    Bbox.prototype.octant = function (point) {
        var container = this;
        if (!container.contains(point)) {
            return -1;
        }
        var center = container.center();
        var feq = function (a, b) { return Math.abs(a - b) < EPSILON; };
        var cx = feq(center.x, point.x), cy = feq(center.y, point.y), cz = feq(center.z, point.z);
        // If point is located in between octants on the xy, xz, or yz planes.
        if ((cx && cy)
            || (cx && cz)
            || (cy && cz)) {
            return -2;
        }
        return (+((center.x - point.x) < 0)
            | (+((center.y - point.y) < 0) << 1)
            | (+((center.z - point.z) < 0) << 2));
    };
    Bbox.equals = function (a, b) {
        return a.equals(b);
    };
    Bbox.prototype.equals = function (box) {
        return this.min.equals(box.min) && this.max.equals(box.max);
    };
    Bbox.prototype.clone = function () {
        return new Bbox(this.min.clone(), this.max.clone());
    };
    // Shatter a bbox into up to 8 octants 
    Bbox.prototype.shatter = function (chissel) {
        var glassbox = this;
        if (!glassbox.contains(chissel)) {
            return [glassbox];
        }
        function create(pt1, pt2) {
            return new Bbox(pt1.clone(), pt2.clone());
        }
        var center = glassbox.center();
        /* Draw a 3D cube in isometric view, label axes as x going to the right, y to the left.
         * Divide it into octants numbered as follows:
         *
         *  z=0  | 2 | 3 |  y    z=1  | 6 | 7 | y
         *       | 0 | 1 |            | 4 | 5 |
         *         x                    x
         *
         * This allows you to index each octant using bitfields, x as LSB, z as MSB. c.f. Bbox.octant
         */
        return [
            // z = 0
            create(glassbox.min, center),
            Bbox.create(center.x, glassbox.min.y, glassbox.min.z, glassbox.max.x, center.y, center.z),
            Bbox.create(glassbox.min.x, center.y, glassbox.min.z, center.x, glassbox.max.y, center.z),
            Bbox.create(center.x, center.y, glassbox.min.z, glassbox.max.x, glassbox.max.y, center.z),
            // z = 1
            Bbox.create(glassbox.min.x, glassbox.min.y, center.z, center.x, center.y, glassbox.max.z),
            Bbox.create(center.x, glassbox.min.y, center.z, glassbox.max.x, center.y, glassbox.max.z),
            Bbox.create(glassbox.min.x, center.y, center.z, center.x, glassbox.max.y, glassbox.max.z),
            create(center, glassbox.max) // top right
        ];
    };
    Bbox.prototype.split = function (axis, value) {
        var original = this;
        if (original.min[axis] > value || original.max[axis] < value) {
            return [original];
        }
        var left = original.clone(), right = original.clone();
        left.max[axis] = value;
        right.min[axis] = value;
        return [left, right];
    };
    Bbox.prototype.contains = function (point) {
        return (point.x > this.min.x
            && point.y > this.min.y
            && point.z > this.min.z
            && point.x < this.max.x
            && point.y < this.max.y
            && point.z < this.max.z);
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
    Bbox.prototype.size3 = function () {
        return new Vec3((this.max.x - this.min.x), (this.max.y - this.min.y), (this.max.z - this.min.z));
    };
    Bbox.prototype.volume = function () {
        var size = this.size3();
        return size.x * size.y * size.z;
    };
    Bbox.prototype.toString = function () {
        return "Bbox(" + this.min + ", " + this.max + ")";
    };
    return Bbox;
}());
exports.Bbox = Bbox;
var Octree = (function () {
    function Octree(bbox) {
        this.bbox = bbox.clone();
        this.children = null;
        this.label = null;
    }
    // get number of nodes in the current subtree
    Octree.prototype.treesize = function () {
        var size = 1;
        if (!this.children) {
            return size;
        }
        this.children.forEach(function (node) {
            if (node) {
                size += node.treesize();
            }
        });
        return size;
    };
    // find max depth of the current subtee
    Octree.prototype.treedepth = function (depth) {
        if (depth === void 0) { depth = 1; }
        var node = this;
        if (this.children === null) {
            return depth;
        }
        var curdepth = depth;
        node.children.forEach(function (node) {
            curdepth = Math.max(curdepth, node.treedepth(depth + 1));
        });
        return curdepth;
    };
    // Do the bboxes match? If yes, then delete all children
    // and set the label. 
    // Else, shatter box and paint each assigned subvolume
    // if a child doesn't exist, create one
    Octree.prototype.paint = function (paintbox, label) {
        if (paintbox.equals(this.bbox)) {
            this.children = null;
            this.label = label;
            return;
        }
        else if (paintbox.volume() < 1) {
            console.warn("Not supporting painting voxels less than size 1.");
            return;
        }
        var center = this.bbox.center();
        if (this.children === null) {
            this.children = this.bbox.shatter(center).map(function (box) { return new Octree(box); });
        }
        this.label = null;
        var shatter = paintbox.shatter(center);
        // This happens when the painting box is entirely contained in this box
        if (shatter.length === 1) {
            var octant = this.bbox.octant(paintbox.center());
            if (octant < 0) {
                console.warn("Octant " + octant + " was an error code for " + this.bbox);
                return;
            }
            var child = this.children[octant];
            child.paint(paintbox, label);
            return;
        }
        for (var i = 0; i < 8; i++) {
            var box = shatter[i];
            var child = this.children[i];
            child.paint(box, label);
        }
        // merge children when they all agree to prevent sprawl
        if (this.areAllChildrenSame()) {
            this.children = null;
            this.label = label;
        }
    };
    Octree.prototype.areAllChildrenSame = function () {
        var all_same = true;
        var first_label = this.children[0].label;
        if (first_label === null) {
            return false;
        }
        for (var i = 0; i < 8; i++) {
            var child = this.children[i];
            all_same = all_same && (first_label === child.label);
            if (!all_same) {
                break;
            }
        }
        return all_same;
    };
    Octree.prototype.look = function (x, y, z) {
        if (this.label !== null) {
            return this.label;
        }
        var octant = this.bbox.octant(Vec3.create(x, y, z));
        if (octant < 0) {
            throw new Error("${octant} was not a good value.");
        }
        return this.children[octant].look(x, y, z);
    };
    Octree.prototype.toString = function () {
        var isleaf = this.children
            ? ""
            : ", leaf";
        return "Octree(" + this.label + ", " + this.bbox + isleaf + ")";
    };
    return Octree;
}());
exports.Octree = Octree;
