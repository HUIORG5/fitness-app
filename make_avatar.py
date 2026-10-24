# 生成「练了吗」默认头像：渐变底 + 白色哑铃（初版）
# v2：改用小灰提供的猫咪举哑铃手绘稿——把白底线稿的线条抠出来，铺到 App 渐变底上
from PIL import Image, ImageDraw

SRC = r"C:\Users\Administrator\.workbuddy\clipboard-images\clipboard-2026-10-23T19-06-02-166Z-f7eade77.png"
OUT = r"E:\workbuddy workplace\Training Diary\fitness-app\icons\avatar-default.png"

S = 1024          # 超采样尺寸，最后缩到 512
C1 = (94, 92, 230)    # indigo #5E5CE6
C2 = (10, 132, 255)   # blue   #0A84FF
LINE = (255, 255, 255) # 线条颜色：白线配渐变蓝底，更精神（小灰 2026-10-24 选定）

# ---- 1. 读原图，居中裁成正方形 ----
src = Image.open(SRC).convert("RGB")
w, h = src.size
side = min(w, h)
src = src.crop(((w - side) // 2, (h - side) // 2, (w + side) // 2, (h + side) // 2))
src = src.resize((S, S), Image.LANCZOS)

# ---- 2. 渐变底 ----
grad = Image.new("RGB", (S, S))
px = grad.load()
for y in range(S):
    for x in range(0, S, 4):
        t = (x + y) / (2 * S)
        r = int(C1[0] + (C2[0] - C1[0]) * t)
        g = int(C1[1] + (C2[1] - C1[1]) * t)
        b = int(C1[2] + (C2[2] - C1[2]) * t)
        for dx in range(4):
            if x + dx < S:
                px[x + dx, y] = (r, g, b)

# ---- 3. 柔和光斑 ----
spot = Image.new("RGBA", (S, S), (0, 0, 0, 0))
sd = ImageDraw.Draw(spot)
cx, cy, r = int(S * 0.5), int(S * 0.34), int(S * 0.5)
sd.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(255, 255, 255, 7))  # 光斑减弱，避免削弱白线对比
img = Image.alpha_composite(grad.convert("RGBA"), spot)

# ---- 4. 抠线条：亮度越低越不透明（白底→全透明，黑线→不透明）----
sp = src.load()
line = Image.new("RGBA", (S, S), (0, 0, 0, 0))
lp = line.load()
for y in range(S):
    for x in range(S):
        rr, gg, bb = sp[x, y]
        lum = (rr * 299 + gg * 587 + bb * 114) // 1000
        a = 255 - lum
        if a <= 14:
            continue                      # 纸面空白与极淡的污痕，保持透明
        a = min(255, int(a * 1.7))        # 线条本身是深灰，提一提对比
        lp[x, y] = (LINE[0], LINE[1], LINE[2], a)

# ---- 5. 合成并输出 ----
out = Image.alpha_composite(img, line).convert("RGB")
# 不量化：渐变无任何色带，120KB 由 Service Worker 缓存，头像场景完全可接受
out.resize((512, 512), Image.LANCZOS).save(OUT, optimize=True)
print("avatar done:", OUT)
