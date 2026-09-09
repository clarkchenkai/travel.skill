from pathlib import Path
import json,re,hashlib,math,html,zipfile,io,base64,sys,shutil
from PIL import Image
ROOT=Path(__file__).resolve().parent
DATA=ROOT.parent/'travel-data.json'
if '--public-only' in sys.argv or not DATA.exists(): DATA=ROOT/'travel-data.json'  # Cloud builds only read the shareable snapshot.
def public(value):
 if isinstance(value,dict):
  if value.get('privacy') in ('private','restricted'):return None
  return {k:r for k,v in value.items() if k not in ('privateData','visualDisclosure') and (r:=public(v)) is not None}
 if isinstance(value,list):return [r for v in value if (r:=public(v)) is not None]
 return value
raw=json.loads(DATA.read_text());data=public(raw)
places={p['id']:p for p in data['places']}
assert len(data['days'])==6
ids=set()
for collection in ['places','flightJourneys','bookingsAndTickets','preTrip','days']:
 vals=[x['id'] for x in data[collection]];assert len(vals)==len(set(vals)),collection
for day in data['days']:
 for e in day['events']:
  assert all(x in places for x in e.get('placeIds',[])),e['id']
  assert all(x in {t['id'] for t in data['bookingsAndTickets']} for x in e.get('ticketIds',[])),e['id']
text=json.dumps(data,ensure_ascii=False,indent=2)+'\n'
assert 'privateData' not in text
assert not re.search(r'(?:sk-[A-Za-z0-9]{16,}|/Users/|xsec_token)',text)
(ROOT/'travel-data.json').write_text(text)
# One generated route graphic based on real Natural Earth coast geometry.
geo=json.loads((ROOT/'data/japan-coast.json').read_text())
polys=geo['coordinates'] if geo['type']=='MultiPolygon' else [geo['coordinates']]
conf=data['routeMap'];overrides=conf.get('labelOverrides',{})
def esc(x):return html.escape(str(x))
def transform(bounds,box):
 x0,y0,x1,y1=bounds;bx,by,bw,bh=box;c=math.cos(math.radians((y0+y1)/2));scale=min(bw/((x1-x0)*c),bh/(y1-y0));ox=bx+(bw-(x1-x0)*c*scale)/2;oy=by+(bh-(y1-y0)*scale)/2
 return c,scale,ox,oy
def xy(lon,lat,bounds,box):
 c,scale,ox,oy=transform(bounds,box)
 return ox+(lon-bounds[0])*c*scale,oy+(bounds[3]-lat)*scale
relief=None
zipPath=ROOT.parent/'资料核对/官方原文/natural-earth-relief.zip'
if zipPath.exists():
 with zipfile.ZipFile(zipPath) as z:relief=Image.open(io.BytesIO(z.read('NE1_50M_SR/NE1_50M_SR.tif'))).convert('RGB')
def terrain(bounds,box):
 if relief is None:return ''
 c,scale,ox,oy=transform(bounds,box);bx,by,bw,bh=box
 lon0=bounds[0]+(bx-ox)/(c*scale);lon1=bounds[0]+(bx+bw-ox)/(c*scale);lat1=bounds[3]-(by-oy)/scale;lat0=bounds[3]-(by+bh-oy)/scale
 W,H=relief.size
 crop=relief.crop(((lon0+180)/360*W,(90-lat1)/180*H,(lon1+180)/360*W,(90-lat0)/180*H)).resize((int(bw*1.3),int(bh*1.3)),Image.Resampling.LANCZOS)
 buf=io.BytesIO();crop.save(buf,format='JPEG',quality=82)
 return '<image x="'+str(bx)+'" y="'+str(by)+'" width="'+str(bw)+'" height="'+str(bh)+'" preserveAspectRatio="none" opacity=".45" href="data:image/jpeg;base64,'+base64.b64encode(buf.getvalue()).decode()+'"/>'
