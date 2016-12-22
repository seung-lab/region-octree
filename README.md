Region Octree
=============

Things that are currently slow:

- Paint (61%)
	- Maybe convert from recursive to iterative solution
- Garbage Collection (32%)
- BBox.center (5.5%)
- Octree.allChildrenAreSame (4.7%)
- Vec3.fastClamp (4%)