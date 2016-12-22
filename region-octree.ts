
const EPSILON = 1e-14;

function clamp (val, lower, upper) : number {
	return Math.max(Math.min(val, upper), lower);
}

interface RGBA {
    r: number;
    g: number;
    b: number;
    a: number;
}

export class Vec3 {
	x: number;
	y: number;
	z: number;

	constructor(x: number, y: number, z: number) {
		this.x = x;
		this.y = y;
		this.z = z;
	}

	static create (x: number, y: number, z: number) : Vec3 {
		return new Vec3(x,y,z);
	}

	static equals (a: Vec3, b: Vec3) : boolean {
		return (
			Math.abs(a.x - b.x) < EPSILON 
			&& Math.abs(a.y - b.y) < EPSILON 
			&& Math.abs(a.z - b.z) < EPSILON
		);
	}

	isPowerOfTwo () : boolean {
		function pot (n) {
			if (n !== (n|0)) {
				return false;
			}

			// if n is power of two, n - 1 is all ones to the right of the MSB
			// test for n is not a power of two and logically negate
			return !(n !== 1 && (n & (n - 1)));
		}

		return pot(this.x) && pot(this.y) && pot(this.z);
	}

	addScalar (n: number) : Vec3 {
		this.x += n;
		this.y += n;
		this.z += n;
		return this;
	}

	multScalar (n: number) : Vec3 {
		this.x *= n;
		this.y *= n;
		this.z *= n;
		return this;
	}

	clamp (minpt: Vec3, maxpt: Vec3) : Vec3 {
		let pt = this.clone();
		pt.x = clamp(pt.x, minpt.x, maxpt.x);
		pt.y = clamp(pt.y, minpt.y, maxpt.y);
		pt.z = clamp(pt.z, minpt.z, maxpt.z);

		return pt;
	}

	clone () : Vec3 {
		return new Vec3(this.x, this.y, this.z);
	}

	equals (vec: Vec3) : boolean {
		return Vec3.equals(this, vec);
	}

	toString (): string {
		return `Vec3(${this.x}, ${this.y}, ${this.z})`;
	}
}

export class Bbox {
	min: Vec3; // bottom left
	max: Vec3; // top right
	constructor(a: Vec3, b: Vec3) {
		this.min = new Vec3(
			Math.min(a.x, b.x),
			Math.min(a.y, b.y),
			Math.min(a.z, b.z)
		);

		this.max = new Vec3(
			Math.max(a.x, b.x),
			Math.max(a.y, b.y),
			Math.max(a.z, b.z)
		);
	}

	static create (a:number,b:number,c:number, x:number,y:number,z:number) : Bbox {
		return new Bbox(
			(new Vec3(a,b,c)),
			(new Vec3(x,y,z))
		);
	}

	static cube (side: number) : Bbox {
		return Bbox.create(0,0,0, side,side,side);
	}

	isPowerOfTwo () : boolean {
		return this.size3().isPowerOfTwo();
	}

	octant (point: Vec3) : number {
		let container = this;

		if (!container.contains(point)) {
			return -1;
		}

		let center = container.center();

		let abs = Math.abs;

		let feq = (a,b) => abs(a - b) < EPSILON;

		// If point is located in between octants on the xy, xz, or yz planes.
		if (   feq(center.x, point.x) 
			|| feq(center.y, point.y) 
			|| feq(center.z, point.z)) {

			return -2;
		}

		return (
			  +((center.x - point.x) < 0)
			| (+((center.y - point.y) < 0) << 1)
			| (+((center.z - point.z) < 0) << 2)
		);
	}

	static equals (a: Bbox, b: Bbox) : boolean {
		return a.equals(b);	
	}

	equals (box: Bbox) : boolean {
		return this.min.equals(box.min) && this.max.equals(box.max);
	}

	clone () : Bbox {
		return new Bbox(
			this.min.clone(),
			this.max.clone()
		);
	}