parts=['<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1040" viewBox="0 0 720 1040" role="img" aria-label="'+esc(conf['title'])+'路线示意">', '<defs><pattern id="paper" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="#8aa399" stroke-opacity=".07" stroke-width=".5"/></pattern></defs>','<rect width="720" height="1040" rx="22" fill="#deebea"/>','<rect width="720" height="1040" rx="22" fill="url(#paper)"/>']
parts+=['<text x="36" y="39" fill="#587478" font-size="12" letter-spacing="2" font-family="Arial,sans-serif">'+esc(conf['subtitle'])+'</text>', '<text x="36" y="76" fill="#233c41" font-size="28" font-weight="700" font-family="sans-serif">'+esc(conf['title'])+'</text>']
# Label offsets keep the close Kumano points legible without changing their geographic positions.
overOffsets=conf['overviewOffsets']
inOffsets=conf['insetOffsets']
for idx,(bounds,box,pointids,offsets,title) in enumerate([(conf['overviewBounds'],(24,112,672,370),conf['overviewIds'],overOffsets,conf['overviewLabel']),(conf['insetBounds'],(28,562,664,390),conf['insetIds'],inOffsets,conf['insetLabel'])]):
 bx,by,bw,bh=box;clip=f'clip{idx}'
 parts.append(f'<defs><clipPath id="{clip}"><rect x="{bx}" y="{by}" width="{bw}" height="{bh}" rx="14"/></clipPath></defs>')
 parts.append(f'<rect x="{bx}" y="{by}" width="{bw}" height="{bh}" rx="14" fill="#d9e9e8"/>')
 parts.append(f'<g clip-path="url(#{clip})">')
 landpaths=[]
 for poly in polys:
  ring=poly[0]
  xs=[q[0] for q in ring];ys=[q[1] for q in ring]
  if max(xs)<bounds[0] or min(xs)>bounds[2] or max(ys)<bounds[1] or min(ys)>bounds[3]:continue
  points=[xy(q[0],q[1],bounds,box) for q in ring]
  path='M'+'L'.join(f'{x:.1f},{y:.1f}' for x,y in points)+'Z'
  landpaths.append(path)
  parts.append(f'<path d="{path}" fill="#ecebdd"/>')
 parts.append(f'<defs><clipPath id="land{idx}">'+''.join(f'<path d="{p}"/>' for p in landpaths)+'</clipPath></defs>')
 parts.append(f'<g clip-path="url(#land{idx})">'+terrain(bounds,box)+'</g>')
 for path in landpaths:parts.append(f'<path d="{path}" fill="none" stroke="#adbca9" stroke-width="1.1"/>')
 routeids=conf['overviewRouteIds'] if idx==0 else conf['insetRouteIds']
 coords=[xy(places[x]['lon'],places[x]['lat'],bounds,box) for x in routeids if places[x].get('lon') is not None]
 route='M'+'L'.join(f'{x:.1f},{y:.1f}' for x,y in coords)
 parts.append(f'<path d="{route}" fill="none" stroke="#f7f7ed" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>')
 parts.append(f'<path d="{route}" fill="none" stroke="#476b8c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>')
 if idx==1:
  a=places['hosshin'];b=places['hongu'];ax,ay=xy(a['lon'],a['lat'],bounds,box);cx,cy=xy(b['lon'],b['lat'],bounds,box)
  parts.append(f'<path d="M{ax:.1f} {ay:.1f}Q{ax-15:.1f} {cy:.1f} {cx:.1f} {cy:.1f}" stroke="#a36348" stroke-width="3" stroke-dasharray="5 4" fill="none"/>')
 parts.append('</g>')
 for n,id in enumerate(pointids,1):
  p=places[id];x,y=xy(p['lon'],p['lat'],bounds,box);dx,dy=offsets.get(id,(10,-10));name=overrides.get(id,p['name']);tx=x+dx;ty=y+dy
  parts.append(f'<path d="M{x:.1f} {y:.1f}L{tx:.1f} {ty-4:.1f}" stroke="#6d8584" stroke-width=".8" opacity=".7"/>')
  parts.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="5.3" fill="#294b59" stroke="#f7f6ed" stroke-width="2"/>')
  parts.append(f'<text x="{tx:.1f}" y="{ty:.1f}" fill="#243f46" font-size="18" font-weight="600" font-family="sans-serif">{esc(name)}</text>')
 parts.append(f'<text x="42" y="{by+28}" fill="#647b77" font-size="14" font-family="sans-serif">{esc(title)}</text>')
 parts+=['<path d="M664 '+str(by+42)+'v-21m0 0-5 9m5-9 5 9" fill="none" stroke="#597272" stroke-width="1.2"/>',f'<text x="660" y="{by+15}" fill="#597272" font-size="11" font-family="Arial">N</text>']
