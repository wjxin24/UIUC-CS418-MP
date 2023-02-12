import sys
from PIL import Image

# keywords
DEPTH = False
SRGB = False
HYP = False
FRUSTUM = False
CULL = False
CLIPPLANE = False
RGBA = False
FSAA = False 

default_clipplanes = [[1, 0, 0, 1], [-1, 0, 0, 1], [0, 1, 0, 1], \
    [0, -1, 0, 1], [0, 0, 1, 1], [0, 0, -1, 1]]
clipplanes = []
rgba_buf = []

class Pixel:
    def __init__(self, x, y, z, w, r, g, b, a):
        self.x = x
        self.y = y
        self.z = z
        self.w = w
        self.r = r
        self.g = g
        self.b = b
        self.a = a

    def pixel_coor(self):
        return (self.x/self.w+1)*width/2,(self.y/self.w+1)*height/2

    def __add__(self, A):
        return Pixel(self.x + A.x, self.y + A.y, self.z + A.z, self.w + A.w,\
            self.r + A.r, self.g + A.g, self.b + A.b, self.a + A.a)

    def __sub__(self, A):
        return Pixel(self.x - A.x, self.y - A.y, self.z - A.z, self.w - A.w,\
            self.r - A.r, self.g - A.g, self.b - A.b, self.a - A.a)

    def __mul__(self, k):
        return Pixel(self.x * k, self.y * k, self.z * k, self.w * k,\
            self.r * k, self.g * k, self.b * k, self.a * k)
    __rmul__ = __mul__

    def __truediv__(self, k):
        return Pixel(self.x / k, self.y / k, self.z / k, self.w / k,\
            self.r / k, self.g / k, self.b / k, self.a / k)
    
    def linear(self):
        return Pixel(self.x/self.w, self.y/self.w, self.z, self.w, self.r, self.g, self.b, self.a)

    def divide_w(self):
        return Pixel(self.x/self.w, self.y/self.w, self.z/self.w, 1/self.w,\
            self.r/self.w, self.g/self.w, self.b/self.w, self.a/self.w)
    def undo_divide(self):
        return Pixel(self.x, self.y, self.z, 1/self.w,\
            self.r/self.w, self.g/self.w, self.b/self.w, self.a/self.w)

def DDA(top: Pixel, mid: Pixel, low: Pixel):
    top_coor, mid_coor, low_coor = top.pixel_coor(), mid.pixel_coor(), low.pixel_coor()
    if HYP:
        top, mid, low = top.divide_w(), mid.divide_w(), low.divide_w()
    else:
        top, mid, low = top.linear(), mid.linear(), low.linear()

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
    if left.y < -1:
        return
    left_coor, right_coor = ((left.x+1) * width/2, (left.y+1) * height/2),\
         ((right.x+1) * width/2, (right.y+1) * height/2)
    
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
    p_r, p_g, p_b, p_a = p.r, p.g, p.b, p.a    
    if RGBA:
        temp = p_a + rgba_buf[p_x][p_y][3] * (1-p_a)
        prgb = [p_r, p_g, p_b]
        for i in range(3):
            prgb[i] = (p_a*prgb[i]+(1-p_a)*rgba_buf[p_x][p_y][3]*rgba_buf[p_x][p_y][i])/temp
            rgba_buf[p_x][p_y][i] = prgb[i]
        p_r, p_g, p_b = prgb
        p_a = temp
        rgba_buf[p_x][p_y][3] = temp
    if SRGB:
        p_r, p_g, p_b = linear_to_sRGB([p_r, p_g, p_b])
    if DEPTH:
        p_depth = p.z if HYP else p.z / p.w
        if depth_buffer[p_x][p_y] >= p_depth and p_depth >= -1:
            depth_buffer[p_x][p_y] = p_depth
            if (p_x >= width or p_y >= height):
                return
            image.im.putpixel((p_x, p_y), (round(p_r), round(p_g), round(p_b), round(255*p_a)))
            print(p_x, p_y)
        return
    if (p_x >= width or p_y >= height):
        return
    image.im.putpixel((p_x, p_y), (round(p_r), round(p_g), round(p_b), round(255*p_a)))
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

def clip(tris, cp):
    result_tris = []
    for tri in tris:
        dist = [0, 0, 0]
        pos = []
        neg = []
        for i in range(3):
            dist[i] = tri[i].x*cp[0]+tri[i].y*cp[1]+tri[i].z*cp[2]+tri[i].w*cp[3]
            if dist[i] < 0:
                neg.append(i)
            else:
                pos.append(i)
        if  len(neg) == 0:
            result_tris.append(tri)
        elif len(neg) == 1:
            new_point0 = (dist[neg[0]]*tri[pos[0]]-dist[pos[0]]*tri[neg[0]])/(dist[neg[0]]-dist[pos[0]])
            new_point1 = (dist[neg[0]]*tri[pos[1]]-dist[pos[1]]*tri[neg[0]])/(dist[neg[0]]-dist[pos[1]])
            result_tris.append([new_point0, tri[pos[0]], tri[pos[1]]])
            result_tris.append([new_point0, new_point1, tri[pos[1]]])
        elif len(neg) == 2:
            new_point0 = (dist[pos[0]]*tri[neg[0]]-dist[neg[0]]*tri[pos[0]])/(dist[pos[0]]-dist[neg[0]])
            new_point1 = (dist[pos[0]]*tri[neg[1]]-dist[neg[1]]*tri[pos[0]])/(dist[pos[0]]-dist[neg[1]])
            result_tris.append([new_point0, new_point1, tri[pos[0]]])
        else:
            pass
    return result_tris

