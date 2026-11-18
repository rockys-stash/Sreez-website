import re,sys,json
s=open('live.html').read()
def cut(a,b,start=0):
    i=s.index(a,start)+len(a); return s[i:s.index(b,i)]
css=cut('<style id="css">','</style>')
shell=cut('<template id="shell">','</template>')
data=cut('<script type="application/json" id="data">','</script>')
app=cut('<script id="app">','</script>\n\n</body>')
def rep(a,b,n=1):
    global app
    assert app.count(a)==n,(a[:60],app.count(a)); app=app.replace(a,b)
rep("Everything the site shows comes from the JSON block #data. The manager edits that data and republishes this page. */",
    "Everything the site shows comes from the shop catalogue: the copy inside index.html (#data) is the starting point,\n   and the owner's published version is read from Firebase (see backend.js). The manager edits that catalogue and saves it there. */")
rep("const DATA=JSON.parse(document.getElementById('data').textContent);",
    "const DATA=JSON.parse(document.getElementById('data').textContent);\n/* show the last published catalogue this device saw, so the page opens with current prices straight away */\ntry{ const c=SB.on&&JSON.parse(localStorage.getItem('sreezCat')); if(c&&c.products&&c.site) Object.assign(DATA,c); }catch(e){}")
rep("x.startsWith('a:')?'/_blob/'+x.slice(2)","x.startsWith('a:')?SB.imgRef(x.slice(2))")
rep("capsReady?'This area is only for the shop owner. Open the site from your Claude account to manage it.':'Checking your access…'}</p><a class=\"btn ghost\" href=\"#home\">Back to the shop</a></div>`; }",
    "!capsReady?'Checking your access…':own.state==='off'?'The shop is not connected to its database yet.':own.state==='no'?'You are signed in as '+esc(own.email)+'. This account is not the shop owner.':'This area is only for the shop owner. Sign in with the owner\\'s Google account to manage the shop.'}</p><div class=\"btns\">${capsReady&&own.state==='out'?'<button class=\"btn\" id=\"ownIn\">Sign in with Google</button>':''}${capsReady&&own.state==='no'?'<button class=\"btn\" id=\"ownOut\">Use another account</button>':''}<a class=\"btn ghost\" href=\"#home\">Back to the shop</a></div></div>`; }")
# remove page rebuild code
i=app.index("const HEADBITS="); j=app.index("function toast(msg)"); app=app[:i]+app[j:]
rep("let capsReady=false, aTab='products',","let own={state:''}, capsReady=false, aTab='orders',")
rep(" sessionStorage.setItem('sreezAfter','1'); }catch(e){}"," }catch(e){}")
rep("if(!cap.artifact) return toast('Saving is not available in this view. Open the site inside Claude.');","if(!cap.store) return toast('Saving is not available. Sign in as the shop owner first.');")
rep("await cap.artifact.publish(buildDoc()); dirty=false; $('pubBar').hidden=true; toast('Published. The website is updating.'); }",
    "await cap.store.save(DATA); dirty=false; $('pubBar').hidden=true; try{ sessionStorage.removeItem('sreezAfter'); localStorage.setItem('sreezCat',JSON.stringify(DATA)); }catch(e){} toast('Published. Your changes are live on the website.'); }")
rep("toast(c==='conflict'?'Someone else saved a newer version. The page is reloading, so please redo this change.':c==='not_writer'||c==='not_granted'?'This account can view the site but cannot change it.':c==='too_large'?'The site is too large to save. Remove some photos and try again.':c==='rate_limited'?'Too many saves in a short time. Wait a minute and publish again.':'Could not publish. Check your connection and try again.'); }",
    "toast(c==='permission-denied'?'This account cannot change the shop. Sign in as the shop owner.':'Could not publish. Check your connection and try again.'); }")
rep("k=Math.min(1,(max||1600)/Math.max","k=Math.min(1,(max||1400)/Math.max")
rep("'image/jpeg',.85)); }","'image/jpeg',.8)); }")
rep("toast('Photo upload is not available in this view. Open the site inside Claude.')","toast('Photo upload is not available. Sign in as the shop owner first.')")
rep("const r=await cap.assets.upload(await toJpeg(f),{type:'image/jpeg'});","let b=await toJpeg(f); if(b.size>700000) b=await toJpeg(f,1000); const r=await cap.assets.upload(b,{type:'image/jpeg'});")
rep("ordErr='Orders cannot be loaded in this view. Open the site inside Claude while signed in.'","ordErr='Orders cannot be loaded. Sign in as the shop owner.'")
rep("ORD=s.docs.map(d=>Object.assign({},d.data(),{id:d.id})); ordErr='';","ORD=s.docs.map(d=>Object.assign({},d.data(),{id:d.id})); ordErr=''; numberOrders();")
rep("const onManage=()=>location.hash==='#manage';",
    "/* orders placed on the website arrive without a number: give each the next one */\nlet numbering=false;\nasync function numberOrders(){ if(numbering) return; const todo=ORD.filter(o=>!o.no).sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt))); if(!todo.length) return; numbering=true;\n  let n=ORD.reduce((m,o)=>Math.max(m,o.no||0),0);\n  try{ for(const o of todo) await cap.db.collection('orders').doc(o.id).set({no:++n},{merge:true}); }catch(e){} numbering=false; }\nconst onManage=()=>location.hash==='#manage';")
