# Sumba Secrets: sunrise, sunset, twilight, moon phases and Milky Way core visibility for Waingapu and Tambolaka, computed with PyEphem (pip install ephem). Output astro.json.
import ephem, datetime, math, json
TZ = datetime.timedelta(hours=8)
def obs(lat, lon):
    o = ephem.Observer(); o.lat, o.lon = str(lat), str(lon); o.elevation = 0; o.pressure = 0; o.horizon = "-0:34"; return o
places = {"Waingapu": (-9.6497, 120.2638), "Tambolaka": (-9.4242, 119.2448)}
res = {}
for n, (la, lo) in places.items():
    rows = []
    for m in range(1, 13):
        o = obs(la, lo); o.date = ephem.Date(datetime.datetime(2027, m, 15, 0, 0) - TZ)
        s = ephem.Sun()
        rise = ephem.Date(o.next_rising(s)).datetime() + TZ
        sset = ephem.Date(o.next_setting(s)).datetime() + TZ
        o.date = o.next_rising(s); s.compute(o); az_r = math.degrees(s.az)
        o.date = ephem.Date(sset - TZ); s.compute(o); az_s = math.degrees(s.az)
        o2 = obs(la, lo); o2.horizon = "-6"; o2.date = ephem.Date(datetime.datetime(2027, m, 15, 0, 0) - TZ)
        dawn = ephem.Date(o2.next_rising(ephem.Sun(), use_center=True)).datetime() + TZ
        dusk = ephem.Date(o2.next_setting(ephem.Sun(), use_center=True)).datetime() + TZ
        rows.append([m, dawn.strftime("%H:%M"), rise.strftime("%H:%M"), round(az_r), sset.strftime("%H:%M"), dusk.strftime("%H:%M"), round(az_s)])
    res[n] = rows
# earliest / latest sunrise days 2027 Waingapu
o = obs(*places["Waingapu"]); d0 = datetime.datetime(2027,1,1)
ss = []
for i in range(365):
    d = d0 + datetime.timedelta(days=i); o.date = ephem.Date(d - TZ)
    r = ephem.Date(o.next_rising(ephem.Sun())).datetime() + TZ; st = ephem.Date(o.next_setting(ephem.Sun())).datetime() + TZ
    ss.append((d.date().isoformat(), r.strftime("%H:%M:%S"), st.strftime("%H:%M:%S"), round((st - r).total_seconds()/3600, 2)))
res["earliest_rise"] = min(ss, key=lambda x: x[1]); res["latest_rise"] = max(ss, key=lambda x: x[1])
res["earliest_set"] = min(ss, key=lambda x: x[2]); res["latest_set"] = max(ss, key=lambda x: x[2])
res["daylen_min"] = min(ss, key=lambda x: x[3]); res["daylen_max"] = max(ss, key=lambda x: x[3])
# new and full moons Dec 2026 - Dec 2027
nm = []; d = ephem.Date("2026/12/01")
while d < ephem.Date("2028/01/01"):
    d = ephem.next_new_moon(d); nm.append((ephem.Date(d).datetime() + TZ).strftime("%Y-%m-%d %H:%M"))
fm = []; d = ephem.Date("2026/12/01")
while d < ephem.Date("2028/01/01"):
    d = ephem.next_full_moon(d); fm.append((ephem.Date(d).datetime() + TZ).strftime("%Y-%m-%d %H:%M"))
res["new_moons"] = nm[:-1] if nm[-1] > "2028" else nm; res["full_moons"] = fm[:-1] if fm[-1] > "2028" else fm
# Galactic centre (Sgr A*) : altitude at transit, and hours above 20 deg in astronomical darkness per month
gc = ephem.FixedBody(); gc._ra = ephem.hours("17:45:40"); gc._dec = ephem.degrees("-29:00:28"); gc._epoch = ephem.J2000
o = obs(*places["Waingapu"]); o.date = "2027/06/15 16:00"; gc.compute(o)
res["gc_transit_alt"] = round(90 - abs(-9.65 - (-29.0)), 1)
mw = []
for m in range(1, 13):
    tot = 0; first = None; last = None
    base = datetime.datetime(2027, m, 15, 12, 0) - TZ  # local noon
    for k in range(0, 24*12):
        t = base + datetime.timedelta(minutes=5*k); o.date = ephem.Date(t); s = ephem.Sun(o); gc.compute(o)
        if math.degrees(s.alt) < -18 and math.degrees(gc.alt) > 15:
            tot += 5; lt = (t + TZ).strftime("%H:%M"); first = first or lt; last = lt
    mw.append([m, round(tot/60, 1), first, last])
res["milkyway_core"] = mw
json.dump(res, open("astro.json", "w"), indent=1)
print(json.dumps(res, indent=0)[:4000])
