import sys
from PIL import Image

inputfile = open(sys.argv[1], 'r')
line = inputfile.readline()
while not line.strip().startswith("png"):
    line = inputfile.readline()
_, width, height, filename = line.split()
width, height = int(width), int(height)
assert width >0 and height > 0
image = Image.new("RGBA", (width, height), (0,0,0,0))
while line:
    line = line.strip()
    if line.startswith("xyrgb"):
        x, y, r, g, b = [(lambda x: int(x))(x) for x in line.split()[1:]]
        image.im.putpixel((x,y), (r, g, b, 255))
    if line.startswith("xyc"):
        x, y = [(lambda x: int(x))(x) for x in line.split()[1:3]]
        c = line.split()[3]
        assert len(c) == 7
        r = int(c[1:3], 16)
        g = int(c[3:5], 16)
        b = int(c[5:7], 16)
        image.im.putpixel((x,y), (r, g, b, 255))
    line = inputfile.readline()

image.save(filename)