parts+=['<text x="36" y="526" fill="#547173" font-family="sans-serif" font-size="14">'+esc(conf['flightLabel'])+'</text>','<path d="M36 1005h25" stroke="#476b8c" stroke-width="3"/><text x="70" y="1010" fill="#486565" font-family="sans-serif" font-size="12">'+esc(conf['legend'][0])+'</text>','<path d="M233 1005h25" stroke="#a36348" stroke-width="3" stroke-dasharray="5 4"/><text x="267" y="1010" fill="#486565" font-family="sans-serif" font-size="12">'+esc(conf['legend'][1])+'</text>','<text x="684" y="1010" text-anchor="end" fill="#486565" font-family="sans-serif" font-size="11">位置与连线为示意 · 非导航</text>','</svg>']
(ROOT/'assets').mkdir(exist_ok=True)
(ROOT/'assets/route-map.svg').write_text('\n'.join(parts))
print('Public JSON generated:',len(text.encode()),'bytes; route map generated; references valid.')
if '--package' in sys.argv:
 delivery=ROOT/'artifacts'  # self-contained inside the showcase folder
 destination=ROOT/'dist'
 delivery.mkdir(exist_ok=True)
 files=['index.html','showcase.html','styles.css','desktop.css','app.js','core.mjs','trail-motion.mjs','travel-data.json','third-party-notices.txt','assets/route-map.svg','assets/story.js','assets/forest-cover.webp','assets/river-interlude.webp','assets/forest-foreground.webp','assets/field-gear.webp','assets/kumano-aircraft.webp','assets/four-travelers.webp','assets/navigation-objects.webp','assets/coastal-sky.webp','assets/nachi-vertical.webp','assets/cloud-veil.webp','assets/travel-car.webp','assets/home-cedar-leaf.webp','assets/home-dawn-mist.webp','assets/kumano-title-vertical.png','assets/LXGWWenKai-Regular.woff2','assets/LXGWWenKai-OFL.txt','assets/route-overview-ai.png','assets/vintage-flight-paper.png','assets/day-tea-path.webp','assets/day-kawayu-water.webp','assets/day-ticket-paper.webp','assets/day-transfer-paper.webp','assets/day-wakaura-bay.webp','assets/day-tokyo-arrival.webp','assets/day-tokyo-street.webp','assets/day-tokyo-asakusa.webp','assets/comic-four-travelers.webp']
 manifest={}
 for name in files:
  target=destination/name;target.parent.mkdir(parents=True,exist_ok=True)
  shutil.copy2(ROOT/name,target)
  manifest[name]=hashlib.sha256(target.read_bytes()).hexdigest()
 unexpected={str(p.relative_to(destination)) for p in destination.rglob('*') if p.is_file()}-set(files)
 assert not unexpected,('Unexpected publication files',unexpected)
 (delivery/'发布文件校验.json').write_text(json.dumps(manifest,indent=2)+'\n')
 with zipfile.ZipFile(delivery/'熊野旅行路书-发布包.zip','w',zipfile.ZIP_DEFLATED) as z:
  for name in files:z.write(destination/name,name)
 print('Publication package generated:',len(files),'files; no remote upload.')
