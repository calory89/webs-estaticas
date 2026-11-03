import re
def pre_completion_share(t):
    """Share of the price due before completion, from an advertised payment-plan sentence. None when not clear."""
    if not t: return None
    t = t.lower().split(';')[0]
    t = re.split(r'\boption 2\b|\bnon-pdc\b|\bother listings\b|\banother\b', t)[0]
    m = re.search(r'(\d{1,3})\s*%\s*(?:(?:on|at|upon)\s*)?(?:completion|handover|hand-over|handing over|key handover)', t)
    post = sum(int(x) for x in re.findall(r'(\d{1,3})\s*%\s*(?:post[- ]handover|after handover|after completion|over \d+ months after)', t))
    if m:
        v = 100 - int(m.group(1)) - post
        return v if 0 <= v <= 100 else None
    m = re.match(r'\s*(\d{1,3})\s*/\s*(\d{1,3})(?:\s*/\s*(\d{1,3}))?\b', t)
    if m:
        a = [int(x) for x in m.groups() if x]
        if sum(a) != 100: return None
        if len(a) == 2: return a[0]
        if 'post' in t: return a[0] + a[1] - 0 if False else None
        return a[0] + a[1]
    return None
