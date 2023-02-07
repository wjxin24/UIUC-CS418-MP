import sys
from PIL import Image

# keywords
DEPTH = False

class Pixel:
    def __init__(self, x, y, z, w, r, g, b):
        self.x = x
        self.y = y
        self.z = z
        self.w = w
        self.r = r
        self.g = g
        self.b = b

    def pixel_coor(self):
        return (self.x/self.w+1)*width/2,(self.y/self.w+1)*height/2

    def __add__(self, A):
        return Pixel(self.x + A.x, self.y + A.y, self.z + A.z, self.w + A.w,\
            self.r + A.r, self.g + A.g, self.b + A.b)

    def __sub__(self, A):
        return Pixel(self.x - A.x, self.y - A.y, self.z - A.z, self.w - A.w,\
            self.r - A.r, self.g - A.g, self.b - A.b)

    def __mul__(self, k):
        return Pixel(self.x * k, self.y * k, self.z * k, self.w * k,\
            self.r * k, self.g * k, self.b * k)
    __rmul__ = __mul__
    

def DDA(top: Pixel, mid: Pixel, low: Pixel):
    top_coor, mid_coor, low_coor = top.pixel_coor(), mid.pixel_coor(), low.pixel_coor()

    # top horizontal line with int y coordinate
    if int(top_coor[1]) == top_coor[1] and top_coor[1] == mid_coor[1]:
            drawline(top, mid)
    else:
        y = int(top_coor[1]) + 1
        
    step_t_l = 1/(top_coor[1] - low_coor[1]) * (top - low)
    if mid_coor[1] - low_coor[1] != 0:
        step_m_l = 1/(mid_coor[1] - low_coor[1]) * (mid - low)

    
    offset_t_l = (y - top_coor[1]) * step_t_l
    
    if top_coor[1] - mid_coor[1] != 0:
        step_t_m = 1/(top_coor[1] - mid_coor[1]) * (top - mid)
        offset_t_m = (y - top_coor[1]) * step_t_m
        if (top + step_t_l).pixel_coor()[0] < (top + step_t_m).pixel_coor()[0]:
            left = top + offset_t_l
            right = top + offset_t_m

            while (y <= mid_coor[1] and y < height):
                drawline(left, right)
                y += 1
                left += step_t_l
                right += step_t_m

            offset_m_l = (y - mid_coor[1]) * step_m_l
            right = mid + offset_m_l

            while (y < low_coor[1] and y < height):
                drawline(left, right)
                y += 1
                left += step_t_l
                right += step_m_l

        else:
            left = top + offset_t_m
            right = top + offset_t_l

            while (y <= mid_coor[1] and y < height):
                drawline(left, right)
                y += 1
                left += step_t_m
                right += step_t_l

            if (mid_coor[1] == low_coor[1]):
                return

            offset_m_l = (mid_coor[1] -y) * step_m_l
            left = mid - offset_m_l

            while (y < low_coor[1] and y < height):
                drawline(left, right)
                y += 1
                left += step_m_l
                right += step_t_l
    else:     
        offset_m_l = (y - mid_coor[1]) * step_m_l
        left = top + offset_t_l
        right = mid + offset_m_l
        while (y < low_coor[1] and y < height):
            drawline(left, right)
            y += 1
            left += step_t_l
            right += step_m_l


# fill the pixels along a horizontal line between left and right vertices
def drawline(left: Pixel, right: Pixel):
    if left.y / left.w < -1:
        return
    left_coor, right_coor = left.pixel_coor(), right.pixel_coor()
    if left_coor[0] == right_coor[0]:
        if left_coor[0] == int(left_coor[0]):
            drawpixel(left)  
        return
    if left_coor[0] == int(left_coor[0]):
        x = int(left_coor[0])
    else:
        x = int(left_coor[0]) + 1
    step = 1/(right_coor[0] - left_coor[0]) * (right - left)
    offset = (x - left_coor[0]) * step
    pixel = left + offset
    while (x < 0):
        x += 1
        pixel += step
    while (x < right_coor[0] and x < width):
        drawpixel(pixel)
        print(pixel.pixel_coor())
        x += 1
        pixel += step

def drawpixel(p: Pixel):
    p_x, p_y = round(p.pixel_coor()[0]), round(p.pixel_coor()[1])
    if DEPTH:
        if depth_buffer[p_x][p_y] > p.z / p.w and p.z / p.w >= -1:
            depth_buffer[p_x][p_y] = p.z / p.w
            image.im.putpixel((p_x, p_y), (round(p.r), round(p.g), round(p.b), 255))
        return
    image.im.putpixel((p_x, p_y), (round(p.r), round(p.g), round(p.b), 255))
    

# inputfile = open(sys.argv[1], 'r')
inputfile = open("D:\\0UIUC\\CS418\\MP1\\mp1files\\mp1depth.txt", 'r')
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
    if line == "depth":
        DEPTH = True
        depth_buffer = [[1 for _ in range(width)] for _ in range(height)]

    if line.startswith("rgb "):
        currRGB = [(lambda x: int(x))(x) for x in line.split()[1:]]
        
    if line.startswith("xyzw "):
        x, y, z, w = [(lambda x: float(x))(x) for x in line.split()[1:]]
        vertices.append(Pixel(x, y, z, w, currRGB[0], currRGB[1], currRGB[2]))
    
    if line.startswith("tri "):
        idx = [(lambda x: int(x))(x) for x in line.split()[1:]]
        tri = [(lambda i: vertices[i] if i < 0 else vertices[i-1])(i) for i in idx] 
        top, mid, low = sorted(tri, key = lambda v: v.pixel_coor()[::-1])
        DDA(top, mid, low)

    line = inputfile.readline()

image.save(filename)

