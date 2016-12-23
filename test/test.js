var should = require('should');
var regionOctree = require('../region-octree.js');

var Bbox = regionOctree.Bbox;
var Vec3 = regionOctree.Vec3;
var Octree = regionOctree.Octree;
var OctreeNode = regionOctree.OctreeNode;

describe('Bbox', function () {
	it('Should correctly return a centerpoint.', function () {
		var box = Bbox.create(0,0,0, 2,2,2);
		
		var pt = new Vec3(1,1,1);
		var center = box.center();

		Vec3.equals(pt, center).should.equal(true);
	});

	it('Should correctly return a floating centerpoint.', function () {
		var box = Bbox.create(0,0,0, 3,3,3);
		
		var val = 1.49999999999999999999;
		var goodpt = new Vec3(val, val, val);

		val = 1.47;
		var badpt = new Vec3(val, val, val);

		var center = box.center();

		Vec3.equals(goodpt, center).should.equal(true);
		Vec3.equals(badpt, center).should.equal(false);
	});


	it('Should compute intersections correctly.', function () {
		var box1 = Bbox.create(0,0,0, 1,1,1),
			box2 = Bbox.create(-2,-2,-2, -1,-1,-1),
			box3 = Bbox.create(5,0,0, 7,1,1),
			box4 = Bbox.create(-0.5,0,0, 2,1,1),
			box5 = Bbox.create(0.1,0.1,0.1, 0.5,0.5,0.5);

		box1.intersects(box2).should.equal(false);
		box1.intersects(box3).should.equal(false);
		box1.intersects(box4).should.equal(true);
		box1.intersects(box5).should.equal(true);

		box2.intersects(box1).should.equal(false);
		box3.intersects(box1).should.equal(false);
		box4.intersects(box1).should.equal(true);
		box5.intersects(box1).should.equal(true);
	});

	it('Computes point containment.', function () {
		var box1 = Bbox.cube(1);

		var centerpt = Vec3.create(0.5, 0.5, 0.5);
		box1.contains(centerpt).should.equal(true);

		box1.contains(box1.min).should.equal(false);
		box1.contains(box1.max).should.equal(false);

		var farpt = Vec3.create(10, 0, 0);
		box1.contains(farpt).should.equal(false);

		var corner = Vec3.create(0.99999, 0.001, 0.001);
		box1.contains(corner).should.equal(true);
	});

	it('Should shatter 8', function () {
		var box1 = Bbox.cube(1);
		var pt = Vec3.create(0.5, 0.5, 0.5);

		var shatter = box1.shatter8(pt);
		shatter.length.should.equal(8);

		Bbox.equals(shatter[0], Bbox.create(0,0,0, 0.5,0.5,0.5)).should.equal(true);
		Bbox.equals(shatter[1], Bbox.create(0.5,0,0, 1,0.5,0.5)).should.equal(true);
		Bbox.equals(shatter[2], Bbox.create(0,0.5,0, 0.5,1,0.5)).should.equal(true);
		Bbox.equals(shatter[3], Bbox.create(0.5,0.5,0, 1,1,0.5)).should.equal(true);
		Bbox.equals(shatter[4], Bbox.create(0,0,0.5, 0.5,0.5,1)).should.equal(true);
		Bbox.equals(shatter[5], Bbox.create(0.5,0,0.5, 1,0.5,1)).should.equal(true);
		Bbox.equals(shatter[6], Bbox.create(0,0.5,0.5, 0.5,1,1)).should.equal(true);
		Bbox.equals(shatter[7], Bbox.create(0.5,0.5,0.5, 1,1,1)).should.equal(true);

		pt = Vec3.create(0.5, 0.1, 0.1);
		box1.shatter8(pt).length.should.equal(8);

		pt = Vec3.create(0.5, 0, 0);
		box1.shatter8(pt).length.should.equal(1);
	});

	it('Splits on boundaries', function () {
		var box1 = Bbox.cube(10);
		
		function validate (pt, expected) {
			box1.contains(pt).should.equal(false);
			var shatter = box1.shatter(pt);
			shatter.length.should.equal(expected);
		}

		validate(Vec3.create(10, 10, 5), 2);
		validate(Vec3.create(10, 3, 10), 2);
		validate(Vec3.create(2, 10, 10), 2);
		validate(Vec3.create(0, 4, 0), 2);
		validate(Vec3.create(1, 2, 0), 4);
	});

	it('Compute octant', function () {
		var box = Bbox.create(0,0,0, 100,100,100);

		// box.octant( Vec3.create(-1, 0, 0) ).should.equal(-1);
		box.octant( Vec3.create(1, 1, 1) ).should.equal(0);
		box.octant( Vec3.create(51, 1, 1) ).should.equal(1);
		box.octant( Vec3.create(1, 51, 1) ).should.equal(2);
		box.octant( Vec3.create(51, 51, 1) ).should.equal(3);
		box.octant( Vec3.create(1, 1, 51) ).should.equal(4);
		box.octant( Vec3.create(51, 1, 51) ).should.equal(5);
		box.octant( Vec3.create(1, 51, 51) ).should.equal(6);
		box.octant( Vec3.create(51, 51, 51) ).should.equal(7);

		// box.octant( Vec3.create(50, 50, 50) ).should.equal(-2);
	});
});

