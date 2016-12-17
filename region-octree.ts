
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

	equals (box: bbox) : boolean {
		return Bbox.equals(this, box);
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