	clamp (box: Bbox) : Bbox {
		var bounding = this;
		var clamped = box.clone();

		clamped.min = clamped.min.clamp(bounding.min, bounding.max); 
		clamped.max = clamped.max.clamp(bounding.min, bounding.max);

		return clamped;
	}

	// Shatter a bbox into up to 8 octants 
	shatter8 (chissel: Vec3) : Bbox[] {
		let glassbox = this;

		if (!glassbox.contains(chissel)) {
			return [ glassbox ];
		}

		function create (pt1, pt2) : Bbox {
			return new Bbox(pt1, pt2);
		}

		let center = glassbox.center();

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
			create(glassbox.min, center), // bottom left
			Bbox.create(center.x, glassbox.min.y, glassbox.min.z,  glassbox.max.x, center.y, center.z), // bottom right
			Bbox.create(glassbox.min.x, center.y, glassbox.min.z,  center.x, glassbox.max.y, center.z), // top left
			Bbox.create(center.x, center.y, glassbox.min.z,  glassbox.max.x, glassbox.max.y, center.z), // top right

			// z = 1
			
			Bbox.create(glassbox.min.x, glassbox.min.y, center.z,  center.x, center.y, glassbox.max.z), // bottom left
			Bbox.create(center.x, glassbox.min.y, center.z,  glassbox.max.x, center.y, glassbox.max.z), // bottom right
			Bbox.create(glassbox.min.x, center.y, center.z,  center.x, glassbox.max.y, glassbox.max.z), // top left
			create(center, glassbox.max) // top right
		];
	}

	// Shatter a bbox into up to 8 octants 
	shatter (chissel: Vec3) : Bbox[] {
		let glassbox = this;

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

		let arr = new Array(8); // 0th

		[ arr[0], arr[1] ] = glassbox.split('x', chissel.x); // 1st
		
		if (arr[0]) // 2nd
			[ arr[4], arr[5] ] = arr[0].split('y', chissel.y)
		if (arr[1]) // 3rd
			[ arr[6], arr[7] ] = arr[1].split('y', chissel.y)

		if (arr[4]) // 4th
			[ arr[0], arr[1] ] = arr[4].split('z', chissel.z);
		else {
			arr[0] = null;
			arr[1] = null;
		}

		if (arr[5]) // 5th
			[ arr[2], arr[4] ] = arr[5].split('z', chissel.z);
		else {
			arr[2] = null;
			arr[4] = null;
		}
		if (arr[6]) // 6th
			[ arr[4], arr[5] ] = arr[6].split('z', chissel.z);
		else {
			arr[4] = null;
			arr[5] = null;
		}
		if (arr[7]) // 7th
			[ arr[6], arr[7] ] = arr[7].split('z', chissel.z);
		else {
			arr[6] = null;
			arr[7] = null;
		}

		return arr.filter( (x) => x );
	}

	split (axis: string, value: number) : Bbox[] {
		let original = this;

		if (original.min[axis] >= (value - EPSILON) || original.max[axis] <= (value + EPSILON)) {
			return [ original, null ];
		}

		// left and right names make sense on x-axis but the logic applies to all
		let left = original.clone(),
			right = original.clone();

		left.max[axis] = value;
		right.min[axis] = value;

		return [ left, right ];
	}

	contains (point: Vec3) : boolean {
		return (
			   point.x > this.min.x 
			&& point.y > this.min.y
			&& point.z > this.min.z 
			&& point.x < this.max.x 
			&& point.y < this.max.y
			&& point.z < this.max.z 
		);
	}

	containsInclusive (point : Vec3) : boolean {
		return (
			   point.x >= (this.min.x - EPSILON) 
			&& point.y >= (this.min.y - EPSILON)
			&& point.z >= (this.min.z - EPSILON) 
			&& point.x <= (this.max.x + EPSILON) 
			&& point.y <= (this.max.y + EPSILON)
			&& point.z <= (this.max.z + EPSILON) 
		);
	}

	// test for intersection
	intersects (box: Bbox) : boolean {
		let a = this, b = box;

		// prove that they don't not intersect is more efficient
		// than constructing an intersection
		return !(
			(
			  	 a.max.x < b.min.x
			  || a.max.y < b.min.y
			  || a.max.z < b.min.z
			)
			|| (
				 a.min.x > b.max.x
			  || a.min.y > b.max.y
			  || a.min.z > b.max.z
			)
		);
	}

	// return centroid of bbox
	center () : Vec3 {
		return new Vec3(
			(this.min.x + this.max.x) / 2,
			(this.min.y + this.max.y) / 2,
			(this.min.z + this.max.z) / 2
		);
	}

	size3 () : Vec3 {
		return new Vec3(
			(this.max.x - this.min.x),
			(this.max.y - this.min.y),
			(this.max.z - this.min.z)
		);
	}

	volume () : number {
		let size = this.size3();
		return size.x * size.y * size.z;
	}

	toString () : string {
		return `Bbox(${this.min}, ${this.max})`;
	}
}