describe('Octree', function () {
	it('Treesize Computed Correctly', function () {
		var box1 = Bbox.cube(1);
		var box2 = Bbox.cube(2);
		var root = new OctreeNode(box2);

		root.treesize().should.equal(1);

		root.children = new Array(8);
		root.children[0] = new OctreeNode(box1);
		root.children[4] = new OctreeNode(Bbox.create(0,0,1, 1,1,2));

		root.treesize().should.equal(3);
	});

	it('Treedepth Computed Correctly', function () {
		var box1 = Bbox.cube(1);
		var box2 = Bbox.cube(2);
		var root = new OctreeNode(box2);

		root.treedepth().should.equal(1);

		root.children = new Array(8);
		root.children[0] = new OctreeNode(box1);
		root.children[4] = new OctreeNode(Bbox.create(0,0,1, 1,1,2));

		root.treedepth().should.equal(2);

		root.children[0].children = new Array(8);
		root.children[0].children[0] = new OctreeNode(Bbox.create(0,0,0.5, 0.5,0.5,1));

		root.treedepth().should.equal(3);
	});

	it('Can paint a 1 voxel tree.', function () {
		var box1 = Bbox.cube(1);
		var box2 = Bbox.cube(2);
		var root = new OctreeNode( box1 );
		root.paint(box1, 666);

		root.treesize().should.equal(1);
		
		root.label.should.equal(666);
	});

	it('Can paint an octant of a 2x2x2 volume.', function () {
		var box1 = Bbox.cube(1);
		var box2 = Bbox.cube(2);
		var root = new OctreeNode( box2 );
		root.paint(box1, 666);

		root.treesize().should.equal(1 + 8);
		
		root.children[0].label.should.equal(666);
		should(root.children[0].children).be.null;

		for (var i = 1; i < 8; i++) {
			root.children[i].label.should.equal(0);
			should(root.children[i].children).be.null;
		}
	});

	it('Can paint a pixel of a 4x4x4 volume.', function () {
		var box1 = Bbox.cube(1);
		var root = new OctreeNode( Bbox.create(0,0,0, 4,4,4) );
		root.paint(box1, 666);

		root.treesize().should.equal(1 + 8 + 8);
		root.treedepth().should.equal(3);
		
		for (var i = 1; i < 8; i++) {
			root.children[i].label.should.equal(0);
			should(root.children[i].children).be.null;
		}

		root.children[0].children[0].label.should.equal(666);

		for (var i = 0; i < 8; i++) {
			should(root.children[0].children[i].children).be.null;
		}
	});

	it('Can paint center volume of a 4x4x4 volume.', function () {
		var root = new OctreeNode( Bbox.create(0,0,0, 4,4,4) );
		root.paint(Bbox.create(1,1,1, 2,2,2), 666);

		root.treesize().should.equal(1 + 8 + 8);
		root.treedepth().should.equal(3);

		root.children[0].children[7].label.should.equal(666);

		root.paint(Bbox.create(1,1,1, 3,3,3), 666);

		root.treesize().should.equal(1 + 8 + 8 * 8);
		root.treedepth().should.equal(3);

		root.children[0].children[7].label.should.equal(666);
		root.children[1].children[6].label.should.equal(666);
		root.children[2].children[5].label.should.equal(666);
		root.children[3].children[4].label.should.equal(666);
		root.children[4].children[3].label.should.equal(666);
		root.children[5].children[2].label.should.equal(666);
		root.children[6].children[1].label.should.equal(666);
		root.children[7].children[0].label.should.equal(666);

		// pick a random uncolored cube
		root.children[7].children[2].label.should.equal(0);
	});

	it('Can look up a voxel value in a 4^3', function () {
		var size = 4;
		var root = new OctreeNode( Bbox.cube(size) );

		function validate (root, x,y,z) {
			root.voxel(x,y,z).should.equal(label(x,y,z));
		}

		// paint
		forxyz(size, (x,y,z) => {
			var vx = voxel(new Vec3(x,y,z));
			root.paint(vx, label(x, y, z));
		});

		forxyz(size, validate.bind(root, root));

		root.treesize().should.equal(maxsize(size));
		root.treedepth().should.equal(Math.log2(size) + 1);
	});

	it('Can paint a z-line that crosses boundaries.', function () {
		var size = 8;

		var root = new OctreeNode( Bbox.cube(size) );
		root.paint(Bbox.create(2,2,2, 3,3,5), 666);

		root.treedepth().should.equal(4);
		root.treesize().should.equal(1 + 8 + 2*8 + 8 + 8);

		root.voxel(2,2,2).should.equal(666);
		root.voxel(2,2,3).should.equal(666);
		root.voxel(2,2,4).should.equal(666);
	});

	it('e2198 -- Can paint center volume of a 256^3 volume.', function () {
		var size = 256;
		var sm = size / 4; 
		var lg = 3 * size / 4;

		var root = new OctreeNode( Bbox.cube(size) );
		root.paint(Bbox.create(sm,sm,sm, lg,lg,lg), 666);

		root.treedepth().should.equal(3);
		root.treesize().should.equal(1 + 8 + 8*8)
	});

	it('e2198 -- Color a 16^3 volume uniformly.', function () {
		var size = 64;
		
		var root = new OctreeNode( Bbox.cube(size) );
		
		forxyz(size, (x,y,z) => {
			root.paintVoxel(x + 0.5, y + 0.5, z + 0.5, 666);
		});

		root.treedepth().should.equal(1);
		root.treesize().should.equal(1);
	});

	it('Retrieves slices correctly', function () {
		var size = 2;
		var tree = new Octree( Vec3.create(size,size,size), 4 );

		// paint
		forxyz(size, (x,y,z) => {
			var vx = voxel(new Vec3(x,y,z));
			tree.root.paint(vx, label(x, y, z));
		});

		function validate (sq, x,y, val) {
			sq[x + size * y].should.equal(val);
		}

		var square = tree.slice('z', 0, 4);

		validate(square, 0,0, label(0,0,0));
		validate(square, 1,0, label(1,0,0));
		validate(square, 0,1, label(0,1,0));
		validate(square, 1,1, label(1,1,0));

		square = tree.slice('z', 1, 4);

		validate(square, 0,0, label(0,0,1));
		validate(square, 1,0, label(1,0,1));
		validate(square, 0,1, label(0,1,1));
		validate(square, 1,1, label(1,1,1));

		square = tree.slice('y', 0, 4);

		validate(square, 0,0, label(0,0,0));
		validate(square, 1,0, label(1,0,0));
		validate(square, 0,1, label(0,0,1));
		validate(square, 1,1, label(1,0,1));

		square = tree.slice('y', 1, 4);

		validate(square, 0,0, label(0,1,0));
		validate(square, 1,0, label(1,1,0));
		validate(square, 0,1, label(0,1,1));
		validate(square, 1,1, label(1,1,1));

		square = tree.slice('x', 0, 4);

		validate(square, 0,0, label(0,0,0));
		validate(square, 1,0, label(0,1,0));
		validate(square, 0,1, label(0,0,1));
		validate(square, 1,1, label(0,1,1));

		square = tree.slice('x', 1, 4);

		validate(square, 0,0, label(1,0,0));
		validate(square, 1,0, label(1,1,0));
		validate(square, 0,1, label(1,0,1));
		validate(square, 1,1, label(1,1,1));
	});

	function forxyz (size, fn) {
		for (var x = 0; x < size; x++) {
			for (var y = 0; y < size; y++) {
				for (var z = 0; z < size; z++) {
					fn(x,y,z);
				}
			}
		}
	}

	function maxsize (size) {
		var depth = Math.log2(size);
		var sum = 0;
		for (var i = depth; i >= 0; i--) {
			sum += Math.pow(8, i);
		}

		return sum;
	}

	function voxel (pt) {
		return Bbox.create(pt.x, pt.y, pt.z, pt.x + 1, pt.y + 1, pt.z + 1);
	}

	function label(x,y,z) {
		return (x | (y << 8) | (z << 16));
	}
});

