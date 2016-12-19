var should = require('should');
var regionOctree = require('../region-octree.js');

var Bbox = regionOctree.Bbox;
var Vec3 = regionOctree.Vec3;

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
		var box1 = Bbox.create(0,0,0, 1,1,1);

		var centerpt = Vec3.create(0.5, 0.5, 0.5);
		box1.contains(centerpt).should.equal(true);

		box1.contains(box1.min).should.equal(false);
		box1.contains(box1.max).should.equal(false);

		var farpt = Vec3.create(10, 0, 0);
		box1.contains(farpt).should.equal(false);

		var corner = Vec3.create(0.99999, 0.001, 0.001);
		box1.contains(corner).should.equal(true);
	});

	it('Should shatter', function () {
		var box1 = Bbox.create(0,0,0, 1,1,1);
		var pt = Vec3.create(0.5, 0.5, 0.5);

		var shatter = box1.shatter(pt);
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
		box1.shatter(pt).length.should.equal(8);

		pt = Vec3.create(0.5, 0, 0);
		box1.shatter(pt).length.should.equal(1);

	});
});