export class Octree {
	label: number;
	bbox: Bbox;
	children: Octree[];

	constructor(bbox: Bbox) {
		this.bbox = bbox.clone();
		this.children = null;
		this.label = null;
	}

	print () : void {
		console.log(this.toString());
		if (this.children) {
			this.children.forEach(function (node) {
				node.print();
			})
		}
	}

	// get number of nodes in the current subtree
	treesize () : number {
		let size = 1;

		if (!this.children) {
			return size;
		}

		this.children.forEach(function (node) {
			if (node) {
				size += node.treesize();
			}
		});

		return size;
	}

	// find max depth of the current subtee
	treedepth (depth = 1) : number {
		let node = this;

		if (this.children === null) {
			return depth;
		}

		let curdepth = depth;

		node.children.forEach(function (node) {
			curdepth = Math.max(curdepth, node.treedepth(depth + 1));
		});

		return curdepth;
	}

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

	slice<T> (axis: string, index: number, bytes: number) : T[] {
		let _this = this;
		let faces = {
			x: [ 'y', 'z' ],
			y: [ 'x', 'z' ],
			z: [ 'x', 'y' ],
		};
		let face = faces[axis];

		let center = _this.bbox.center();
		center[axis] = index;

		if (!_this.bbox.containsInclusive(center)) {
			throw new Error(index + ' is out of bounds.');
		}

		let size = this.bbox.size3();

		let ArrayType = this.arrayType(bytes);
		let square = new ArrayType(size[face[0]] * size[face[1]]);

		let i = square.length - 1;
		if (axis === 'x') {
			for (let z = _this.bbox.max.z - 1; z >= 0; --z) {
				for (let y = _this.bbox.max.y - 1; y >= 0; --y) {
					square[i] = _this.voxel(index, y, z);
					--i;
				}
			}
		}
		else if (axis === 'y') {
			for (let z = _this.bbox.max.z - 1; z >= 0; --z) {
				for (let x = _this.bbox.max.x - 1; x >= 0; --x) { 
					square[i] = _this.voxel(x, index, z);
					--i;
				}
			}
		}
		else if (axis === 'z') {
			for (let y = _this.bbox.max.y - 1; y >= 0; --y) {
				for (let x = _this.bbox.max.x - 1; x >= 0; --x) { 
					square[i] = _this.voxel(x, y, index);
					--i;
				}
			}
		}

		return square;
	}

