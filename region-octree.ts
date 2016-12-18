
const EPSILON = 1e-10;

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

	static equals (a: Bbox, b: Bbox) : boolean {
		return a.min.equals(b.min) && a.max.equals(b.max);
	}

	clone () : Bbox {
		return new Bbox(
			this.min.clone(),
			this.max.clone()
		);
	}

	// Shatter a bbox into up to 8 octants 
	shatter (chissel: Vec3) : Bbox[] {
		let glassbox = this;

		if (!glassbox.contains(chissel)) {
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

		if (original.min[axis] > value || original.max[axis] < value) {
			return [ original ];
		}

		let left = original.clone(),
			right = original.clone();

		left.max[axis] = value;
		right.min[axis] = value;

		return [ left, right ];
	}

	equals (box: Bbox) : boolean {
		return Bbox.equals(this, box);
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

	toString () : string {
		return `Bbox(${this.min}, ${this.max})`;
	}
}

class Octree {
	dimension: Vec3;
	root: OctreeNode;
	constructor(width, height, depth) {
		this.dimension = Vec3.create(width, height, depth);
		// this.root = ;
	}

	paint (box: Bbox, label: number) : void {

	}

	erase (box: Bbox) : void {

	}

	look (x: number, y: number, z: number) : number {
		return 1;
	}
}

class OctreeNode {
	label: number;
	bbox: Bbox;
	isleaf: boolean;
	children: OctreeNode[];

	constructor(bbox: Bbox) {
		this.bbox = bbox;
		this.children = new Array(8);
	}

	look (x: number, y: number, z: number) : number {
		let minpt = this.bbox.min;

		// compute child index with no if statements
		let index = (
			  +((minpt.x - x) < 0)
			| (+((minpt.y - y) < 0) << 1)
			| (+((minpt.z - z) < 0) << 2)
		);

		return 1;
	}
}
