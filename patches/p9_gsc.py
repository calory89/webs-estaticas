# Ronda 17: verificacion de Search Console (propiedad https://supportnear.com/, cuenta rrppspain@gmail.com)
import io, sys
F='index.template.html'; s=io.open(F,encoding='utf-8').read()
a='<meta charset="utf-8">'
if s.count(a)!=1: sys.exit('NO')
if 'google-site-verification' not in s:
    s=s.replace(a, a+'\n<meta name="google-site-verification" content="SGov8GX_58ddMEPsoL0JgqQydbBarJFS8icSm8fgD8A">',1)
io.open(F,'w',encoding='utf-8').write(s); print('p9 ok')