	// Do the bboxes match? If yes, then delete all children
	// and set the label. 
	// Else, shatter box and paint each assigned subvolume
	// if a child doesn't exist, create one
	paint (paintbox: Bbox, label: number) : void {
		if (paintbox.equals(this.bbox)) {
			this.children = null;
			this.label = label;
			return;
		}
		else if (this.bbox.volume() <= 1) {
			if (paintbox.volume() >= 0.5) {
				this.label = label;
				this.children = null;
			}
			return;
		}
		else if (paintbox.volume() < 0.5) {
			return;
		}

		let center = this.bbox.center();

		if (this.children === null) {
			this.children = this.bbox.shatter8(center).map( (box) => new Octree(box) );
		}

		this.label = null;
		let shatter = paintbox.shatter( center ).map( (box) => box.clamp(this.bbox) );
		
		if (shatter.length === 8) {
			for (let octant = 0; octant < 8; octant++) {
				let box = shatter[octant];
				let child = this.children[octant];
				child.paint(box, label);
			}
		}
		else {
			for (let i = shatter.length - 1; i >= 0; i--) {
				let box = shatter[i];
				let octant = this.bbox.octant(box.center());

				// -1 = not contained in this box, 
				// -2 = point is located in between two, four, or eight octants on the boundary
				if (octant < 0) {
					console.warn(`Octant ${octant} was an error code for ${this.bbox}, ${paintbox}, ${center}`);
					continue;
				}

				let child = this.children[octant];
				child.paint(box, label);
			}
		}

		// merge children when they all agree to prevent sprawl
		if (this.areAllChildrenSame()) {
			this.children = null;
			this.label = label;
		}
	}

	areAllChildrenSame () : boolean {
		let all_same = true;
		let first_label = this.children[0].label;

		if (first_label === null) {
			return false;
		}

		for (let i = 0; i < 8; i++) {
			let child = this.children[i];
			all_same = all_same && (first_label === child.label);
			
			if (!all_same) {
				break;
			}
		}

		return all_same;
	}

	voxel (x: number, y: number, z: number) : number {
		if (this.label !== null) {
			return this.label;
		}
		else if (!this.children) {
			return null;
		}

		let octant = this.bbox.octant(Vec3.create(x + 0.5, y + 0.5, z + 0.5));

		if (octant < 0) {
			throw new Error(`Octant ${octant} was an error code for ${this.bbox} @ ${x}, ${y}, ${z}.`);
		}

		return this.children[octant].voxel(x,y,z);
	}

	// http://stackoverflow.com/questions/504030/javascript-endian-encoding
	// http://stackoverflow.com/questions/19499500/canvas-getimagedata-for-optimal-performance-to-pull-out-all-data-or-one-at-a
	isLittleEndian () : boolean {
		var arr32 = new Uint32Array(1);
		var arr8 = new Uint8Array(arr32.buffer);
		arr32[0] = 255;

		if (arr8[0] === 255) {
			this.isLittleEndian = () => true;
		}
		else {
			this.isLittleEndian = () => false;	
		}

		return this.isLittleEndian();
	}

	// For internal use, return the right bitmask for rgba image slicing
	// depending on CPU endianess.
	getRenderMaskSet () : RGBA {
		let bitmasks : RGBA[] = [
			{ // little endian, most architectures
				r: 0x000000ff,
				g: 0x0000ff00,
				b: 0x00ff0000,
				a: 0xff000000,
			},
			{ // big endian, mostly ARM and some specialized equipment
				r: 0xff000000,
				g: 0x00ff0000,
				b: 0x0000ff00,
				a: 0x000000ff,
			},
		];

		return bitmasks[this.isLittleEndian() ? 0 : 1];
	}

	arrayType (bytes) {
		let choices = {
			1: Uint8ClampedArray,
			2: Uint16Array,
			4: Uint32Array,
		};

		let ArrayType = choices[bytes];

		if (ArrayType === undefined) {
			throw new Error(bytes + ' is not a valid typed array byte count.');
		}

		return ArrayType;
	}

	toString () : string {
		let isleaf = this.children 
			? ""
			: ", leaf";
		return `Octree(${this.label}, ${this.bbox}${isleaf})`;
	}
}

