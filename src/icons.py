import asyncio, base64, sys
from playwright.async_api import async_playwright
JS="""()=>{
 const cv=mk(64,64),c=cv.getContext('2d');c.imageSmoothingEnabled=false;
 const bands=['#4fb8ec','#6cc6f2','#8dd4f6','#b0e2f8'];bands.forEach((b,i)=>R(c,0,i*14,64,15,b));
 disc(c,50,13,6,'#fff3b0');disc(c,50,13,4,'#ffe27a');
 R(c,6,10,12,3,'#fff');R(c,9,8,8,3,'#fff');R(c,34,20,10,2,'#fff');
 tri(c,32,12,44,34,'#7ccf55','#4fa043');
 tri(c,32,12,12,9,'#ffffff','#d9e8f4');
 R(c,0,56,64,8,'#3f9a3f');R(c,0,56,64,1,'#5fc05f');
 // winding path
 const pts=[[30,54],[22,49],[34,44],[24,38],[36,33],[28,28],[35,23],[32,17]];
 for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1];for(let t=0;t<=1;t+=.1){const x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t;R(c,x-2,y,5,2,'#e6dcc4');R(c,x-2,y+1,5,1,'#8a8470');}}
 // flag
 R(c,32,2,1,11,'#5b3a1a');for(let i=0;i<5;i++)R(c,33,2+i,Math.round(8-i*1.4),1,i<2?'#ff7a6a':'#e24a3b');
 // the climber
 const k=mk(CH_W,CH_H);drawChar(k.getContext('2d'),{sk:1,st:0,hc:0,sh:0,ss:0,ps:0,pc:0,m:'peak'},false);
 R(c,14,59,12,2,'rgba(0,0,0,.25)');c.drawImage(k,12,40);
 return cv.toDataURL();}"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch();pg=await b.new_page(viewport={"width":800,"height":600})
        await pg.goto("file:///home/claude/kafo/index.html");await pg.wait_for_timeout(400)
        u=await pg.evaluate(JS)
        open("icon64.png","wb").write(base64.b64decode(u.split(',')[1]))
        await b.close()
asyncio.run(main())
