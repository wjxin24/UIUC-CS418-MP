import sys
from PIL import Image

class Vertex:
    def __init__(self, x, y, z, w, r, g, b):
        self.x = x
        self.y = y
        self.z = z
        self.w = w
        self.r = r
        self.g = g
        self.b = b
        # pixel coordinate
        self.p_x = (x/w+1)*width/2
        self.p_y = (y/w+1)*height/2
    
    def toPixel(self):
        return Pixel(self.p_x, self.p_y, self.r, self.g, self.b)

class Pixel:
    def __init__(self, p_x, p_y, r, g ,b):
        self.p_x = p_x
        self.p_y = p_y
        self.r = r
        self.g = g
        self.b = b

    def __add__(self, A):
        return Pixel(self.p_x + A.p_x, self.p_y + A.p_y, self.r + A.r, self.g + A.g, self.b + A.b)

    def __sub__(self, A):
        return Pixel(self.p_x - A.p_x, self.p_y - A.p_y, self.r - A.r, self.g - A.g, self.b - A.b)

    def __mul__(self, k):
        return Pixel(self.p_x * k, self.p_y * k, self.r * k, self.g * k, self.b * k)
    __rmul__ = __mul__

def DDA(top: Vertex, mid: Vertex, low: Vertex):
    # top horizontal line with int y coordinate
    if int(top.p_y) == top.p_y and top.p_y == mid.p_y:
            drawline(top.toPixel(), mid.toPixel())
    else:
        y = int(top.p_y) + 1
        
    step_t_l = 1/(top.p_y - low.p_y) * (top.toPixel() - low.toPixel())
    if mid.p_y - low.p_y != 0:
        step_m_l = 1/(mid.p_y - low.p_y) * (mid.toPixel() - low.toPixel())

    
    offset_t_l = (y - top.p_y) * step_t_l
    
    if top.p_y - mid.p_y != 0:
        step_t_m = 1/(top.p_y - mid.p_y) * (top.toPixel() - mid.toPixel())
        offset_t_m = (y - top.p_y) * step_t_m
        if (top.toPixel() + step_t_l).p_x < (top.toPixel() + step_t_m).p_x:
            left = top.toPixel() + offset_t_l
            right = top.toPixel() + offset_t_m

            while (y <= mid.p_y and y < height):
                drawline(left, right)
                y += 1
                left += step_t_l
                right += step_t_m

            offset_m_l = (y - mid.p_y) * step_m_l
            right = mid.toPixel() + offset_m_l

            while (y < low.p_y and y < height):
                drawline(left, right)
                y += 1
                left += step_t_l
                right += step_m_l

        else:
            left = top.toPixel() + offset_t_m
            right = top.toPixel() + offset_t_l

            while (y <= mid.p_y and y < height):
                drawline(left, right)
                y += 1
                left += step_t_m
                right += step_t_l

            if (mid.p_y == low.p_y):
                return

            offset_m_l = (mid.p_y -y) * step_m_l
            left = mid.toPixel() - offset_m_l

            while (y < low.p_y and y < height):
                drawline(left, right)
                y += 1
                left += step_m_l
                right += step_t_l
    else:     
        offset_m_l = (y - mid.p_y) * step_m_l
        left = top.toPixel() + offset_t_l
        right = mid.toPixel() + offset_m_l
        while (y < low.p_y and y < height):
            drawline(left, right)
            y += 1
            left += step_t_l
            right += step_m_l


# fill the pixels along a horizontal line between left and right vertices
def drawline(left, right):
    if left.p_y < 0:
        return
    if left.p_x == right.p_x:
        if left.p_x == int(left.p_x):
            image.im.putpixel((round(left.p_x), round(left.p_y)), (round(left.r), round(left.g), round(left.b), 255))
        return
    if left.p_x == int(left.p_x):
        x = int(left.p_x)
    else:
        x = int(left.p_x) + 1
    step = 1/(right.p_x - left.p_x) * (right - left)
    offset = (x - left.p_x) * step
    pixel = left + offset
    while (x < 0):
        x += 1
        pixel += step
    while (x < right.p_x and x < width):
        image.im.putpixel((round(pixel.p_x), round(pixel.p_y)), (round(pixel.r), round(pixel.g), round(pixel.b), 255))
        print(pixel.p_x, left.p_y)
        x += 1
        pixel += step

inputfile = open(sys.argv[1], 'r')
# inputfile = open("D:\\0UIUC\\CS418\\MP1\\mp1files\\mp1req2.txt", 'r')
line = inputfile.readline()
while not line.strip().startswith("png"):
    line = inputfile.readline()
linesplit = line.split()
width, height = int(linesplit[1]), int(linesplit[2])
assert width > 0 and height > 0
filename = linesplit[3]
image = Image.new("RGBA", (width, height), (0,0,0,0))
currRGB = [255, 255, 255]
vertices = []
while line:
    line = line.strip()
    if line.startswith("rgb "):
        currRGB = [(lambda x: int(x))(x) for x in line.split()[1:]]
        
    if line.startswith("xyzw "):
        x, y, z, w = [(lambda x: float(x))(x) for x in line.split()[1:]]
        vertices.append(Vertex(x, y, z, w, currRGB[0], currRGB[1], currRGB[2]))
    
    if line.startswith("tri "):
        idx = [(lambda x: int(x))(x) for x in line.split()[1:]]
        tri = [(lambda i: vertices[i] if i < 0 else vertices[i-1])(i) for i in idx] 
        top, mid, low = sorted(tri, key = lambda v: [v.p_y, v.p_x])
        DDA(top, mid, low)

    line = inputfile.readline()

image.save(filename)

