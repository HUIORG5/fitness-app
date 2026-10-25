# 生成「训练日记」App 图标：渐变圆角底 + 白色哑铃
from PIL import Image, ImageDraw

S = 1024  # 4x 超采样，最后缩小保证边缘平滑
OUT = r"E:\workbuddy workplace\Training Diary\fitness-app\icons"

C1 = (94, 92, 230)    #  indigo #5E5CE6
C2 = (10, 132, 255)   #  blue   #0A84FF

img = Image.new("RGBA", (S, S), (0, 0, 0, 0))

# ---- 对角渐变背景 ----
grad = Image.new("RGB", (S, S))
px = grad.load()
for y in range(S):
    for x in range(0, S, 4):  # 每 4 列算一次，横向填充，提速
        t = (x + y) / (2 * S)
        r = int(C1[0] + (C2[0] - C1[0]) * t)
        g = int(C1[1] + (C2[1] - C1[1]) * t)
        b = int(C1[2] + (C2[2] - C1[2]) * t)
        for dx in range(4):
            if x + dx < S:
                px[x + dx, y] = (r, g, b)

# 圆角方形蒙版（近似 iOS  squircle 圆角率 22.37%）
mask = Image.new("L", (S, S), 0)
md = ImageDraw.Draw(mask)
md.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 0.2237), fill=255)
img.paste(grad, (0, 0), mask)

d = ImageDraw.Draw(img)
W = (255, 255, 255, 255)

# ---- 柔和光斑 ----
spot = Image.new("RGBA", (S, S), (0, 0, 0, 0))
sd = ImageDraw.Draw(spot)
cx, cy, r = int(S * 0.5), int(S * 0.42), int(S * 0.34)
sd.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(255, 255, 255, 26))
img = Image.alpha_composite(img, spot)
d = ImageDraw.Draw(img)

# ---- 哑铃 ----
def rr(x0, y0, x1, y1, rad):
    d.rounded_rectangle([x0, y0, x1, y1], radius=rad, fill=W)

cy = S * 0.5
# 横杆
rr(S * 0.26, cy - S * 0.0375, S * 0.74, cy + S * 0.0375, S * 0.0375)
# 内侧大片
rr(S * 0.26, cy - S * 0.18, S * 0.345, cy + S * 0.18, S * 0.035)
rr(S * 0.655, cy - S * 0.18, S * 0.74, cy + S * 0.18, S * 0.035)
# 外侧小片
rr(S * 0.145, cy - S * 0.13, S * 0.255, cy + S * 0.13, S * 0.03)
rr(S * 0.745, cy - S * 0.13, S * 0.855, cy + S * 0.13, S * 0.03)

# ---- 输出三种尺寸 ----
img.resize((512, 512), Image.LANCZOS).save(f"{OUT}/icon-512.png")
img.resize((192, 192), Image.LANCZOS).save(f"{OUT}/icon-192.png")
img.resize((180, 180), Image.LANCZOS).save(f"{OUT}/apple-touch-icon.png")
print("icons done")
