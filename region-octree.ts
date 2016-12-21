
const EPSILON = 1e-14;

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

		let feq = (a,b) => Math.abs(a - b) < EPSILON;

		let cx = feq(center.x, point.x), 
			cy = feq(center.y, point.y), 
			cz = feq(center.z, point.z);

		// If point is located in between octants on the xy, xz, or yz planes.
		if (cx || cy || cz) {
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
		else if (!glassbox.containsInclusive(chissel)) {
			return [ glassbox ];
		}

		let splitx = glassbox.split('x', chissel.x);
		
		let splity = splitx.map( (box) => box.split('y', chissel.y) );

		let splity2 = [].concat.apply([], splity);

		let splitz = splity2.map( (box) => box.split('z', chissel.z) );

		return [].concat.apply([], splitz); 
	}

	split (axis: string, value: number) : Bbox[] {
		let original = this;

		if (original.min[axis] >= (value - EPSILON) || original.max[axis] <= (value + EPSILON)) {
			return [ original ];
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
			this.children = this.bbox.shatter(center).map( (box) => new Octree(box) );
		}

		this.label = null;
		let shatter = paintbox.shatter( center );

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

		let octant = this.bbox.octant(Vec3.create(x + 0.5, y + 0.5, z + 0.5));

		if (octant < 0) {
			throw new Error(`Octant ${octant} was an error code for ${this.bbox} @ ${x}, ${y}, ${z}.`);
		}

		return this.children[octant].voxel(x,y,z);
	}

	toString () : string {
		let isleaf = this.children 
			? ""
			: ", leaf";
		return `Octree(${this.label}, ${this.bbox}${isleaf})`;
	}
}