rep("const TABS=[['products','Designs','Designs'],","const TABS=[['orders','Orders','Orders'],['products','Designs','Designs'],")
rep("['shop','Shop details','Shop']];","['shop','Shop details','Shop'],['insights','Insights','Insights']];")
i=app.index("/* orders and insights live on a separate private page"); j=app.index("const ICON="); app=app[:i]+app[j:]
rep("""<a class="mgtab" href="${ORDERS_URL}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ICON.orders}"/></svg><span class="tl">Orders and insights</span><span class="ts">Orders</span></a></nav>""","</nav>")
rep("""<a class="mini mgsite" href="#home">View website</a></aside>""","""<a class="mini mgsite" href="#home">View website</a><button class="mini mgsite" id="ownOut">Sign out</button></aside>""")
rep("No orders yet. When a customer sends an enquiry from the website, tap Paste enquiry to turn the message into an order.","No orders yet. Orders placed on the website appear here by themselves. For an order sent by message, tap Paste enquiry.")
# checkout: place the order directly
i=app.index("  const msg=lines.join('\\n');\n  $('view').innerHTML=`<div class=\"sent\">"); j=app.index("  window.scrollTo(0,0);\n}\ndocument.addEventListener('submit'")
old=app[i:j]
new="""  const msg=lines.join('\\n');
  const steps=`<ol class="steps"><li><b>Sreez confirms</b><span>She checks the design, your size and the date, and shares the final price.</span></li><li><b>Pay the advance</b><span>${SITE.payment?nl(SITE.payment):'She tells you how much to pay in advance and how.'}</span></li><li><b>Stitching${L?', about '+dayTxt(L):''}</b><span>Your piece is cut and stitched to your measurements.</span></li><li><b>Fitting and delivery</b><span>Final adjustments, then pickup or delivery.</span></li></ol>`;
  let placed=false;
  if(SB.on){ const go=document.querySelector('#ckForm [type=submit]'); if(go){ if(go.disabled) return; go.disabled=true; go.textContent='Placing your order…'; }
    const note=[`Delivery: ${del}`]; if(val('ckAddr')) note.push('Address: '+val('ckAddr').replace(/\\s*\\n\\s*/g,', ')); if(val('ckNotes')) note.push('Notes: '+val('ckNotes'));
    try{ await SB.createOrder({createdAt:new Date().toISOString(),customer:val('ckName').slice(0,80),phone:val('ckPhone').replace(/[^\\d+]/g,'').slice(0,20),channel:'Website',status:'New',
        items:bag.slice(0,30).map(b=>({pid:b.id,name:prod(b.id).name,size:b.size,price:effPrice(prod(b.id))})),due:/^\\d{4}-\\d{2}-\\d{2}$/.test(val('ckDate'))?val('ckDate'):'',discount:0,advance:0,measurements:'',notes:note.join('\\n').slice(0,1500)});
      placed=true; }catch(e){} }
  if(placed){ bag=[]; saveBag(); renderBag();
    $('view').innerHTML=`<div class="sent"><div><span class="eyebrow">Thank you</span><h1 style="margin-top:4px">Your order has reached Sreez</h1><p class="lede">Sreez will contact you on ${esc(val('ckPhone'))} to confirm the price${L?'. Stitching takes about '+dayTxt(L)+' after your measurements are confirmed':' and the stitching time'}.</p></div>
    <div class="box"><div class="label">Your order</div><textarea id="ckMsg" readonly style="min-height:190px">${esc(msg)}</textarea><p class="hint" style="margin:10px 0 0">Want a quicker reply? You can also send this to Sreez yourself.</p>${sendHTML('ckMsg',msg)}</div>
    ${steps}
    <div class="btns"><a class="btn" href="#shop">Keep shopping</a></div></div>`; }
  else $('view').innerHTML=`<div class="sent"><div><span class="eyebrow">Last step</span><h1 style="margin-top:4px">Send your order to Sreez</h1><p class="lede">Your order is ready. Send this message so Sreez receives it. She replies to confirm the price${L?', and stitching takes about '+dayTxt(L)+' after your measurements are confirmed':' and the stitching time'}.</p></div>
    <div class="box"><div class="label">Your order</div><textarea id="ckMsg" readonly style="min-height:190px">${esc(msg)}</textarea>${sendHTML('ckMsg',msg)}</div>
    ${steps}
    <div class="btns"><button class="btn" id="ckDone">I have sent it</button><a class="btn ghost" href="#checkout">Change my details</a></div></div>`;
"""
app=app[:i]+new+app[j:]
rep("function placeOrder(){","async function placeOrder(){")
# owner check
i=app.index("/* owner check:"); j=app.index("if(onManage()||wasOwner()) ownerCheck();")
new='''/* owner check: the manager only lights up for the shop owner's Google account.
   It runs only when Manage is opened, or on a device where the owner has managed before, so customers never load the sign-in code. */
let ownerAsked=false;
const wasOwner=()=>{ try{ return localStorage.getItem('sreezOwner')==='1'; }catch(e){ return false; } };
async function ownerCheck(){ if(ownerAsked) return; ownerAsked=true;
  try{ own=await SB.owner(); }catch(e){ own={state:'off'}; }
  const ok=own.state==='ok'; capsReady=true;
  try{ if(ok) localStorage.setItem('sreezOwner','1'); else if(own.state!=='off') localStorage.removeItem('sreezOwner'); }catch(e){}
  if(!ok){ isAdmin=false; chrome(); if(onManage()) route(); return; }
  isAdmin=true; cap.store=own.store; cap.assets=own.assets; cap.db=own.db;
  try{ const d=sessionStorage.getItem('sreezDraft'); if(d){ const x=JSON.parse(d); if(x&&x.products&&JSON.stringify(x)!==JSON.stringify(DATA)){ ['site','collections','products','offers'].forEach(k=>{ if(k==='site') Object.assign(SITE,x.site); else DATA[k]=x[k]; }); dirty=true; $('pubBar').hidden=false; } } }catch(e){}
  watchOrders(); chrome(); route();
}
document.addEventListener('click',async e=>{ const t=e.target.closest('#ownIn,#ownOut'); if(!t||!own.signIn) return;
  if(t.id==='ownOut'&&dirty&&!confirm('You have changes that are not published. Sign out anyway?')) return;
  try{ await (t.id==='ownIn'?own.signIn():own.signOut()); }catch(err){ return toast(t.id==='ownIn'?'Sign-in did not finish. Try again.':'Could not sign out. Try again.'); }
  if(t.id==='ownOut'){ try{ localStorage.removeItem('sreezOwner'); }catch(e){} location.hash='home'; location.reload(); return; }
  ownerAsked=false; capsReady=false; route(); ownerCheck(); });
/* fetch the owner's latest published catalogue; the page was drawn from the saved copy, so redraw only if something changed */
SB.watchImages();
SB.loadCatalogue().then(x=>{ if(!x||!x.products||!x.site) return; const j=JSON.stringify(x); try{ localStorage.setItem('sreezCat',j); }catch(e){}
  if(dirty||j===JSON.stringify(DATA)) return;
  Object.keys(SITE).forEach(k=>delete SITE[k]); Object.assign(SITE,x.site); ['collections','products','offers'].forEach(k=>DATA[k]=x[k]); if(x.v) DATA.v=x.v;
  chrome(); renderBag(); if(!onManage()&&location.hash!=='#checkout') route(); }).catch(()=>{});
'''
app=app[:i]+new+app[j:]
assert 'claude' not in app.lower().replace('claude-','') or print([m.start() for m in re.finditer('laude',app)])
assert 'buildDoc' not in app and 'ORDERS_URL' not in app and 'cap.artifact' not in app
head='''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Sreez The Dress Maker</title>
<meta name="description" content="Sreez The Dress Maker: customised bridal wear, designer blouses, gowns, lehengas, kurtis and kidswear by fashion designer Sreeja Balagan. Every piece is cut and stitched to your measurements.">
<meta name="theme-color" content="#ffffff">
<meta property="og:title" content="Sreez The Dress Maker">
<meta property="og:description" content="Customised outfits, cut and stitched to your measurements.">
<meta property="og:image" content="img/logo.png">
<link rel="icon" href="img/logo.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Allura&family=Figtree:wght@400;500;600;700&family=Marcellus&display=swap" rel="stylesheet">
<style>:root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}html{scroll-padding-top:env(safe-area-inset-top,0px)}body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#fff;color:#000}img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}</style>
<link rel="stylesheet" href="style.css">
</head>
<body>
'''
open('public/style.css','w').write(css)
open('public/app.js','w').write(app.lstrip('\n'))
open('public/index.html','w').write(head+'<template id="shell">'+shell+'</template>\n<script type="application/json" id="data">'+data+'</script>\n<script src="firebase-config.js"></script>\n<script src="backend.js"></script>\n<script src="app.js"></script>\n</body>\n</html>\n')
print('ok',len(app),len(css))