inputfile = open(sys.argv[1], 'r')
# inputfile = open("D:\\0UIUC\\CS418\\MP1\\mp1files\\mp1fsaa2.txt", 'r')
line = inputfile.readline()
while not line.strip().startswith("png"):
    line = inputfile.readline()
linesplit = line.split()
width, height = int(linesplit[1]), int(linesplit[2])
assert width > 0 and height > 0
filename = linesplit[3]
image = Image.new("RGBA", (width, height), (0,0,0,0))
currRGBA = [255, 255, 255, 1]
vertices = []
while line:
    line = line.strip()
    if line == "depth":
        DEPTH = True
        depth_buffer = [[1 for _ in range(width)] for _ in range(height)]

    if line == "sRGB":
        SRGB = True
        currRGBA[:3] = sRGB_to_linear(currRGBA[:3])

    if line == "hyp":
        HYP = True
    
    if line == "frustum":
        FRUSTUM = True

    if line == "cull":
        CULL = True

    if line.startswith("fsaa"):
        FSAA = True
        RGBA = True
        level = int(line.split()[1])
        width *= level
        height *= level
        image = Image.new("RGBA", (width, height), (0,0,0,0))
        rgba_buf = [[[0,0,0,0] for _ in range(height)] for _ in range(width)]

    if line.startswith("clipplane "):
        CLIPPLANE = True
        clipplanes.append([(lambda x: float(x))(x) for x in line.split()[1:]])

    if line.startswith("rgb "):
        currRGBA = [(lambda x: int(x))(x) for x in line.split()[1:]] + [1]
        if SRGB:
            currRGBA[:3] = sRGB_to_linear(currRGBA[:3])
    
    if line.startswith("rgba "):
        RGBA = True
        if rgba_buf == []:
            rgba_buf = [[[0,0,0,0] for _ in range(height)] for _ in range(width)]
        currRGBA = [(lambda x: int(x))(x) for x in line.split()[1:4]] + [float(line.split()[4])]
        currRGBA[:3] = sRGB_to_linear(currRGBA[:3])      

    if line.startswith("xyzw "):
        x, y, z, w = [(lambda x: float(x))(x) for x in line.split()[1:]]
        vertices.append(Pixel(x, y, z, w, currRGBA[0], currRGBA[1], currRGBA[2], currRGBA[3]))
    
    if line.startswith("tri "):
        idx = [(lambda x: int(x))(x) for x in line.split()[1:]]
        tri = [(lambda i: vertices[i] if i < 0 else vertices[i-1])(i) for i in idx]
        tris = [tri] # a list of triangles

        if CULL:
            if (tri[0].pixel_coor()[0]-tri[1].pixel_coor()[0])*(tri[1].pixel_coor()[1]-tri[2].pixel_coor()[1])-\
                (tri[0].pixel_coor()[1]-tri[1].pixel_coor()[1])*(tri[1].pixel_coor()[0]-tri[2].pixel_coor()[0])>0:
                line = inputfile.readline()
                continue

        if FRUSTUM:
            for clipplane in default_clipplanes:
                tris = clip(tris, clipplane)

        if CLIPPLANE:
            for clipplane in clipplanes:
                tris = clip(tris, clipplane)

        for tri in tris:
            top, mid, low = sorted(tri, key = lambda v: v.pixel_coor()[::-1])
            DDA(top, mid, low)

    line = inputfile.readline()
image.save("fsaa2.png")
if FSAA:
    width = int(width / level)
    height = int(height / level)
    ave_image = Image.new("RGBA", (width, height), (0,0,0,0))
    for x in range(width):
        for y in range(height):
            rgba_sum = [0, 0, 0, 0]
            rgba_ave = [0, 0, 0, 0]
            for i in range(x*level, (x+1)*level):
                for j in range(y*level, (y+1)*level):
                    rgba = rgba_buf[i][j]
                    for c in range(3):
                        rgba_sum[c] += rgba[c] * rgba[3]
                    rgba_sum[3] += rgba[3]
            rgba_ave[3] = rgba_sum[3] / level**2
            if rgba_ave[3] != 0:
                rgba_ave[:3] = [i/rgba_sum[3] for i in rgba_sum[:3]]
            p_r, p_g, p_b = linear_to_sRGB(rgba_ave[:3])
            ave_image.putpixel([x, y], (round(p_r), round(p_g), round(p_b), round(255*rgba_ave[3])))
    image = ave_image
image.save(filename)

