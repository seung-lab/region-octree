"use strict";
var EPSILON = 1e-14;
function clamp(val, lower, upper) {
    return Math.max(Math.min(val, upper), lower);
}
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
    Vec3.prototype.isPowerOfTwo = function () {
        function pot(n) {
            if (n !== (n | 0)) {
                return false;
            }
            // if n is power of two, n - 1 is all ones to the right of the MSB
            // test for n is not a power of two and logically negate
            return !(n !== 1 && (n & (n - 1)));
        }
        return pot(this.x) && pot(this.y) && pot(this.z);
    };
    Vec3.prototype.addScalar = function (n) {
        this.x += n;
        this.y += n;
        this.z += n;
        return this;
    };
    Vec3.prototype.multScalar = function (n) {
        this.x *= n;
        this.y *= n;
        this.z *= n;
        return this;
    };
    Vec3.prototype.fastClamp = function (minpt, maxpt) {
        var pt = this;
        pt.x = clamp(pt.x, minpt.x, maxpt.x);
        pt.y = clamp(pt.y, minpt.y, maxpt.y);
        pt.z = clamp(pt.z, minpt.z, maxpt.z);
        return pt;
    };
    Vec3.prototype.clamp = function (minpt, maxpt) {
        var pt = this.clone();
        pt.x = clamp(pt.x, minpt.x, maxpt.x);
        pt.y = clamp(pt.y, minpt.y, maxpt.y);
        pt.z = clamp(pt.z, minpt.z, maxpt.z);
        return pt;
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
    Bbox.cube = function (side) {
        return Bbox.create(0, 0, 0, side, side, side);
    };
    Bbox.prototype.isPowerOfTwo = function () {
        return this.size3().isPowerOfTwo();
    };
    Bbox.prototype.octant = function (point) {
        var container = this;
        if (!container.contains(point)) {
            return -1;
        }
        var center = container.center();
        var abs = Math.abs;
        var feq = function (a, b) { return abs(a - b) < EPSILON; };
        // If point is located in between octants on the xy, xz, or yz planes.
        if (feq(center.x, point.x)
            || feq(center.y, point.y)
            || feq(center.z, point.z)) {
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
    Bbox.prototype.fastClamp = function (clampingbox) {
        var boxtoclamp = this;
        boxtoclamp.min.fastClamp(clampingbox.min, clampingbox.max);
        boxtoclamp.max.fastClamp(clampingbox.min, clampingbox.max);
        return boxtoclamp;
    };
    Bbox.prototype.clamp = function (box) {
        var bounding = this;
        var clamped = box.clone();
        clamped.min = clamped.min.clamp(bounding.min, bounding.max);
        clamped.max = clamped.max.clamp(bounding.min, bounding.max);
        return clamped;
    };
    // Shatter a bbox into up to 8 octants 
    Bbox.prototype.shatter8 = function (chissel) {
        var glassbox = this;
        if (!glassbox.contains(chissel)) {
            return [glassbox];
        }
        function create(pt1, pt2) {
            return new Bbox(pt1, pt2);
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
    // Shatter a bbox into up to 8 octants 
    Bbox.prototype.shatter = function (chissel) {
        var glassbox = this;
        if (glassbox.contains(chissel)) {
            // slightly more efficient and lays out indicies 
            // in bitmappable fashion
            return glassbox.shatter8(chissel);
        }
        // this looks bizzare but it's essentially a way to avoid 
        // creating more arrays so its somewhat faster
        // [  .,  .,  .,  .,  .,  .,  .,  .] 0th
        // [ xl, xr,  .,  .,  .,  .,  .,  .] 1st
        // [  -, xr,  .,  ., yl, yr,  .,  .] 2nd
        // [  -,  -,  .,  ., yl, yr, yl, yr] 3rd
        // [ z1, z2,  .,  .,  -, yr, yl, yr] 4th
        // [ z1, z2, z3, z4,  -,  -, yl, yr] 5th
        // [ z1, z2, z3, z4, z5, z6,  -, yr] 6th
        // [ z1, z2, z3, z4, z5, z6, z7, z8] 7th
        // key: . = empty, - = used
        var arr = new Array(8); // 0th
        _a = glassbox.split('x', chissel.x), arr[0] = _a[0], arr[1] = _a[1]; // 1st
        if (arr[0])
            _b = arr[0].split('y', chissel.y), arr[4] = _b[0], arr[5] = _b[1];
        if (arr[1])
            _c = arr[1].split('y', chissel.y), arr[6] = _c[0], arr[7] = _c[1];
        if (arr[4])
            _d = arr[4].split('z', chissel.z), arr[0] = _d[0], arr[1] = _d[1];
        else {
            arr[0] = null;
            arr[1] = null;
        }
        if (arr[5])
            _e = arr[5].split('z', chissel.z), arr[2] = _e[0], arr[4] = _e[1];
        else {
            arr[2] = null;
            arr[4] = null;
        }
        if (arr[6])
            _f = arr[6].split('z', chissel.z), arr[4] = _f[0], arr[5] = _f[1];
        else {
            arr[4] = null;
            arr[5] = null;
        }
        if (arr[7])
            _g = arr[7].split('z', chissel.z), arr[6] = _g[0], arr[7] = _g[1];
        else {
            arr[6] = null;
            arr[7] = null;
        }
        return arr.filter(function (x) { return x; });
        var _a, _b, _c, _d, _e, _f, _g;
    };
    Bbox.prototype.split = function (axis, value) {
        var original = this;
        if (original.min[axis] >= (value - EPSILON) || original.max[axis] <= (value + EPSILON)) {
            return [original, null];
        }
        // left and right names make sense on x-axis but the logic applies to all
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
    Bbox.prototype.containsInclusive = function (point) {
        return (point.x >= (this.min.x - EPSILON)
            && point.y >= (this.min.y - EPSILON)
            && point.z >= (this.min.z - EPSILON)
            && point.x <= (this.max.x + EPSILON)
            && point.y <= (this.max.y + EPSILON)
            && point.z <= (this.max.z + EPSILON));
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
    Octree.prototype.print = function () {
        console.log(this.toString());
        if (this.children) {
            this.children.forEach(function (node) {
                node.print();
            });
        }
    };
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
    /*
    imageSlice (axis, index, bytes) : ImageData {
        let _this = this;

        let square = this.slice(axis, index, bytes);
        let size3 = this.bbox.size3();

        let sizes = {
            x: [ size3.y, size3.z ],
            y: [ size3.x, size3.z ],
            z: [ size3.x, size3.y ],
        };

        let size = sizes[axis];

        // see https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Pixel_manipulation_with_canvas
        let imgdata = this.canvas_context.createImageData(size[0], size[1]);

        let maskset = this.getRenderMaskSet();

        const rmask = maskset.r,
            gmask = maskset.g,
            bmask = maskset.b,
            amask = maskset.a;

        // if we break this for loop up by bytes, we can extract extra performance.
        // If we want to handle transparency efficiently, you'll want to break out the
        // 32 bit case so you can avoid an if statement.

        // you can also avoid doing the assignment for index 1 and 2 for 8 bit, and 2 for 16 bit
        // This code seemed more elegant to me though, so I won't prematurely optimize.

        let data = imgdata.data;

        let fixedalpha = bytes === 4 // no alpha channel w/ less than 4 bytes
            ? 0x00000000
            : 0xffffffff;

        let di = data.length - 4;
        for (let si = square.length - 1; si >= 0; si--) {
            data[di + 0] = (square[si] & rmask);
            data[di + 1] = (square[si] & gmask) >>> 8;
            data[di + 2] = (square[si] & bmask) >>> 16;
            data[di + 3] = ((square[si] & amask) | fixedalpha) >>> 24; // can handle transparency specially if necessary
                
            di -= 4;
        }

        return imgdata;
    }

    */
    Octree.prototype.slice = function (axis, index, bytes) {
        var _this = this;
        var faces = {
            x: ['y', 'z'],
            y: ['x', 'z'],
            z: ['x', 'y']
        };
        var face = faces[axis];
        var center = _this.bbox.center();
        center[axis] = index;
        if (!_this.bbox.containsInclusive(center)) {
            throw new Error(index + ' is out of bounds.');
        }
        var size = this.bbox.size3();
        var ArrayType = this.arrayType(bytes);
        var square = new ArrayType(size[face[0]] * size[face[1]]);
        var i = square.length - 1;
        if (axis === 'x') {
            for (var z = _this.bbox.max.z - 1; z >= 0; --z) {
                for (var y = _this.bbox.max.y - 1; y >= 0; --y) {
                    square[i] = _this.voxel(index, y, z);
                    --i;
                }
            }
        }
        else if (axis === 'y') {
            for (var z = _this.bbox.max.z - 1; z >= 0; --z) {
                for (var x = _this.bbox.max.x - 1; x >= 0; --x) {
                    square[i] = _this.voxel(x, index, z);
                    --i;
                }
            }
        }
        else if (axis === 'z') {
            for (var y = _this.bbox.max.y - 1; y >= 0; --y) {
                for (var x = _this.bbox.max.x - 1; x >= 0; --x) {
                    square[i] = _this.voxel(x, y, index);
                    --i;
                }
            }
        }
        return square;
    };
    // Do the bboxes match? If yes, then delete all children
    // and set the label. 
    // Else, shatter box and paint each assigned subvolume
    // if a child doesn't exist, create one
    Octree.prototype.paint = function (paintbox, label) {
        var _this = this;
        if (paintbox.equals(this.bbox)) {
            this.children = null;
            this.label = label;
            return;
        }
        else if (this.bbox.volume() <= 1) {
            return;
        }
        var center = this.bbox.center();
        if (this.children === null) {
            this.children = this.bbox.shatter8(center).map(function (box) { return new Octree(box); });
        }
        this.label = null;
        var shatter = paintbox.shatter(center).map(function (box) { return box.fastClamp(_this.bbox); });
        if (shatter.length === 8) {
            for (var octant = 0; octant < 8; octant++) {
                var box = shatter[octant];
                var child = this.children[octant];
                child.paint(box, label);
            }
        }
        else {
            for (var i = shatter.length - 1; i >= 0; i--) {
                var box = shatter[i];
                var octant = this.bbox.octant(box.center());
                // -1 = not contained in this box, 
                // -2 = point is located in between two, four, or eight octants on the boundary
                if (octant < 0) {
                    console.warn("Octant " + octant + " was an error code for " + this.bbox + ", " + paintbox + ", " + center);
                    continue;
                }
                var child = this.children[octant];
                child.paint(box, label);
            }
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
    Octree.prototype.voxel = function (x, y, z) {
        if (this.label !== null) {
            return this.label;
        }
        else if (!this.children) {
            return null;
        }
        var octant = this.bbox.octant(Vec3.create(x + 0.5, y + 0.5, z + 0.5));
        if (octant < 0) {
            throw new Error("Octant " + octant + " was an error code for " + this.bbox + " @ " + x + ", " + y + ", " + z + ".");
        }
        return this.children[octant].voxel(x, y, z);
    };
    // http://stackoverflow.com/questions/504030/javascript-endian-encoding
    // http://stackoverflow.com/questions/19499500/canvas-getimagedata-for-optimal-performance-to-pull-out-all-data-or-one-at-a
    Octree.prototype.isLittleEndian = function () {
        var arr32 = new Uint32Array(1);
        var arr8 = new Uint8Array(arr32.buffer);
        arr32[0] = 255;
        if (arr8[0] === 255) {
            this.isLittleEndian = function () { return true; };
        }
        else {
            this.isLittleEndian = function () { return false; };
        }
        return this.isLittleEndian();
    };
    // For internal use, return the right bitmask for rgba image slicing
    // depending on CPU endianess.
    Octree.prototype.getRenderMaskSet = function () {
        var bitmasks = [
            {
                r: 0x000000ff,
                g: 0x0000ff00,
                b: 0x00ff0000,
                a: 0xff000000
            },
            {
                r: 0xff000000,
                g: 0x00ff0000,
                b: 0x0000ff00,
                a: 0x000000ff
            },
        ];
        return bitmasks[this.isLittleEndian() ? 0 : 1];
    };
    Octree.prototype.arrayType = function (bytes) {
        var choices = {
            1: Uint8ClampedArray,
            2: Uint16Array,
            4: Uint32Array
        };
        var ArrayType = choices[bytes];
        if (ArrayType === undefined) {
            throw new Error(bytes + ' is not a valid typed array byte count.');
        }
        return ArrayType;
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
