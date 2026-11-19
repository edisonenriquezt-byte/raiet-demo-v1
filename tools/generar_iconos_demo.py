"""Iconos DEMO reproducibles, diferentes de los de RAIET ESABAS."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
root=Path(__file__).resolve().parents[1]
def font(size):
    for loc in ('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf','/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf'):
        if Path(loc).exists(): return ImageFont.truetype(loc,size)
    return ImageFont.load_default()
image=Image.new('RGBA',(512,512),'#0b1830')
draw=ImageDraw.Draw(image)
draw.rounded_rectangle((0,0,511,511),radius=112,fill='#0b1830')
draw.ellipse((112,65,400,353),fill='#0e7490',outline='#67e8f9',width=14)
draw.text((256,208),'R',font=font(210),anchor='mm',fill='white')
draw.rounded_rectangle((108,364,404,449),radius=18,fill='#f59e0b')
draw.text((256,406),'DEMO',font=font(54),anchor='mm',fill='#0b1830')
image.save(root/'icon-512.png')
image.resize((192,192),Image.Resampling.LANCZOS).save(root/'icon-192.png')
print('Iconos RAIET DEMO generados correctamente')
