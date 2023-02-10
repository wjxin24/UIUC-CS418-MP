import sys
from PIL import Image

# keywords
DEPTH = False
SRGB = False
HYP = False

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
    
    def divide_w(self):
        return Pixel(self.x/self.w, self.y/self.w, self.z/self.w, 1/self.w,\
            self.r/self.w, self.g/self.w, self.b/self.w)
    def undo_divide(self):
        return Pixel(self.x, self.y, self.z, 1/self.w,\
            self.r/self.w, self.g/self.w, self.b/self.w)

def DDA(top: Pixel, mid: Pixel, low: Pixel):
    top_coor, mid_coor, low_coor = top.pixel_coor(), mid.pixel_coor(), low.pixel_coor()
    if HYP:
        top, mid, low = top.divide_w(), mid.divide_w(), low.divide_w()
    
    
    if int(top_coor[1]) == top_coor[1] and top_coor[1] == mid_coor[1]:
        # top horizontal line with int y coordinate
        drawline(top, mid)
    
    y = int(top_coor[1]) if  int(top_coor[1]) == top_coor[1] else int(top_coor[1]) + 1
        
    step_t_l = 1/(top_coor[1] - low_coor[1]) * (top - low)
    if mid_coor[1] - low_coor[1] != 0:
        step_m_l = 1/(mid_coor[1] - low_coor[1]) * (mid - low)

    
    offset_t_l = (y - top_coor[1]) * step_t_l
    
    if top_coor[1] - mid_coor[1] != 0:
        step_t_m = 1/(top_coor[1] - mid_coor[1]) * (top - mid)
        offset_t_m = (y - top_coor[1]) * step_t_m
        # if mid point on the right
        if step_t_l.x < step_t_m.x:
            left = top + offset_t_l
            right = top + offset_t_m

            while (y < mid_coor[1] and y < height):
                drawline(left, right)
                y += 1
                left += step_t_l
                right += step_t_m

            if (mid_coor[1] == low_coor[1]):
                return

            offset_m_l = (y - mid_coor[1]) * step_m_l
            right = mid + offset_m_l

            while (y < low_coor[1] and y < height):
                drawline(left, right)
                y += 1
                left += step_t_l
                right += step_m_l

        # if mid point on the left
        else:
            left = top + offset_t_m
            right = top + offset_t_l

            while (y < mid_coor[1] and y < height):
                drawline(left, right)
                y += 1
                left += step_t_m
                right += step_t_l

            if (mid_coor[1] == low_coor[1]):
                return

            offset_m_l = (mid_coor[1] -y) * step_m_l
            left = mid + offset_m_l

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
    if HYP:
        if left.y < -1:
            return
        left_coor, right_coor = ((left.x+1) * width/2, (left.y+1) * height/2), ((right.x+1) * width/2, (right.y+1) * height/2)
    else:
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
        x += 1
        pixel += step

def drawpixel(p: Pixel):
    if HYP:
        p = p.undo_divide()
        p_x, p_y = round((p.x+1)*width/2), round((p.y+1)*height/2)
    else:
        p_x, p_y = round(p.pixel_coor()[0]), round(p.pixel_coor()[1])
    p_r, p_g, p_b = p.r, p.g, p.b
    if SRGB:
        p_r, p_g, p_b = linear_to_sRGB([p.r, p.g, p.b])
    if DEPTH:
        p_depth = p.z if HYP else p.z / p.w
        if depth_buffer[p_x][p_y] >= p_depth and p_depth >= -1:
            depth_buffer[p_x][p_y] = p_depth
            image.im.putpixel((p_x, p_y), (round(p_r), round(p_g), round(p_b), 255))
            print(p_x, p_y)
        return
    image.im.putpixel((p_x, p_y), (round(p_r), round(p_g), round(p_b), 255))
    print(p_x, p_y)

# convert sRGB to linear color space
def sRGB_to_linear(rgb):
    for i in range(3):
        rgb[i] /= 255
        if rgb[i] <= 0.04045:
            rgb[i] /= 12.92
        else:
            rgb[i] = ((rgb[i]+0.055)/1.055)**2.4
    return rgb

# convert linear color space to sRGB
def linear_to_sRGB(rgb):
    sRGB = [0,0,0]
    for i in range(3):
        if rgb[i] <= 0.0031308:
            sRGB[i] = rgb[i] * 12.92
        else:
            sRGB[i] = 1.055*(rgb[i]**(1/2.4))-0.055
        sRGB[i] *= 255
    return sRGB

inputfile = open(sys.argv[1], 'r')
# inputfile = open("D:\\0UIUC\\CS418\\MP1\\mp1files\\mp1hyp.txt", 'r')
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

    if line == "sRGB":
        SRGB = True
        currRGB = sRGB_to_linear(currRGB)

    if line == "hyp":
        HYP = True

    if line.startswith("rgb "):
        currRGB = [(lambda x: int(x))(x) for x in line.split()[1:]]
        if SRGB:
            currRGB = sRGB_to_linear(currRGB)
        
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

