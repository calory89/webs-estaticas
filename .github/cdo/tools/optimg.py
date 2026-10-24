import os,sys
from PIL import Image,ImageOps
files=[l.strip() for l in sys.stdin if l.strip()]
before=after=0;n=0
for p in files:
    try:
        s0=os.path.getsize(p)
        with Image.open(p) as im:
            fmt=im.format
            im=ImageOps.exif_transpose(im)
            if im.width>1600: im=im.resize((1600,round(im.height*1600/im.width)),Image.LANCZOS)
            tmp=p+'.tmp'
            if fmt=='JPEG':
                if im.mode not in('RGB','L'): im=im.convert('RGB')
                im.save(tmp,'JPEG',quality=80,optimize=True,progressive=True)
            elif fmt=='PNG':
                im.save(tmp,'PNG',optimize=True)
            else: continue
        s1=os.path.getsize(tmp)
        if s1<s0*0.85: os.replace(tmp,p); before+=s0; after+=s1; n+=1
        else: os.remove(tmp)
    except Exception as e:
        print('ERR',p,e)
print(n,'optimizadas',before//1048576,'MB ->',after//1048576,'MB')
