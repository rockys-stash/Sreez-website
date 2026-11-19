/* Sreez The Dress Maker: public site + owner-only shop manager.
   Everything the site shows comes from the shop catalogue: the copy inside index.html (#data) is the starting point,
   and the owner's published version is read from Firebase (see backend.js). The manager edits that catalogue and saves it there. */
try{ if(sessionStorage.getItem('sreezIntro')) document.documentElement.classList.add('no-intro'); else sessionStorage.setItem('sreezIntro','1'); }catch(e){}
const DATA=JSON.parse(document.getElementById('data').textContent);
/* show the last published catalogue this device saw, so the page opens with current prices straight away */
try{ const c=SB.on&&JSON.parse(localStorage.getItem('sreezCat')); if(c&&c.products&&c.site) Object.assign(DATA,c); }catch(e){}
document.getElementById('shell').before(document.getElementById('shell').content.cloneNode(true));

const STD=['XS','S','M','L','XL','XXL','Custom measurements'], CUSTOM=['Custom measurements'];
const STATUS=['New','Confirmed','Cutting','Stitching','Fitting','Ready','Delivered','Cancelled'];
const OPEN=s=>s!=='Delivered'&&s!=='Cancelled';
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const nl=s=>esc(s).replace(/\n/g,'<br>');
const inr=n=>'\u20B9'+Math.round(Number(n)||0).toLocaleString('en-IN');
const imgSrc=x=>x.startsWith('a:')?SB.imgRef(x.slice(2)):(x.startsWith('data:')?x:'img/'+x);
/* small images: shop photos have a light copy in img/t/, used on cards, tiles and lists; anything else falls back to the full photo */
const tSrc=x=>/^[\w.-]+\.jpe?g$/i.test(x)?`src="img/t/${x.replace(/\.jpe?g$/i,'')}.webp" onerror="this.onerror=null;this.src='img/${x}'"`:`src="${esc(imgSrc(x))}"`;
const tLazy=x=>tSrc(x).replace(/^src=/,'data-src=').replace(' onerror=',' data-fb=').replace("this.onerror=null;this.src='",'').replace(/'"$/,'"');
const sizesOf=p=>p.sizes==='custom'?CUSTOM:STD;
/* stitching time: a design's own days, else the shop's usual days; 0 means not set */
const lead=p=>Math.round(Number(p.days)||Number(DATA.site.leadDays)||0);
const dayTxt=n=>n+(n===1?' day':' days');
const addDays=n=>{ const d=new Date(); d.setDate(d.getDate()+n); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
const CLOCK='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>';
const effPrice=p=>p.price?(p.offerPrice&&p.offerPrice<p.price?p.offerPrice:p.price):0;
let isAdmin=false; const cap={};
/* owner-only "to add" placeholders on the shop pages are switched off: the owner sees exactly what customers see */
const HINTS=false;
const SITE=DATA.site;
const P=()=>DATA.products.filter(p=>!p.hidden);
const inColl=c=>P().filter(p=>p.c.includes(c.id));
const COLL=()=>DATA.collections.filter(c=>!c.hidden&&(HINTS||c.cover||inColl(c).length));
const coll=id=>DATA.collections.find(c=>c.id===id&&!c.hidden), prod=id=>P().find(p=>p.id===id);
const pcoll=p=>p.c.map(coll).find(Boolean);
const OFFERS=()=>DATA.offers.filter(o=>o.active!==false);
/* styling tips: Instagram posts and reels the owner picked, shown with Instagram's own embed player */
const tipList=()=>(Array.isArray(SITE.tips)?SITE.tips:[]).map(u=>{ const m=String(u).match(/instagram\.com\/(?:[\w.]+\/)?(p|reel|reels|tv)\/([\w-]+)/i); return m?{kind:m[1].toLowerCase()==='p'?'p':'reel',code:m[2]}:null; }).filter(Boolean).slice(0,12);
const tipsHTML=()=>{ if(SITE.tipsOn===false) return ''; const t=tipList(); if(!t.length) return HINTS?`<section><div class="head"><h2>Styling tips</h2></div><p class="lede">${todo('to add')} Paste links to your Instagram posts in Manage shop, Shop details, Styling tips.</p></section>`:'';
  return `<section><div class="head"><h2>Styling tips</h2><a href="${igUrl()}" rel="noopener">Follow on Instagram</a></div><p class="lede">Ideas from Sreeja on what to wear and how to style it.</p>
    <div class="prow tips">${t.map(x=>`<div class="tip"><iframe src="https://www.instagram.com/${x.kind}/${x.code}/embed/" title="Styling tip from Sreez on Instagram" loading="lazy" allowtransparency="true" allowfullscreen scrolling="no"></iframe><a href="https://www.instagram.com/${x.kind}/${x.code}/" rel="noopener">Open on Instagram</a></div>`).join('')}</div></section>`; };
const igUrl=()=>'https://www.instagram.com/'+SITE.ig, igDm=()=>'https://ig.me/m/'+SITE.ig;
const todo=t=>HINTS?`<span class="todo">${t}</span>`:'';
const waLink=(msg,num)=>`https://wa.me/${num||SITE.wa}?text=${encodeURIComponent(msg)}`;
const priceHTML=p=>p.price?(p.offerPrice&&p.offerPrice<p.price?`<span class="price">${inr(p.offerPrice)} <s>${inr(p.price)}</s></span>`:`<span class="price">${inr(p.price)}</span>`):'<span class="price">Price on request</span>';
const fmtDate=d=>{ if(!d) return ''; const x=new Date(d+(d.length===10?'T00:00:00':'')); return isNaN(x)?d:x.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}); };
const today=()=>{ const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
const nDesigns=c=>{const n=inColl(c).length;return n?n+(n===1?' design':' designs'):'Photos to add'};
const ph=(title,sub,ratio)=>`<span class="ph" style="aspect-ratio:${ratio||'3/4'}"><span><b>${title}</b>${sub||''}</span></span>`;
const cover=(c,ratio,big)=>{ const im=c.cover||(inColl(c)[0]||{imgs:[]}).imgs[0]; return im?(big?`<img ${big===1?'src':'data-defer data-src'}="${esc(imgSrc(im))}" alt=""${big===1?' fetchpriority="high"':''}>`:`<img ${tSrc(im)} alt="" loading="lazy" decoding="async">`):ph('Image placeholder',esc(c.name)+' cover',ratio); };
const sendHTML=(taId,msg)=>`<div class="sendbox"><button class="btn block" data-copy="${taId}">Copy message</button>${SITE.wa?`<a class="btn ghost block" href="${waLink(msg)}" rel="noopener">Send on WhatsApp</a>`:''}<a class="btn ghost block" href="${igDm()}" rel="noopener">Open Instagram chat</a>
  <p class="hint">${SITE.wa?'WhatsApp opens with your message filled in. For Instagram, copy the message first and paste it into the chat.':'Copy the message, then paste it into the Instagram chat. Attach any reference photos there.'}</p></div>`;
const measureHTML=`<details><summary>How to measure</summary><p>Use a soft measuring tape, wear the inner wear you plan to wear with the outfit, and keep the tape snug but not tight. A second person makes this easier.</p>
  <ul class="plain" style="margin-top:8px;color:var(--muted);font-size:14px">
  <li><b>Bust</b>: around the fullest part of the chest, tape level across the back.</li>
  <li><b>Waist</b>: around the natural waist, the narrowest part of the body.</li>
  <li><b>Hip</b>: around the fullest part of the hips.</li>
  <li><b>Shoulder</b>: across the back, from one shoulder point to the other.</li>
  <li><b>Armhole</b>: around the arm where it joins the shoulder, passing under the armpit.</li>
  <li><b>Upper arm</b>: around the fullest part of the upper arm.</li>
  <li><b>Sleeve length</b>: from the shoulder point down to where the sleeve should end.</li>
  <li><b>Length</b>: from the highest point of the shoulder down to where the garment should end.</li></ul>
  <p>If you have a blouse or dress that fits you well, measuring it flat is a good cross-check.</p></details>`;
let heroStart=Math.floor(Math.random()*1e6), heroLast=-1; try{ heroLast=+(sessionStorage.getItem('sreezHeroLast')??localStorage.getItem('sreezHeroLast')??-1); }catch(e){}
let bag=[], pick=null, cur=null, q='', homeTab='', carTimer=null, draft={}, lbSet=[], lbI=0, bagName='';
try{ bag=(JSON.parse(localStorage.getItem('sreezBag'))||[]).filter(b=>prod(b.id)&&typeof b.size==='string'); }catch(e){ bag=[]; }
const saveBag=()=>{ try{ localStorage.setItem('sreezBag',JSON.stringify(bag)); }catch(e){} };

const ARW=d=>`<button class="cnav ${d<0?'prev':'next'}" data-cnav="${d}" aria-label="${d<0?'Previous':'Next'} photo"><svg viewBox="0 0 24 24"><path d="${d<0?'M15 5l-7 7 7 7':'M9 5l7 7-7 7'}"/></svg></button>`;
/* every product photo shows as a swipeable carousel on its card, wherever the card appears */
const card=p=>{ const n=p.imgs.length; return `<div class="card"><div class="pic">${n?`<div class="cgal">${p.imgs.map((im,i)=>`<a href="#p-${p.id}"${i?' tabindex="-1" aria-hidden="true"':''}><img ${i?tLazy(im):tSrc(im)} alt="${i?'':esc(p.name)}" loading="lazy" decoding="async"></a>`).join('')}</div>`:`<a href="#p-${p.id}">${ph('Photo coming soon','')}</a>`}${n>1?`${ARW(-1)}${ARW(1)}<span class="cdots" aria-hidden="true">${'<i></i>'.repeat(n).replace('<i>','<i class="on">')}</span>`:''}${p.offerPrice&&p.price&&p.offerPrice<p.price?'<span class="badge">Offer</span>':''}</div><a class="ctext" href="#p-${p.id}"><h3>${esc(p.name)}</h3><span class="meta">${esc(p.tag)}</span>${priceHTML(p)}</a></div>`; };
const phCard=name=>`<div class="card"><div class="ph"><span><b>Image placeholder</b>${esc(name)}<br>Add designs in Manage shop</span></div><h3>New design</h3><span class="meta">Only you can see this placeholder</span></div>`;
const stepsHTML=`<ol class="steps">
  <li><b>Share your idea</b><span>Send a design from this site, a reference photo, or a description of the occasion.</span></li>
  <li><b>Send your measurements</b><span>Choose a standard size or share your own measurements for a made-to-measure fit.</span></li>
  <li><b>Cutting and stitching</b><span>The pattern is drafted for you and the piece is stitched from scratch.</span></li>
  <li><b>Fitting and delivery</b><span>Final adjustments are made before the piece is handed over or shipped.</span></li></ol>`;
const offerMeta=o=>`${o.discount?`<dt>Discount</dt><dd>${esc(o.discount)}</dd>`:(HINTS?`<dt>Discount</dt><dd>${todo('to add')}</dd>`:'')}${o.validUntil?`<dt>Valid until</dt><dd>${fmtDate(o.validUntil)}</dd>`:(HINTS?`<dt>Valid until</dt><dd>${todo('to add')}</dd>`:'')}`;

const AV=()=>SITE.avatar||SITE.portrait, avImg=()=>AV()?`<img src="${esc(imgSrc(AV()))}" alt="Sreeja Balagan" loading="lazy">`:'';
const firstPara=t=>String(t||'').split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);
const V={
home(){
  const cs=COLL(), tile=c=>`<a class="tile" href="#c-${c.id}">${cover(c,'3/4')}<b>${esc(c.name)}</b><span>${nDesigns(c)}</span></a>`;
  /* home slider: every collection that has a photo, starting one collection later on each visit, looping round */
  const hc=cs.filter(c=>c.cover||inColl(c).some(p=>p.imgs.length)), hr=hc.length?(()=>{let r=heroStart%hc.length; if(hc.length>1&&r===heroLast) r=(r+1+Math.floor(Math.random()*(hc.length-1)))%hc.length; try{sessionStorage.setItem('sreezHeroLast',r);localStorage.setItem('sreezHeroLast',r);}catch(e){} heroLast=r; return r;})():0;
  const slides=hc.slice(hr).concat(hc.slice(0,hr)).map((c,k)=>`<a class="slide hero" href="#c-${c.id}">${cover(c,'3/4',k?2:1)}
    <div class="copy"><h2 class="ht">${esc(c.name)}</h2><p>${esc(c.blurb)}</p><div class="btns"><span class="btn">Shop now</span></div></div></a>`);
  const bridal=cs.filter(c=>c.group==='bridal'), more=cs.filter(c=>c.group==='more'), all=P(), fresh=all.slice(0,4), trend=all.filter(p=>p.trend&&!fresh.includes(p)).slice(0,8), offers=OFFERS();
  const detail=P().filter(p=>p.c.includes('blouses')).map(p=>p.imgs[1]||p.imgs[0]).filter(Boolean).slice(0,6);
  if(!cs.some(c=>c.id===homeTab)) homeTab=(cs[0]||{}).id||'';
  return `
  ${slides.length?`<div class="carwrap"><div class="carousel" id="car">${slides.join('')}${slides.length>1?slides[0].replace('class="slide hero"','class="slide hero" data-clone aria-hidden="true" tabindex="-1"'):''}</div><div class="dots" id="dots"></div></div>`:''}
  ${cs.length?`<section><div class="chips tabs" id="homeTabs">${cs.map(c=>`<button class="chip" data-tab="${c.id}">${esc(c.name)}</button>`).join('')}</div>
    <div class="prow" id="homeGrid"></div>
    <p class="more"><a class="btn ghost" id="homeAll" href="#shop">View all</a></p></section>`:''}
  ${offers.length?`<section><div class="head"><h2>Offers</h2><a href="#offers">All offers</a></div>
    <div class="prow">${offers.map(o=>`<a class="ocard" href="#offers"><span class="otag">${esc(o.tag)}</span><b>${esc(o.title)}</b><span>${esc(o.discount||o.desc)}</span></a>`).join('')}</div></section>`:''}
  ${bridal.length?`<section><div class="head"><h2>The bridal edit</h2><a href="#collections">All collections</a></div>
    <div class="tiles">${bridal.map(tile).join('')}</div></section>`:''}
  ${trend.length?`<section><div class="head"><h2>Trending picks</h2><a href="#shop">View all</a></div>
    <div class="prow">${trend.map(card).join('')}</div></section>`:''}
  <div class="band"><span class="eyebrow">Custom order</span><h2>Have a design in mind?</h2><p>Bring a reference photo, your own fabric or just an occasion. Sreez drafts the pattern and stitches it to your measurements.</p><a class="btn" href="#custom-order">Start a custom order</a></div>
  ${all.length?`<section><div class="head"><h2>New arrivals</h2><small>${all.length} designs</small></div>
    <div class="grid less" id="newGrid">${all.map((p,k)=>card(p).replace('class="card"',k>3?'class="card xtra"':'class="card"')).join('')}</div>
    ${all.length>4?'<p class="more"><button class="btn ghost" id="showMore">Show more</button></p>':''}</section>`:''}
  ${more.length?`<section><div class="head"><h2>More to explore</h2></div><div class="tiles">${more.map(tile).join('')}</div></section>`:''}
  ${detail.length>1?`<section><span class="eyebrow">Bridal blouses</span><h2>Hand embroidery, bead by bead</h2>
    <p class="lede">Silk blouses with zari borders and hand-worked beads, sequins and stones on the neckline and sleeves.</p>
    <div class="detail" data-zset>${detail.map(im=>`<img data-zoom="${esc(im)}" ${tSrc(im)} alt="Embroidery detail on a bridal blouse" loading="lazy" decoding="async">`).join('')}</div>
    <p class="more"><a class="btn ghost" href="#c-blouses">See all bridal blouses</a></p></section>`:''}
  ${tipsHTML()}
  <section><span class="eyebrow">How it works</span><h2>From idea to fitting in four steps</h2><div style="margin-top:14px">${stepsHTML}</div>
    <p class="more"><a class="btn" href="#custom-order">Start a custom order</a></p></section>
  <section class="meet">${SITE.portrait?`<a href="#about"><img src="${esc(imgSrc(SITE.portrait))}" alt="Sreeja Balagan, founder of Sreez The Dress Maker" loading="lazy"></a>`:''}
    <div><span class="eyebrow">Meet the designer</span><h2>The designer behind Sreez</h2>
    ${firstPara(SITE.story).slice(0,2).map(x=>`<p>${nl(x)}</p>`).join('')||`<p class="lede">Women's and kids' wear designed and stitched from scratch, from everyday maxis to bridal blouses, lehengas and gowns.</p>`}
    ${SITE.quote?`<p class="pull">${esc(SITE.quote)}</p>`:''}
    <span class="sig">Sreeja Balagan</span><small class="sigrole">Founder and designer, Sreez The Dress Maker</small>
    <div class="btns"><a class="btn ghost" href="#about">Read my story</a><a class="btn ghost" href="${igUrl()}" rel="noopener">Follow on Instagram</a></div></div></section>`},

collections(){return `
  <div class="crumbs"><a href="#home">Home</a><span>/</span><span>Collections</span></div>
  <div class="pagehead"><h1>Collections</h1><p class="lede">Open a collection to see its designs. Every design can be made in your size, colour and fabric.</p></div>
  <div class="tiles all">${COLL().map(c=>`<a class="tile" href="#c-${c.id}">${cover(c,'3/4')}<b>${esc(c.name)}</b><span>${nDesigns(c)}</span></a>`).join('')}</div>`},

shop(cid){
  const c=cid&&coll(cid), s=q.toLowerCase();
  const list=P().filter(p=>(!c||p.c.includes(c.id))&&(!s||(p.name+' '+p.tag+' '+p.c.map(x=>(coll(x)||{}).name||'').join(' ')).toLowerCase().includes(s)));
  return `
  <div class="crumbs"><a href="#home">Home</a><span>/</span>${c?`<a href="#collections">Collections</a><span>/</span><span>${esc(c.name)}</span>`:'<span>Shop</span>'}</div>
  <div class="pagehead"><h1>${s?'Search results':(c?esc(c.name):'All designs')}</h1><p class="lede">${s?`${list.length} ${list.length===1?'design matches':'designs match'} "${esc(q)}"`:(c?esc(c.blurb):'Everything Sreez makes, across all collections.')}</p></div>
  <div class="chips"><a class="chip" href="#shop" aria-current="${!c}">All</a>${COLL().map(x=>`<a class="chip" href="#c-${x.id}" aria-current="${!!c&&c.id===x.id}">${esc(x.name)}</a>`).join('')}</div>
  <div class="grid">${(list.map(card).join('')+(HINTS&&c&&!s&&!list.length?phCard(c.name).repeat(2):''))||`<p class="empty">${s?'No designs match that search. Try a collection name such as Maxi or Blouse.':'New designs are on the way.'}</p>`}</div>`},

product(id){
  const p=prod(id); if(!p) return V.shop();
  cur=p; const sz=sizesOf(p); pick=sz.length===1?sz[0]:null;
  const c=pcoll(p), more=P().filter(x=>x.id!==p.id&&x.c.some(k=>p.c.includes(k))).slice(0,4), n=p.imgs.length;
  return `
  <div class="crumbs"><a href="#home">Home</a><span>/</span>${c?`<a href="#c-${c.id}">${esc(c.name)}</a>`:'<a href="#shop">Shop</a>'}<span>/</span><span>${esc(p.name)}</span></div>
  <div class="pd">
    <div>${n?`<div class="galwrap"><div class="gal" id="gal" data-zset>${p.imgs.map((im,i)=>`<button data-zoom="${esc(im)}" aria-label="Enlarge photo ${i+1}"><img src="${esc(imgSrc(im))}" alt="${esc(p.name)}${n>1?', photo '+(i+1):''}"${i?' loading="lazy"':' fetchpriority="high"'} decoding="async"></button>`).join('')}</div>
      <span class="zoomhint">${n>1?`<span id="galN">1</span> / ${n} · `:''}Tap to zoom</span></div>
      ${n>1?`<div class="thumbs" id="thumbs">${p.imgs.map((im,i)=>`<button data-img="${i}" aria-pressed="${i===0}" aria-label="Show photo ${i+1}"><img ${tSrc(im)} alt="" loading="lazy"></button>`).join('')}</div>`:''}`:ph('Photo coming soon','')}</div>
    <div class="info">
      <div>${c?`<span class="eyebrow">${esc(c.name)}</span>`:''}<h1 style="font-size:28px;margin-top:4px">${esc(p.name)}</h1><p style="font-size:15px;margin-top:6px">${priceHTML(p)}</p></div>
      <p>${nl(p.desc)}</p>
      <div><div class="label" style="margin-bottom:8px">Size</div><div class="sizes" id="pSizes"></div>
        <p class="hint" style="margin-top:8px"><a href="#help">Size guide and how to measure</a> · Measurements are confirmed with you before stitching.</p></div>
      ${lead(p)?`<p class="lead">${CLOCK}Stitched in about ${dayTxt(lead(p))} after your measurements are confirmed</p>`:(HINTS?`<p class="lead">${CLOCK}Stitching time ${todo('to add in Manage shop')}</p>`:'')}
      <div class="buyrow"><button class="btn block" id="pAdd" disabled>Choose a size</button><button class="btn ghost block" id="pBuy" disabled>Buy now</button></div>
      <ol class="buysteps"><li>Add the design to your cart, or tap Buy now.</li><li>Check out with your name, phone and delivery choice.</li><li>Sreez confirms the price and date with you, then stitching starts.</li></ol>
      <button class="btn ghost block" data-custom="${p.id}">Want changes? Customise this design</button>
      <a class="byline" href="#about">${avImg()}<span><b>Designed and stitched by Sreeja Balagan</b>NIFT graduate, fashion designer and stylist</span></a>
      <div>
        <details open><summary>Details</summary><p>${esc(p.tag)}${p.tag?'. ':''}Stitched to order${lead(p)?' in about '+dayTxt(lead(p)):''}. Colour and fabric can be changed on request.</p></details>
        ${p.fabric||HINTS?`<details><summary>Fabric and care</summary><p>${p.fabric?nl(p.fabric):todo('To add for this design')}</p></details>`:''}
        ${SITE.delivery||SITE.alterations||HINTS?`<details><summary>Delivery and alterations</summary><p>${SITE.delivery||SITE.alterations?nl([SITE.delivery,SITE.alterations].filter(Boolean).join('\n')):todo('Stitching time, delivery and alteration terms to add')}</p></details>`:''}
      </div>
    </div>
  </div>
  ${more.length?`<section><div class="head"><h2>You may also like</h2></div><div class="grid">${more.map(card).join('')}</div></section>`:''}`},

'custom-order'(){const d=draft; draft={}; const offers=OFFERS(); return `
  <div class="crumbs"><a href="#home">Home</a><span>/</span><span>Custom order</span></div>
  <div class="pagehead"><span class="eyebrow">Made to measure</span><h1>Start a custom order</h1><p class="lede">Pick a design from the shop as a starting point, or bring your own idea and fabric.</p></div>
  ${stepsHTML}
  ${SITE.usp?`<div class="note">${avImg()}<div><span class="eyebrow">A note from Sreeja Balagan</span><p>${nl(SITE.usp)}</p><span class="sig">Sreeja Balagan</span></div></div>`:''}
  <section class="narrow"><h2>Tell Sreez what you need</h2><p class="lede">Fill in what you know. Your order goes straight to Sreez, and she contacts you to confirm it.</p>
  <form id="coForm">
    <div class="row">
      <div class="field"><label for="coName">Your name</label><input id="coName" required autocomplete="name" maxlength="80"></div>
      <div class="field"><label for="coPhone">Phone or WhatsApp number</label><input id="coPhone" type="tel" inputmode="tel" required autocomplete="tel" pattern="[0-9+ ()-]{8,20}" title="Your phone number, 8 to 20 digits"></div>
    </div>
    <div class="row">
      <div class="field"><label for="coType">Garment</label><select id="coType">${DATA.collections.filter(c=>!c.hidden).map(c=>`<option${d.type===c.name?' selected':''}>${esc(c.name)}</option>`).join('')}<option>Something else</option></select></div>
      <div class="field"><label for="coDate">Needed by</label><input id="coDate" type="date"></div>
    </div>
    <div class="field"><label for="coDesign">Starting design</label><input id="coDesign" value="${esc(d.design||'')}" placeholder="A design from this site, or leave blank"></div>
    ${offers.length?`<div class="field"><label for="coOffer">Offer</label><select id="coOffer"><option value="">No offer</option>${offers.map(o=>`<option${d.offer===o.title?' selected':''}>${esc(o.title)}</option>`).join('')}</select></div>`:''}
    <div class="field"><label for="coOcc">Occasion</label><input id="coOcc" placeholder="Wedding, birthday, daily wear"></div>
    <label class="check covisit"><input type="checkbox" id="coVisit"> I will visit the studio for measurements</label>
    <div id="coVisitBox" class="box" hidden><div class="row">
      <div class="field"><label for="coVDate">Visit date</label><input id="coVDate" type="date" min="${addDays(0)}"></div>
      <div class="field"><label for="coVTime">Time</label><select id="coVTime">${['10:00 am','11:00 am','12:00 noon','1:00 pm','2:00 pm','3:00 pm','4:00 pm','5:00 pm','6:00 pm','7:00 pm'].map(t=>`<option>${t}</option>`).join('')}</select></div>
    </div><span class="hint">${SITE.hours?'Studio hours: '+esc(SITE.hours)+'. ':''}${SITE.address?esc(SITE.address)+'. ':''}Sreez confirms the time with you, or suggests another if she is not free.</span></div>
    <div id="coMeas">
    <div class="field"><label for="coSize">Size</label><select id="coSize">${STD.map(s=>`<option>${s}</option>`).join('')}</select></div>
    <div class="row">
      <div class="field"><label for="coBust">Bust (inches)</label><input id="coBust" inputmode="decimal"></div>
      <div class="field"><label for="coWaist">Waist (inches)</label><input id="coWaist" inputmode="decimal"></div>
      <div class="field"><label for="coHip">Hip (inches)</label><input id="coHip" inputmode="decimal"></div>
      <div class="field"><label for="coShoulder">Shoulder (inches)</label><input id="coShoulder" inputmode="decimal"></div>
      <div class="field"><label for="coArm">Armhole (inches)</label><input id="coArm" inputmode="decimal"></div>
      <div class="field"><label for="coUpper">Upper arm (inches)</label><input id="coUpper" inputmode="decimal"></div>
      <div class="field"><label for="coSleeve">Sleeve length (inches)</label><input id="coSleeve" inputmode="decimal"></div>
      <div class="field"><label for="coLen">Length (inches)</label><input id="coLen" inputmode="decimal"></div>
    </div>
    <div>${measureHTML}</div>
    </div>
    <div class="field"><label for="coNotes">Design notes</label><textarea id="coNotes" placeholder="Colour, fabric, neckline, sleeve, a design from this site"></textarea></div>
    <button class="btn block" type="submit">${SB.on?'Send my custom order':'Create my message'}</button>
  </form>
  <div id="coOut" style="margin-top:16px"></div></section>`},

offers(){const offers=OFFERS(); return `
  <div class="crumbs"><a href="#home">Home</a><span>/</span><span>Offers</span></div>
  <div class="pagehead"><h1>Offers</h1><p class="lede">${offers.length?'Current offers on custom orders. Mention the offer when you send your enquiry.':'There are no offers running right now. Follow Sreez on Instagram to hear about the next one.'}</p></div>
  ${SITE.offerBanner?`<img src="${esc(imgSrc(SITE.offerBanner))}" alt="" style="width:100%;border-radius:var(--radius);margin-bottom:16px">`:(HINTS?`<div class="ph" style="aspect-ratio:16/9;margin-bottom:16px"><span><b>Banner placeholder</b>Add an offer banner in Manage shop</span></div>`:'')}
  <div class="cards">${offers.map(o=>`<div class="box offer"><span class="otag">${esc(o.tag)}</span><b>${esc(o.title)}</b><span class="hint" style="font-size:14px">${esc(o.desc)}</span>
    <dl>${offerMeta(o)}</dl>
    <button class="btn ghost" data-offer="${esc(o.title)}">Use this offer</button></div>`).join('')}</div>
  ${SITE.offerTerms?`<p class="hint" style="margin-top:16px">${nl(SITE.offerTerms)}</p>`:(HINTS?`<p class="hint" style="margin-top:16px">Offer terms ${todo('to add')}</p>`:'')}`},

about(){ const paras=t=>String(t||'').split(/\n\s*\n/).filter(x=>x.trim()).map(x=>`<p>${nl(x.trim())}</p>`).join(''), sp=SITE.specialities||[]; return `
  <div class="crumbs"><a href="#home">Home</a><span>/</span><span>About</span></div>
  <div class="about">
    ${SITE.portrait?`<img class="portrait" src="${esc(imgSrc(SITE.portrait))}" alt="Sreeja Balagan, founder of Sreez The Dress Maker">`:(HINTS?`<div class="ph"><span><b>Image placeholder</b>Portrait of the designer, 4:5</span></div>`:'')}
    <div><span class="eyebrow">About me</span><h1>Meet Sreeja Balagan</h1>
      <p class="role">Founder · Fashion Designer · Fashion Stylist</p>
      ${SITE.story?paras(SITE.story):(HINTS?`<p>${todo('To add: her story, location and years of work')}</p>`:'')}
      ${SITE.quote?`<blockquote>${esc(SITE.quote)}<cite>Sreeja Balagan<span>Founder, Sreez The Dress Maker</span></cite></blockquote>`:''}
    </div>
  </div>
  ${sp.length?`<section><span class="eyebrow">What we make</span><h2>Our specialities</h2><ul class="spec">${sp.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>`:''}
  ${SITE.usp||SITE.vision?`<section class="duo">${SITE.usp?`<div class="box"><span class="eyebrow">My USP</span><p>${nl(SITE.usp)}</p></div>`:''}${SITE.vision?`<div class="box"><span class="eyebrow">My vision</span><p>${nl(SITE.vision)}</p></div>`:''}</section>`:''}
  <section><div class="btns"><a class="btn" href="#custom-order">Start a custom order</a><a class="btn ghost" href="#shop">Browse the designs</a><a class="btn ghost" href="${igUrl()}" rel="noopener">See more on Instagram</a></div></section>`},

contact(){return `
  <div class="crumbs"><a href="#home">Home</a><span>/</span><span>Contact</span></div>
  <div class="pagehead"><h1>Contact</h1><p class="lede">For orders, fittings and questions about a design.</p></div>
  <div class="cards">
    ${SITE.wa?`<div class="box"><b>WhatsApp</b><span class="contactline">${esc(SITE.waShow||'+'+SITE.wa)}</span><a class="btn ghost" href="${waLink('Hi Sreez, I have a question about a design.')}" rel="noopener">Chat on WhatsApp</a></div>`:(HINTS?`<div class="box"><b>WhatsApp</b><span>Number ${todo('to add')}</span></div>`:'')}
    <div class="box"><b>Instagram</b><span class="contactline">@${esc(SITE.ig)}</span><a class="btn ghost" href="${igDm()}" rel="noopener">Message on Instagram</a></div>
    ${SITE.address?`<div class="box"><b>Studio</b><span>${nl(SITE.address)}</span></div>`:(HINTS?`<div class="box"><b>Studio</b><span>Address ${todo('to add')}</span></div>`:'')}
    ${SITE.hours?`<div class="box"><b>Opening hours</b><span>${nl(SITE.hours)}</span></div>`:(HINTS?`<div class="box"><b>Opening hours</b><span>Days and times ${todo('to add')}</span></div>`:'')}
  </div>
  <div class="band"><h2>Ready to order?</h2><p>Add designs to your cart and check out, or describe what you want made.</p><a class="btn" href="#custom-order">Start a custom order</a></div>`},

help(){ const d=(title,val,hint)=>val?`<details><summary>${title}</summary><p>${nl(val)}</p></details>`:(HINTS?`<details><summary>${title}</summary><p>${todo(hint)}</p></details>`:''); return `
  <div class="crumbs"><a href="#home">Home</a><span>/</span><span>Help</span></div>
  <div class="pagehead"><h1>Help</h1><p class="lede">Sizing, delivery and what happens after you order.</p></div>
  <div class="narrow">
    <details open><summary>How do I order?</summary><p>Open a design, choose a size and tap Add to cart. Open your cart, tap Checkout, fill in your name, phone and delivery choice, and place the order. Your order goes straight to Sreez. She contacts you to confirm the price and date before stitching starts.${Number(SITE.leadDays)?' Stitching usually takes about '+dayTxt(Math.round(Number(SITE.leadDays)))+'.':''}</p></details>
    <details><summary>Size guide</summary><p>Standard sizes run from XS to XXL, or you can send your own measurements.${SITE.sizeChart?'<br><br>'+nl(SITE.sizeChart):' '+todo('Size chart to add')}</p></details>
    ${measureHTML}
    <details><summary>Can I change the colour or fabric?</summary><p>Yes. Every piece is stitched to order, so you can ask for a different colour, fabric, neckline or sleeve.</p></details>
    ${d('Delivery',SITE.delivery,'Stitching time, shipping areas and charges to add')}
    ${d('Alterations and returns',SITE.alterations,'Alteration and return terms to add')}
    ${d('Payment',SITE.payment,'Payment methods and advance terms to add')}
  </div>`},

checkout(){
  bag=bag.filter(b=>prod(b.id));
  if(!bag.length) return `<div class="pagehead" style="padding-top:28px"><h1>Checkout</h1><p class="lede">Your cart is empty. Open a design, choose a size and add it to your cart.</p><a class="btn" href="#shop">Browse designs</a></div>`;
  const L=bagLead(), n=bag.length;
  return `
  <div class="crumbs"><a href="#home">Home</a><span>/</span><a href="#shop">Shop</a><span>/</span><span>Checkout</span></div>
  <div class="pagehead"><h1>Checkout</h1><p class="lede">Add your details and place the order. Sreez confirms the price, your measurements and the date with you before stitching starts.</p></div>
  <div class="ck">
    <form id="ckForm">
      <div class="field"><label for="ckName">Your name</label><input id="ckName" required autocomplete="name"></div>
      <div class="field"><label for="ckPhone">Phone or WhatsApp number</label><input id="ckPhone" type="tel" required autocomplete="tel" inputmode="tel"></div>
      <div class="row">
        <div class="field"><label for="ckDel">Delivery</label><select id="ckDel"><option>Collect from the studio</option><option>Deliver to my address</option></select></div>
        <div class="field"><label for="ckDate">Needed by</label><input id="ckDate" type="date"${L?` min="${addDays(L)}"`:''}></div>
      </div>
      ${L?`<p class="hint" style="margin-top:-6px">Earliest ready date is about ${fmtDate(addDays(L))}. Leave the date empty if you are not in a hurry.</p>`:''}
      <div class="field"><label for="ckAddr">Delivery address</label><textarea id="ckAddr" autocomplete="street-address" placeholder="Only needed for delivery" style="min-height:80px"></textarea></div>
      <div class="field"><label for="ckNotes">Notes for Sreez</label><textarea id="ckNotes" placeholder="Colour or fabric changes, occasion, anything else" style="min-height:80px"></textarea></div>
      <button class="btn block" type="submit">Place order</button>
      <p class="hint">Nothing is charged on this site. ${SITE.payment?nl(SITE.payment):'Sreez shares the final price and the advance to pay when she confirms your order.'}</p>
    </form>
    <aside class="box cksum"><div class="label">Your order</div>
      <div>${bag.map(b=>{ const p=prod(b.id); return `<div class="ckline">${p.imgs[0]?`<img ${tSrc(p.imgs[0])} alt="">`:'<span></span>'}<div><b>${esc(p.name)}</b><span>${esc(b.size)}${lead(p)?' · about '+dayTxt(lead(p)):''}</span></div><span class="num">${effPrice(p)?inr(effPrice(p)):'On request'}</span></div>`; }).join('')}</div>
      <dl class="sums"><dt>${n} ${n===1?'design':'designs'}</dt><dd></dd>${L?`<dt>Stitching time</dt><dd>About ${dayTxt(L)}</dd><dt>Earliest ready date</dt><dd>${fmtDate(addDays(L))}</dd>`:''}<dt class="big">Estimated total</dt><dd class="big">${totTxt()}</dd></dl>
      <a class="hint" href="#shop">Add another design</a>
    </aside>
  </div>`},

manage(){ if(isAdmin) return adminHTML();
  const st=own.state, head=t=>`<div class="pagehead" style="padding-top:28px"><h1>Manage shop</h1><p class="lede">${t}</p>`, back='<a class="btn ghost" href="#home">Back to the shop</a>';
  if(!capsReady) return head('Checking your access…')+'</div>';
  if(st==='off') return head('The shop is not connected to its database yet.')+`<div class="btns">${back}</div></div>`;
  if(st==='no') return head('You are signed in as '+esc(own.email)+'. This account is not the shop owner.')+`<div class="btns"><button class="btn" id="ownOut">Use another account</button>${back}</div></div>`;
  if(st==='verify') return head('One more step. We sent a link to '+esc(own.email)+'. Open that email, tap the link, then come back here and press Continue. Check the spam folder if you cannot find it.')+`<div class="btns"><button class="btn" id="ownGo">Continue</button><button class="btn ghost" id="ownAgain">Send the link again</button><button class="btn ghost" id="ownOut">Use another account</button></div></div>`;
  return head('This area is only for the shop owner. Sign in to manage the shop.')+`
    <form class="box ownform" id="ownForm"><div class="field full"><label for="ownEmail">Email</label><input id="ownEmail" type="email" autocomplete="username" required></div>
      <div class="field full"><label for="ownPw">Password</label><input id="ownPw" type="password" autocomplete="current-password" minlength="6" required></div>
      <button class="btn block" type="submit">Sign in</button>
      <div class="ownlinks"><button class="linkbtn" type="button" id="ownNew">First time? Create your password</button><button class="linkbtn" type="button" id="ownReset">Forgot password</button></div></form>
    <div class="btns" style="margin-top:14px"><button class="btn ghost" id="ownIn">Sign in with Google</button>${back}</div></div>`; }
};

function route(){
  let h=location.hash.slice(1)||'home', key=h, html;
  if(h.startsWith('c-')&&coll(h.slice(2))){ key='collections'; html=V.shop(h.slice(2)); }
  else if(h.startsWith('p-')){ key='collections'; html=V.product(h.slice(2)); }
  else if(h==='shop') html=V.shop();
  else if(V[h]) html=V[h]();
  else { key='home'; html=V.home(); }
  chrome(); document.body.classList.toggle('managing',h==='manage'&&isAdmin);
  if(h!=='shop'){ q=''; $('q').value=''; $('searchBar').hidden=true; $('searchBtn').setAttribute('aria-expanded',false); }
  const v=$('view'); v.innerHTML=html;
  v.classList.remove('in'); void v.offsetWidth; v.classList.add('in');
  if(h.startsWith('p-')&&cur){ renderSizes(); setupGallery(); }
  renderHomeTab(); setupCarousel();
  document.querySelectorAll('[data-nav]').forEach(a=>{ if(a.dataset.nav===key) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current'); });
  closeSheets(); window.scrollTo(0,0);
}
function renderHomeTab(){
  const g=$('homeGrid'); if(!g) return;
  const c=coll(homeTab); if(!c) return; const list=inColl(c);
  g.innerHTML=list.length?list.map(card).join(''):(HINTS?phCard(c.name).repeat(3):'<p class="empty">New designs are on the way.</p>');
  g.scrollLeft=0;
  $('homeAll').href='#c-'+c.id; $('homeAll').textContent='View all '+c.name;
  document.querySelectorAll('#homeTabs .chip').forEach(b=>b.setAttribute('aria-current',b.dataset.tab===homeTab));
}
function setupCarousel(){
  clearInterval(carTimer);
  const car=$('car'); if(!car) return;
  const n=car.querySelectorAll('.slide:not([data-clone])').length, d=$('dots');
  d.innerHTML='<i class="on"></i>'+'<i></i>'.repeat(Math.max(0,n-1));
  const idx=()=>Math.round(car.scrollLeft/car.clientWidth);
  /* the last slide is a copy of the first: once it settles there, jump back to the real first slide so the rotation never rewinds */
  const wrap=()=>{ if(idx()>=n){ car.style.scrollBehavior='auto'; car.scrollLeft=0; } };
  let st=null, hold=0;
  car.addEventListener('scroll',()=>{const i=idx()%n;[...d.children].forEach((o,k)=>o.classList.toggle('on',k===i)); clearTimeout(st); st=setTimeout(wrap,140);},{passive:true});
  if(n<2||matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  const pause=()=>{ hold=Date.now()+8000; };
  car.addEventListener('pointerdown',pause,{passive:true}); car.addEventListener('touchstart',pause,{passive:true});
  carTimer=setInterval(()=>{ if(Date.now()<hold||document.hidden||car.getBoundingClientRect().bottom<80) return; wrap(); car.scrollTo({left:(idx()+1)*car.clientWidth,behavior:'smooth'}); },4500);
}
function setupGallery(){
  const g=$('gal'), t=$('thumbs'); if(!g||!t) return;
  g.addEventListener('scroll',()=>{ const i=Math.round(g.scrollLeft/g.clientWidth); $('galN').textContent=i+1; t.querySelectorAll('button').forEach((b,k)=>b.setAttribute('aria-pressed',k===i)); },{passive:true});
}
function openLB(set,i){ lbSet=set; lbI=i; showLB(); $('lb').hidden=false; document.body.style.overflow='hidden'; $('lbClose').focus(); }
function showLB(){ const im=$('lbImg'); im.classList.remove('z'); im.src=imgSrc(lbSet[lbI]); $('lbN').textContent=lbSet.length>1?`${lbI+1} of ${lbSet.length}`:''; $('lbPrev').disabled=lbSet.length<2; $('lbNext').disabled=lbSet.length<2; }
function stepLB(d){ if(lbSet.length<2) return; lbI=(lbI+d+lbSet.length)%lbSet.length; showLB(); }
function closeLB(){ $('lb').hidden=true; document.body.style.overflow=''; }
function renderSizes(){
  const el=$('pSizes'); if(!el) return;
  el.innerHTML=sizesOf(cur).map(s=>`<button class="size" data-s="${s}" aria-pressed="${pick===s}">${s}</button>`).join('');
  $('pAdd').disabled=!pick; $('pAdd').textContent=pick?'Add to cart':'Choose a size'; if($('pBuy')) $('pBuy').disabled=!pick;
}
function toggleSearch(open){
  const bar=$('searchBar'); bar.hidden=!open; $('searchBtn').setAttribute('aria-expanded',open);
  if(open) $('q').focus();
  else if(q){ q=''; $('q').value=''; if(location.hash==='#shop') $('view').innerHTML=V.shop(); }
}
function openSheet(id){ document.querySelectorAll('.sheet').forEach(s=>s.classList.toggle('open',s.id===id)); $('scrim').classList.add('open'); }
function closeSheets(){ document.querySelectorAll('.sheet').forEach(s=>s.classList.remove('open')); $('scrim').classList.remove('open'); }
const bagMsg=()=>(bagName?`Hi Sreez, this is ${bagName}. `:'Hi Sreez, ')+'I would like to enquire about:\n'+bag.map((b,i)=>`${i+1}. ${prod(b.id).name} (${b.size})`).join('\n')+'\nPlease share the price and delivery time.';
const bagTotal=()=>{ let t=0, open=0; bag.forEach(b=>{ const v=effPrice(prod(b.id)); if(v) t+=v; else open++; }); return {t,open}; };
const bagLead=()=>Math.max(0,...bag.map(b=>lead(prod(b.id))));
const totTxt=()=>{ const x=bagTotal(); return (x.t?inr(x.t):'')+(x.open?(x.t?' + ':'')+'price on request':''); };
function renderBag(){
  bag=bag.filter(b=>prod(b.id)); const n=bag.length;
  [$('bagCount'),$('bagCount2')].forEach(e=>{ e.textContent=n; e.hidden=!n; });
  $('bagBody').innerHTML=n
    ? bag.map((b,i)=>{ const p=prod(b.id); return `<div class="line">${p.imgs[0]?`<img ${tSrc(p.imgs[0])} alt="">`:'<span></span>'}<div><b>${esc(p.name)}</b><span>${esc(b.size)}</span><span class="lp">${effPrice(p)?inr(effPrice(p)):'Price on request'}</span></div><button data-rm="${i}">Remove</button></div>`; }).join('')
      +`<dl class="sums"><dt>${n} ${n===1?'design':'designs'}</dt><dd>${totTxt()}</dd>${bagLead()?`<dt>Stitching time</dt><dd>About ${dayTxt(bagLead())}</dd>`:''}</dl>
        <a class="btn block" href="#checkout" data-close>Checkout</a><a class="btn ghost block" href="#shop" data-close>Keep shopping</a>
        <p class="hint">Nothing is charged on this site. Sreez confirms the price and date with you before stitching starts.</p>`
    : '<p class="hint">Your cart is empty. Open a design and choose a size to add it.</p><a class="btn block" href="#shop" data-close>Browse designs</a>';
}
function copyFrom(btn){
  const ta=$(btn.dataset.copy), label=btn.textContent;
  const done=()=>{ btn.textContent='Copied'; setTimeout(()=>btn.textContent=label,1600); };
  try{ navigator.clipboard.writeText(ta.value).then(done,()=>ta.select()); }catch(e){ ta.select(); }
}
function chrome(){
  $('announce').textContent=SITE.announce||''; $('announce').hidden=!SITE.announce;
  const cs=COLL();
  $('menuBody').innerHTML='<a href="#home">Home</a><a href="#shop">Shop all</a>'+cs.map(c=>`<a class="sub" href="#c-${c.id}">${esc(c.name)}</a>`).join('')+'<a href="#offers">Offers</a><a href="#custom-order">Custom order</a><a href="#about">About</a><a href="#contact">Contact</a><a href="#help">Help</a>'+(isAdmin?'<a href="#manage">Manage shop</a>':'');
  $('footColl').innerHTML='<li><a href="#collections">All collections</a></li>'+cs.slice(0,6).map(c=>`<li><a href="#c-${c.id}">${esc(c.name)}</a></li>`).join('');
  $('footVisit').innerHTML=[SITE.address?esc(SITE.address):(HINTS?'Studio address '+todo('to add'):''),SITE.hours?esc(SITE.hours):(HINTS?'Opening hours '+todo('to add'):''),SITE.wa?'WhatsApp '+esc(SITE.waShow||'+'+SITE.wa):''].filter(Boolean).map(x=>`<li>${x}</li>`).join('');
  $('footIg').href=igUrl();
  document.querySelectorAll('[data-admin]').forEach(e=>e.hidden=!isAdmin);
}

/* ---------------- Shop manager (owner and editors only) ---------------- */
let own={state:''}, capsReady=false, aTab='orders', aEdit=null, oFilter='Open', ORD=null, ordErr='', dirty=false, pSearch='', pColl='', oSearch='', busy='', pasteOpen=false, toastT=null, stashT=null;
function toast(msg){ const t=$('toast'); t.textContent=msg; t.hidden=false; clearTimeout(toastT); toastT=setTimeout(()=>t.hidden=true,4200); }
function markDirty(){ dirty=true; $('pubBar').hidden=false; clearTimeout(stashT); stashT=setTimeout(()=>{ try{ sessionStorage.setItem('sreezDraft',JSON.stringify(DATA)); }catch(e){} },400); }
async function publishSite(){
  if(!cap.store) return toast('Saving is not available. Sign in as the shop owner first.');
  if(busy) return; busy='pub'; $('pubGo').textContent='Publishing…';
  try{ sessionStorage.removeItem('sreezDraft'); }catch(e){}
  try{ await cap.store.save(DATA); dirty=false; $('pubBar').hidden=true; try{ sessionStorage.removeItem('sreezAfter'); localStorage.setItem('sreezCat',JSON.stringify(DATA)); }catch(e){} toast('Published. Your changes are live on the website.'); }
  catch(err){ const c=err&&err.code; try{ sessionStorage.removeItem('sreezAfter'); if(c!=='conflict') sessionStorage.setItem('sreezDraft',JSON.stringify(DATA)); }catch(e){}
    toast(c==='permission-denied'?'This account cannot change the shop. Sign in as the shop owner.':'Could not publish. Check your connection and try again.'); }
  busy=''; $('pubGo').textContent='Publish to website';
}
async function toJpeg(file,max){ const bmp=await createImageBitmap(file), k=Math.min(1,(max||1400)/Math.max(bmp.width,bmp.height)), c=document.createElement('canvas');
  c.width=Math.round(bmp.width*k); c.height=Math.round(bmp.height*k); c.getContext('2d').drawImage(bmp,0,0,c.width,c.height);
  return new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(new Error('convert')),'image/jpeg',.8)); }
async function storeImages(files){
  const out=[]; if(!cap.assets){ toast('Photo upload is not available. Sign in as the shop owner first.'); return out; }
  for(const f of files){ try{ let b=await toJpeg(f); if(b.size>700000) b=await toJpeg(f,1000); const r=await cap.assets.upload(b,{type:'image/jpeg'}); out.push('a:'+r.id); }
    catch(err){ const c=err&&err.code; toast(c==='too_large'?'That photo is too large.':c==='unsupported_type'?'That file is not a photo this site can use.':c==='quota_exceeded'?'Photo storage is full. Remove unused photos first.':'A photo could not be uploaded. Try again.'); } }
  return out;
}
function watchOrders(){
  if(!cap.db){ ORD=[]; ordErr='Orders cannot be loaded. Sign in as the shop owner.'; return; }
  const t=setTimeout(()=>{ if(ORD===null){ ORD=[]; ordErr='Orders are taking too long to load. Check your connection and reopen the page.'; if(onManage()&&!aEdit) renderAdmin(); } },10000);
  cap.db.collection('orders').onSnapshot(s=>{ clearTimeout(t); ORD=s.docs.map(d=>Object.assign({},d.data(),{id:d.id})); ordErr=''; numberOrders(); if(onManage()&&!aEdit) renderAdmin(); },
    ()=>{ clearTimeout(t); ORD=ORD||[]; ordErr='Orders could not be loaded. Only the shop owner and editors can see them.'; if(onManage()&&!aEdit) renderAdmin(); });
}
/* orders placed on the website arrive without a number: give each the next one */
let numbering=false;
async function numberOrders(){ if(numbering) return; const todo=ORD.filter(o=>!o.no).sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt))); if(!todo.length) return; numbering=true;
  let n=ORD.reduce((m,o)=>Math.max(m,o.no||0),0);
  try{ for(const o of todo) await cap.db.collection('orders').doc(o.id).set({no:++n},{merge:true}); }catch(e){} numbering=false; }
const onManage=()=>location.hash==='#manage';
function renderAdmin(){ const y=window.scrollY; $('view').innerHTML=V.manage(); oSum(); window.scrollTo(0,y); }
const newOrder=()=>({no:((ORD||[]).reduce((m,o)=>Math.max(m,o.no||0),0))+1,createdAt:new Date().toISOString(),customer:'',phone:'',channel:'WhatsApp',status:'New',items:[],due:'',discount:0,advance:0,measurements:'',notes:''});
const oTotal=o=>Math.max(0,(o.items||[]).reduce((s,i)=>s+(Number(i.price)||0),0)-(Number(o.discount)||0));
const oBal=o=>Math.max(0,oTotal(o)-(Number(o.advance)||0));
function parseEnquiry(t){
  const o=newOrder(), extra=[], m=t.match(/this is ([^.\n]+)\./i); if(m) o.customer=m[1].trim();
  let garment='', design='', size='';
  t.split('\n').forEach(l=>{ let x;
    if((x=l.match(/^\s*\d+\.\s*(.+?)\s*\(([^)]+)\)\s*(?:[-\u2013]\s*\D*([\d,]+))?\s*$/))){ const p=DATA.products.find(p=>p.name.toLowerCase()===x[1].toLowerCase()); o.items.push({pid:p?p.id:'',name:p?p.name:x[1],size:x[2],price:x[3]?Number(x[3].replace(/,/g,'')):(p?(p.offerPrice||p.price||0):0)}); }
    else if((x=l.match(/^\s*(Garment|Starting design|Offer|Occasion|Needed by|Size|Measurements|Notes|Phone|Delivery|Address):\s*(.+)$/i))){ const k=x[1].toLowerCase(), v=x[2].trim();
      if(k==='garment') garment=v; else if(k==='starting design') design=v; else if(k==='size') size=v; else if(k==='measurements') o.measurements=v; else if(k==='phone') o.phone=v.replace(/\D/g,'');
      else if(k==='needed by'){ if(/^\d{4}-\d{2}-\d{2}$/.test(v)) o.due=v; else extra.push('Needed by: '+v); } else extra.push(x[1]+': '+v); } });
  if(!o.items.length&&(garment||design)){ const p=DATA.products.find(p=>p.name.toLowerCase()===design.toLowerCase()); o.items.push({pid:p?p.id:'',name:design?design+(garment?' ('+garment+', custom)':''):garment+' (custom)',size:size,price:p?(p.offerPrice||p.price||0):0}); }
  o.notes=extra.join('\n'); return o;
}
/* form field bound to the object being edited: typing updates it straight away */
let bo=null;
const fld=(label,k,o)=>{ o=o||{}; const v=bo[k]==null?'':Array.isArray(bo[k])?bo[k].join('\n'):bo[k], id='f_'+k, a=`id="${id}" data-k="${k}"${o.t?` data-t="${o.t}"`:''}${o.ph?` placeholder="${esc(o.ph)}"`:''}`;
  return `<div class="field${o.area||o.full?' full':''}"><label for="${id}">${label}</label>${o.area?`<textarea ${a}>${esc(v)}</textarea>`:o.opts?`<select ${a}>${o.opts.map(x=>{ const val=Array.isArray(x)?x[0]:x, lab=Array.isArray(x)?x[1]:x; return `<option value="${esc(val)}"${String(v)===String(val)?' selected':''}>${esc(lab)}</option>`; }).join('')}</select>`:`<input ${a} value="${esc(v)}"${o.t==='num'?' inputmode="decimal"':''}${o.type?` type="${o.type}"`:''}>`}${o.hint?`<span class="hint">${o.hint}</span>`:''}</div>`; };
const chk=(label,k)=>`<label class="check"><input type="checkbox" data-k="${k}" data-t="bool"${bo[k]?' checked':''}>${label}</label>`;
const thumb=im=>im?`<img class="tth" ${tSrc(im)} alt="" loading="lazy">`:'<span class="tth"></span>';
const mv=(kind,i,n)=>`<span class="mvs"><button class="mini" data-a="move" data-v="${kind}:${i}:-1"${i===0?' disabled':''} aria-label="Move up">↑</button><button class="mini" data-a="move" data-v="${kind}:${i}:1"${i===n-1?' disabled':''} aria-label="Move down">↓</button></span>`;
/* the manager is its own app view: section menu (side on desktop, bottom on phone), a title bar with the main actions, then panels and tables */
const TABS=[['orders','Orders','Orders'],['products','Designs','Designs'],['collections','Collections','Collections'],['offers','Offers','Offers'],['shop','Shop details','Shop'],['insights','Insights','Insights']];
const ICON={orders:'M9 4h6v3H9zM9 5H6v15h12V5h-3M9 11h6M9 15h6',products:'M9 4L4 7l2 4 2-1v10h8V10l2 1 2-4-5-3a3 3 0 0 1-6 0z',collections:'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',offers:'M4 12.5V5h7.5l8.5 8.5-7.5 7.5zM8.5 9.4v.2',shop:'M4 9l1-5h14l1 5M5 9v11h14V9M10 20v-6h4v6',insights:'M5 20v-9M12 20V4M19 20v-6'};
const pn=(title,inner,hint)=>`<div class="pn"><h2>${title}</h2>${hint?`<p class="hint">${hint}</p>`:''}${inner}</div>`;
const pill=(t,c)=>`<span class="pill${c?' '+c:''}">${t}</span>`;
const stPill=o=>pill(esc(o.status),o.status==='New'?'on':o.status==='Ready'?'ok':!OPEN(o.status)?'off':'')+(o.due&&o.due<today()&&OPEN(o.status)?pill('Overdue','warn'):'');
const pPrice=p=>p.price?(p.offerPrice&&p.offerPrice<p.price?inr(p.offerPrice)+' <s>'+inr(p.price)+'</s>':inr(p.price)):'On request';
const tbl=(cls,heads,rows,empty)=>`<div class="tbl ${cls}"><div class="thead">${heads.map(h=>`<span${h[1]?` class="${h[1]}"`:''}>${h[0]}</span>`).join('')}</div>${rows||`<p class="tempty">${empty}</p>`}</div>`;
function adminHTML(){
  const newN=ORD?ORD.filter(o=>o.status==='New').length:0, pg=aEdit?editPage():PAGES[aTab]();
  return `<div class="mg"><aside class="mgside"><a class="mgbrand" href="#home"><img src="img/logo.png" alt="Sreez The Dress Maker"><span>Shop manager</span></a>
    <nav class="mgnav" aria-label="Manager sections">${TABS.map(t=>`<button class="mgtab" data-a="tab" data-v="${t[0]}"${aTab===t[0]?' aria-current="page"':''}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ICON[t[0]]}"/></svg><span class="tl">${t[1]}</span><span class="ts">${t[2]}</span></button>`).join('')}</nav>
    <a class="mini mgsite" href="#home">View website</a><button class="mini mgsite" id="ownOut">Sign out</button></aside>
  <div class="mgmain"><div class="mgtop"><div class="mgtitle">${aEdit?`<button class="mgcrumb" data-a="back">‹ ${TABS.find(t=>t[0]===aTab)[1]}</button>`:'<a class="mgcrumb web" href="#home">‹ Website</a>'}<h1>${pg.title}</h1></div><div class="mgacts">${pg.acts||''}</div></div>
    <div class="mgbody">${pg.body}</div></div></div>`;
}
const PAGES={
orders(){
  const acts='<button class="btn ghost sm" data-a="paste">Paste enquiry</button><button class="btn sm" data-a="new-order">New order</button>';
  if(ORD===null) return {title:'Orders',acts,body:'<div class="tbl"><p class="tempty">Loading orders…</p></div>'};
  const f=oFilter, s=oSearch.toLowerCase(), t=today(), wk=new Date(Date.now()+7*864e5).toISOString().slice(0,10);
  const hit=(o,x)=>x==='All'||(x==='Open'?OPEN(o.status):o.status===x), cnt=x=>ORD.filter(o=>hit(o,x)).length, open=ORD.filter(o=>OPEN(o.status));
  const list=ORD.filter(o=>hit(o,f)&&(!s||('#'+o.no+' '+(o.customer||'')+' '+(o.phone||'')).toLowerCase().includes(s))).sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999')||(b.no||0)-(a.no||0));
  const row=o=>{ const late=o.due&&o.due<t&&OPEN(o.status), due=o.due?(late?'Was due ':'Due ')+fmtDate(o.due):'No due date', bal=oBal(o)&&OPEN(o.status)?inr(oBal(o))+' to collect':'';
    return `<div class="trow" data-a="edit" data-v="order:${o.id}"><span class="dk num tmeta">#${o.no}</span><span class="tmain"><button class="tname"><span class="mb">#${o.no} </span>${esc(o.customer||'No name')}</button><span class="tmeta">${esc((o.items||[]).map(i=>i.name).join(', ')||'No items yet')}</span><span class="tmeta mb">${due} · ${inr(oTotal(o))}${bal?' · '+bal:''}</span></span><span class="dk${late?' late':''}">${due}</span><span class="dk r num"><b>${inr(oTotal(o))}</b>${bal?`<span class="tmeta">${bal}</span>`:''}</span><span class="tstat">${stPill(o)}</span></div>`; };
  return {title:'Orders',acts,body:`${ordErr?`<p class="warnbox">${esc(ordErr)}</p>`:''}
    <div class="kpis"><div class="kpi"><b>${open.length}</b><span>Open orders</span></div><div class="kpi"><b>${open.filter(o=>o.due&&o.due>=t&&o.due<=wk).length}</b><span>Due in 7 days</span></div><div class="kpi"><b>${open.filter(o=>o.due&&o.due<t).length}</b><span>Overdue</span></div><div class="kpi"><b>${inr(open.reduce((n,o)=>n+oBal(o),0))}</b><span>To collect</span></div></div>
    ${pasteOpen?pn('Paste an enquiry',`<textarea id="pasteTa" placeholder="Hi Sreez, this is ..." aria-label="Customer message"></textarea><div class="btns"><button class="btn sm" data-a="paste-read">Create order from message</button><button class="btn ghost sm" data-a="paste">Cancel</button></div>`,'Paste the order or enquiry message a customer sent from the website. The name, phone, designs and sizes are filled in for you.'):''}
    <div class="tools"><input class="tin" id="oSearch" data-q="oSearch" type="search" placeholder="Search name, phone or order number" value="${esc(oSearch)}" aria-label="Search orders"><select class="tin" data-f="oFilter" aria-label="Show orders">${['Open','All'].concat(STATUS).map(x=>`<option value="${x}"${f===x?' selected':''}>${x==='Open'?'Open orders':x==='All'?'All orders':x} (${cnt(x)})</option>`).join('')}</select></div>
    ${tbl('t-ord',[['No.'],['Customer and items'],['Due'],['Amount','r'],['Status']],list.map(row).join(''),ORD.length?'No orders match.':'No orders yet. Orders placed on the website appear here by themselves. For an order sent by message, tap Paste enquiry.')}`};
},
products(){
  const s=pSearch.toLowerCase(), filt=!!(s||pColl), n=DATA.products.length;
  const list=DATA.products.map((p,i)=>[p,i]).filter(x=>(!s||x[0].name.toLowerCase().includes(s))&&(!pColl||x[0].c.includes(pColl)));
  const row=([p,i])=>{ const ph=p.imgs.length+(p.imgs.length===1?' photo':' photos'), off=p.offerPrice&&p.price&&p.offerPrice<p.price;
    return `<div class="trow" data-a="edit" data-v="product:${p.id}">${thumb(p.imgs[0])}<span class="tmain"><button class="tname">${esc(p.name)}</button><span class="tmeta dk">${esc(p.tag?p.tag+' · ':'')}${ph}</span><span class="tmeta mb">${pPrice(p)} · ${ph}${p.hidden?' · Hidden':''}${p.trend?' · Trending':''}</span></span><span class="dk tmeta">${esc(p.c.map(c=>(DATA.collections.find(x=>x.id===c)||{}).name).filter(Boolean).join(', ')||'None')}</span><span class="dk num">${pPrice(p)}</span><span class="dk tstat">${p.hidden?pill('Hidden','warn'):pill('Live','ok')}${p.trend?pill('Trending'):''}${off?pill('Offer','on'):''}</span>${filt?'<span></span>':mv('products',i,n)}</div>`; };
  return {title:'Designs',acts:'<button class="btn sm" data-a="new-product">Add design</button>',body:`
    <div class="tools"><input class="tin" id="pSearch" data-q="pSearch" type="search" placeholder="Search designs" value="${esc(pSearch)}" aria-label="Search designs"><select class="tin" data-f="pColl" aria-label="Collection"><option value="">All collections</option>${DATA.collections.map(c=>`<option value="${c.id}"${pColl===c.id?' selected':''}>${esc(c.name)}</option>`).join('')}</select></div>
    ${tbl('t-prod',[[''],['Design'],['Collections'],['Price'],['Status'],['Order']],list.map(row).join(''),'No designs match.')}
    <p class="hint">${n} designs. The order here is the order on the website. Tap a design to change its photos, price or details.</p>`};
},
collections(){ const n=DATA.collections.length;
  const row=(c,i)=>{ const k=DATA.products.filter(p=>p.c.includes(c.id)).length, cnt=k+(k===1?' design':' designs'), sec=c.group==='bridal'?'Bridal edit':c.group==='more'?'More to explore':'';
    return `<div class="trow" data-a="edit" data-v="coll:${c.id}">${thumb(c.cover||(DATA.products.find(p=>p.c.includes(c.id))||{imgs:[]}).imgs[0])}<span class="tmain"><button class="tname">${esc(c.name)}</button><span class="tmeta dk">${esc(c.blurb)}</span><span class="tmeta mb">${cnt}${sec?' · '+sec:''}${c.hidden?' · Hidden':''}</span></span><span class="dk num">${cnt}</span><span class="dk tmeta">${sec||'None'}</span><span class="dk tstat">${c.hidden?pill('Hidden','warn'):k||c.cover?pill('Live','ok'):pill('Empty','off')}</span>${mv('collections',i,n)}</div>`; };
  return {title:'Collections',acts:'<button class="btn sm" data-a="new-coll">Add collection</button>',body:`
    ${tbl('t-coll',[[''],['Collection'],['Designs'],['Home section'],['Status'],['Order']],DATA.collections.map(row).join(''),'No collections yet.')}
    <p class="hint">Collections group designs on the website. Empty ones stay hidden from customers until they have a design or a cover.</p>`};
},
offers(){ const n=DATA.offers.length;
  const row=(o,i)=>`<div class="trow" data-a="edit" data-v="offer:${i}"><span class="tmain"><button class="tname">${esc(o.title||'Untitled offer')}</button><span class="tmeta dk">${esc(o.desc)}</span><span class="tmeta mb">${esc(o.discount||'No discount set')}${o.validUntil?' · until '+fmtDate(o.validUntil):''}${o.active===false?' · Off':''}</span></span><span class="dk">${esc(o.discount)||'<span class="tmeta">Not set</span>'}</span><span class="dk">${o.validUntil?fmtDate(o.validUntil):'<span class="tmeta">No end date</span>'}</span><span class="dk tstat">${o.active===false?pill('Off','off'):pill('Live','ok')}</span>${mv('offers',i,n)}</div>`;
  return {title:'Offers',acts:'<button class="btn sm" data-a="new-offer">Add offer</button>',body:`
    ${tbl('t-off',[['Offer'],['Discount'],['Valid until'],['Status'],['Order']],DATA.offers.map(row).join(''),'No offers yet.')}
    <p class="hint">Offers show on the home page, the Offers page and the custom order form.</p>`};
},
shop(){ bo=SITE; return {title:'Shop details',body:`
  ${pn('Contact',`<div class="fgrid">${fld('WhatsApp number','wa',{ph:'919876543210',hint:'Digits only, with country code. Turns on the Send on WhatsApp buttons.'})}${fld('WhatsApp number as shown','waShow',{ph:'+91 98765 43210'})}${fld('Instagram username','ig')}${fld('Opening hours','hours',{ph:'Mon to Sat, 10 am to 7 pm'})}${fld('Studio address','address',{area:1})}</div>`,'Shown on the Contact page and in the footer.')}
  ${pn('Top banner',`<div class="fgrid">${fld('Message at the top of every page','announce',{full:1})}</div>`)}
  ${pn('Styling tips',`<label class="check"><input type="checkbox" data-k="tipsOn" data-t="bool"${SITE.tipsOn!==false?' checked':''}>Show the Styling tips section on the website</label>
    <div class="tipadd"><div class="field"><label for="tipNew">Paste an Instagram link</label><input id="tipNew" inputmode="url" placeholder="https://www.instagram.com/reel/..."></div><button class="btn sm" data-a="tip-add">Add</button></div>
    <span class="hint">In Instagram, open the post or reel, tap Share, then Copy link. Up to 12.</span>
    ${(SITE.tips||[]).length?`<div class="tiplist">${SITE.tips.map((u,i)=>`<div class="tiprow"><span class="tipno">${i+1}</span><input data-tip="${i}" value="${esc(u)}" aria-label="Instagram link ${i+1}"><button class="mini" data-a="tip-rm" data-v="${i}">Remove</button></div>`).join('')}</div>`:'<p class="tempty">No posts added yet.</p>'}`,'Shown on the home page as a Styling tips row, in this order. Untick the box to hide the section without losing your links.')}
  ${pn('About page',`<div class="fgrid">${fld('Her story','story',{area:1,hint:'Leave an empty line between paragraphs.'})}${fld('Quote shown under the story','quote',{area:1})}${fld('Specialities','specialities',{area:1,t:'lines',hint:'One speciality per line.'})}${fld('My USP','usp',{area:1})}${fld('My vision','vision',{area:1})}<div class="field"><label>Portrait photo</label>${onePhoto('portrait')}<span class="hint">The large photo on the About and home pages.</span></div><div class="field"><label>Small round photo</label>${onePhoto('avatar')}<span class="hint">Her face, shown beside each design and on the custom order note. Uses the portrait if empty.</span></div></div>`,'Leave a box empty to hide that part of the About page.')}
  ${pn('Ordering',`<div class="fgrid">${fld('Usual stitching time (days)','leadDays',{t:'num',ph:'For example 10',hint:'Shown on every design, in the cart and at checkout. A design can have its own time in Designs.'})}${fld('UPI ID for payments','upi',{ph:'For example name@okhdfcbank',hint:'Turns on the payment step at checkout, with a QR code and a pay button.'})}${fld('Name shown to the payer','upiName',{ph:'Sreez The Dress Maker'})}${fld('Advance to collect (%)','advancePct',{t:'num',ph:'50',hint:'Share of the order total asked at checkout. Use 100 for full payment. Empty means 50.'})}${fld('Payment','payment',{area:1,ph:'Payment methods and advance'})}${fld('Order alert key','notifyKey',{ph:'Access key from web3forms.com',hint:'Emails you each time an order is placed on the website. Get a free access key at web3forms.com with the email that should receive the alerts, and paste it here.'})}${fld('WhatsApp alert number','waAlertTo',{ph:'919876543210',hint:'Digits only, with country code. The WhatsApp number that gets a message for each order.'})}${fld('WhatsApp alert key','waAlertKey',{ph:'Key from CallMeBot',hint:'From that WhatsApp number, message the CallMeBot bot to get a key (steps at callmebot.com), and paste it here.'})}</div>`,'What customers are told when they buy. Payment is asked only when every design in the cart has a price.')}
  ${pn('Help page',`<div class="fgrid">${fld('Size chart','sizeChart',{area:1,ph:'S: bust 34, waist 28, hip 36 ...'})}${fld('Delivery','delivery',{area:1,ph:'Stitching time, shipping areas and charges'})}${fld('Alterations and returns','alterations',{area:1})}</div>`)}
  ${pn('Offers page',`<div class="fgrid">${fld('Offer terms','offerTerms',{area:1})}<div class="field full"><label>Banner photo</label>${onePhoto('offerBanner')}</div></div>`)}`}; },
insights(){ return {title:'Insights',body:insightsHTML()}; }
};
const onePhoto=k=>`<div class="onephoto">${SITE[k]?`<img src="${esc(imgSrc(SITE[k]))}" alt=""><button class="mini danger" data-a="site-photo-rm" data-v="${k}">Remove</button>`:''}<label class="mini up">${SITE[k]?'Replace':'Upload photo'}<input type="file" accept="image/*" data-up="site:${k}" hidden></label></div>`;
const oUpdMsg=o=>`Hi ${o.customer||''}, your order #${o.no} with Sreez The Dress Maker is now: ${o.status}.${o.due?' Expected by '+fmtDate(o.due)+'.':''}${oBal(o)?' Balance to pay: '+inr(oBal(o))+'.':''}`;
function editPage(){
  const k=aEdit.kind, o=aEdit.obj; bo=o;
  const acts='<button class="mini danger" data-a="del">Delete</button><button class="btn sm" data-a="back">Done</button>';
  const vis=extra=>pn('Visibility',`<div class="checks col">${extra||''}${chk('Hide from the website','hidden')}</div>`);
  if(k==='product') return {title:'Edit design',acts,body:`<div class="egrid"><div class="ecol">
    ${pn('Photos',`<div class="photos">${o.imgs.map((im,i)=>`<div class="photo"><img src="${esc(imgSrc(im))}" alt="Photo ${i+1}"><div class="pbar"><button data-a="ph" data-v="${i}:-1"${i===0?' disabled':''} aria-label="Move earlier">←</button><button data-a="ph" data-v="${i}:0" aria-label="Remove photo">✕</button><button data-a="ph" data-v="${i}:1"${i===o.imgs.length-1?' disabled':''} aria-label="Move later">→</button></div></div>`).join('')}
      <label class="photo add">${busy==='up'?'Uploading…':'Add photos'}<input type="file" accept="image/*" multiple data-up="product" hidden></label></div>`,'The first photo is the main one. Customers swipe through the rest.')}
    ${pn('Details',`<div class="fgrid">${fld('Name','name',{full:1})}${fld('Short tag','tag',{ph:'Aari work · Zari border',full:1})}${fld('Description','desc',{area:1})}${fld('Fabric and care','fabric',{area:1})}</div>`)}
    </div><div class="ecol eside">
    ${pn('Price and offer',`<div class="fgrid">${fld('Price (₹)','price',{t:'num',ph:'Blank = on request'})}${fld('Offer price (₹)','offerPrice',{t:'num',ph:'Optional'})}${fld('Stitching time (days)','days',{t:'num',ph:'Blank = usual time',full:1})}</div><p class="hint">Customers see: <span id="pPrev">${priceHTML(o)}</span></p>`,'An offer price lower than the price shows the old price struck through.')}
    ${vis(chk('Show in Trending picks','trend'))}
    ${pn('Sizes',fld('Sizes offered','sizes',{opts:[['std','XS to XXL, or custom measurements'],['custom','Custom measurements only']]}))}
    ${pn('Collections',`<div class="checks col">${DATA.collections.map(c=>`<label class="check"><input type="checkbox" data-pc="${c.id}"${o.c.includes(c.id)?' checked':''}>${esc(c.name)}</label>`).join('')}</div>`)}
    </div></div>`};
  if(k==='coll'){ const pics=[...new Set(DATA.products.filter(p=>p.c.includes(o.id)).flatMap(p=>p.imgs))]; return {title:'Edit collection',acts,body:`<div class="egrid"><div class="ecol">
    ${pn('Details',`<div class="fgrid">${fld('Name','name',{full:1})}${fld('Short description','blurb',{area:1})}</div>`)}
    ${pn('Cover photo',`<div class="photos">${o.cover&&!pics.includes(o.cover)?`<button class="photo sel" data-a="cover" data-v="${esc(o.cover)}"><img src="${esc(imgSrc(o.cover))}" alt="Current cover"></button>`:''}${pics.map(im=>`<button class="photo${o.cover===im?' sel':''}" data-a="cover" data-v="${esc(im)}" aria-pressed="${o.cover===im}"><img src="${esc(imgSrc(im))}" alt="Use as cover"></button>`).join('')}
      <label class="photo add">${busy==='up'?'Uploading…':'Upload cover'}<input type="file" accept="image/*" data-up="cover" hidden></label></div>${o.cover?'<div><button class="mini" data-a="cover" data-v="">Remove cover</button></div>':''}`,'Tap a photo to use it as the cover. A cover puts this collection in the big slider at the top of the home page.')}
    </div><div class="ecol eside">
    ${pn('Home page',fld('Section on the home page','group',{opts:[['','None'],['bridal','The bridal edit'],['more','More to explore']]}))}
    ${vis()}</div></div>`}; }
  if(k==='offer') return {title:'Edit offer',acts,body:`<div class="egrid"><div class="ecol">
    ${pn('Offer',`<div class="fgrid">${fld('Title','title')}${fld('Label','tag',{ph:'Festive'})}${fld('Description','desc',{area:1})}${fld('Discount','discount',{ph:'10% off, or ₹500 off'})}${fld('Valid until','validUntil',{type:'date'})}</div>`)}
    </div><div class="ecol eside">${pn('Visibility',`<div class="checks col"><label class="check"><input type="checkbox" data-k="active" data-t="bool"${o.active!==false?' checked':''}>Show on the website</label></div>`)}</div></div>`};
  /* order */
  return {title:'Order #'+o.no,acts:`${o.id?'<button class="mini danger" data-a="del">Delete</button>':''}<button class="btn sm" data-a="save-order">${busy==='ord'?'Saving…':'Save order'}</button>`,body:`<div class="egrid"><div class="ecol">
    ${pn('Customer',`<div class="fgrid">${fld('Customer name','customer')}${fld('Phone','phone',{ph:'919876543210',hint:'With country code, for WhatsApp updates.'})}${fld('Came from','channel',{opts:['WhatsApp','Instagram','Walk-in','Phone','Other']})}</div>`)}
    ${pn('Items',`<div class="oitems"><div class="oitem oh"><span>Design or garment</span><span>Size</span><span>Price (₹)</span><span></span></div>${o.items.map((it,i)=>`<div class="oitem"><input list="plist" data-oi="${i}:name" value="${esc(it.name)}" placeholder="Design or garment" aria-label="Item"><input data-oi="${i}:size" value="${esc(it.size)}" placeholder="Size" aria-label="Size"><input data-oi="${i}:price" value="${it.price||''}" inputmode="decimal" placeholder="0" aria-label="Price"><button class="mini" data-a="rm-item" data-v="${i}" aria-label="Remove item">✕</button></div>`).join('')}</div>
      <datalist id="plist">${DATA.products.map(p=>`<option value="${esc(p.name)}">`).join('')}</datalist><div><button class="mini" data-a="add-item">Add item</button></div>`)}
    ${pn('Measurements and notes',`<div class="fgrid">${fld('Measurements','measurements',{area:1})}${fld('Notes','notes',{area:1})}</div>`)}
    </div><div class="ecol eside">
    ${pn('Status',`<div class="fgrid">${fld('Stage','status',{opts:STATUS})}${fld('Needed by','due',{type:'date'})}</div>`)}
    ${pn('Payment',`<div class="fgrid">${fld('Discount (₹)','discount',{t:'num'})}${fld('Advance paid (₹)','advance',{t:'num'})}</div><dl class="sums" id="oSum"></dl>`)}
    ${pn('Update for the customer',`<textarea id="oUpd" readonly aria-label="Status message">${esc(oUpdMsg(o))}</textarea><div class="btns"><button class="mini" data-copy="oUpd">Copy message</button><a class="mini" id="oWa" href="#" rel="noopener"${o.phone?'':' hidden'}>Send on WhatsApp</a></div>`,'A ready message with the stage, date and balance.')}
    </div></div>
    <div><button class="btn" data-a="save-order">${busy==='ord'?'Saving…':'Save order'}</button></div>`};
}
function insightsHTML(){
  if(ORD===null) return '<p class="empty">Loading orders…</p>';
  const live=ORD.filter(o=>o.status!=='Cancelled'), open=ORD.filter(o=>OPEN(o.status)), t=today(), mon=t.slice(0,7);
  const wk=new Date(Date.now()+7*864e5).toISOString().slice(0,10);
  const thisM=live.filter(o=>(o.createdAt||'').slice(0,7)===mon);
  const sum=(a,f)=>a.reduce((s,o)=>s+f(o),0);
  const tally=(pairs)=>{ const m={}; pairs.forEach(([k,v])=>{ if(k) m[k]=(m[k]||0)+v; }); return Object.entries(m).sort((a,b)=>b[1]-a[1]); };
  const bars=(rows,fmt)=>{ const mx=Math.max(1,...rows.map(r=>r[1])); return rows.length?`<div class="bars">${rows.map(r=>`<div class="barrow" title="${esc(r[0])}: ${fmt?fmt(r[1]):r[1]}"><span class="bl">${esc(r[0])}</span><span class="bt">${r[1]?`<span class="ibar" style="width:${Math.max(1,r[1]/mx*100)}%"></span>`:''}</span><span class="n">${fmt?fmt(r[1]):r[1]}</span></div>`).join('')}</div>`:'<p class="hint">Nothing to show yet.</p>'; };
  const months=[]; for(let i=5;i>=0;i--){ const d=new Date(); d.setDate(1); d.setMonth(d.getMonth()-i); months.push(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')); }
  const mLabel=m=>new Date(m+'-01T00:00:00').toLocaleDateString('en-IN',{month:'short',year:'2-digit'});
  const items=live.flatMap(o=>o.items||[]);
  const byColl=tally(items.flatMap(i=>{ const p=DATA.products.find(p=>p.id===i.pid||p.name===i.name); return p?p.c.map(c=>[(DATA.collections.find(x=>x.id===c)||{}).name,1]):[['Custom orders',1]]; }));
  const cat=DATA.products, noPrice=cat.filter(p=>!p.price).length, fewPh=cat.filter(p=>p.imgs.length<2).length;
  return `${ordErr?`<p class="warnbox">${esc(ordErr)}</p>`:''}
  <div class="kpis">
    <div class="kpi"><b>${open.length}</b><span>Open orders</span></div>
    <div class="kpi"><b>${open.filter(o=>o.due&&o.due<=wk).length}</b><span>Due in the next 7 days${open.some(o=>o.due&&o.due<t)?', '+open.filter(o=>o.due&&o.due<t).length+' overdue':''}</span></div>
    <div class="kpi"><b>${inr(sum(thisM,oTotal))}</b><span>Order value this month, ${thisM.length} ${thisM.length===1?'order':'orders'}</span></div>
    <div class="kpi"><b>${inr(sum(open,oBal))}</b><span>Balance to collect on open orders</span></div>
  </div>
  <div class="igrid">
    <div class="box"><div class="label">Orders by stage</div>${bars(STATUS.map(s=>[s,ORD.filter(o=>o.status===s).length]).filter(r=>r[1]))}</div>
    <div class="box"><div class="label">Order value by month</div>${bars(months.map(m=>[mLabel(m),sum(live.filter(o=>(o.createdAt||'').slice(0,7)===m),oTotal)]),inr)}</div>
    <div class="box"><div class="label">Most ordered designs</div>${bars(tally(items.map(i=>[i.name,1])).slice(0,6))}</div>
    <div class="box"><div class="label">Orders by collection</div>${bars(byColl.slice(0,6))}</div>
    <div class="box"><div class="label">Where orders come from</div>${bars(tally(live.map(o=>[o.channel||'Other',1])))}</div>
    <div class="box"><div class="label">Website catalogue</div>${bars([['Designs on the website',cat.filter(p=>!p.hidden).length],['Without a price',noPrice],['Without a stitching time',cat.filter(p=>!lead(p)).length],['With fewer than 2 photos',fewPh],['Hidden designs',cat.filter(p=>p.hidden).length]])}</div>
  </div>
  <p class="hint">These figures come from the orders you record here. Cancelled orders are left out of the money totals. Website visitor counts are not available.</p>`;
}
function oSum(){ const e=$('oSum'); if(!e||!aEdit||aEdit.kind!=='order') return; const o=aEdit.obj, sub=(o.items||[]).reduce((s,i)=>s+(Number(i.price)||0),0);
  e.innerHTML=`<dt>Items</dt><dd>${inr(sub)}</dd><dt>Discount</dt><dd>${inr(o.discount)}</dd><dt>Total</dt><dd>${inr(oTotal(o))}</dd><dt>Advance paid</dt><dd>${inr(o.advance)}</dd><dt class="big">Balance</dt><dd class="big">${inr(oBal(o))}</dd>`;
  const u=$('oUpd'), w=$('oWa'), ph=String(o.phone||'').replace(/\D/g,''); if(u) u.value=oUpdMsg(o); if(w){ w.hidden=!ph; w.href=waLink(oUpdMsg(o),ph); } }
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'collection';
async function adminAct(a,v,el){
  if(a==='tab'){ aTab=v; aEdit=null; pasteOpen=false; }
  else if(a==='back'){ aEdit=null; }
  else if(a==='ofilter') oFilter=v;
  else if(a==='paste') pasteOpen=!pasteOpen;
  else if(a==='paste-read'){ const t=$('pasteTa').value.trim(); if(!t) return toast('Paste the customer message first.'); aEdit={kind:'order',obj:parseEnquiry(t)}; pasteOpen=false; }
  else if(a==='new-order'){ const o=newOrder(); o.items.push({pid:'',name:'',size:'',price:0}); aEdit={kind:'order',obj:o}; }
  else if(a==='add-item') aEdit.obj.items.push({pid:'',name:'',size:'',price:0});
  else if(a==='rm-item') aEdit.obj.items.splice(+v,1);
  else if(a==='tip-add'){ const u=$('tipNew').value.trim(); if(!Array.isArray(SITE.tips)) SITE.tips=[];
    if(!/instagram\.com\/(?:[\w.]+\/)?(p|reel|reels|tv)\/[\w-]+/i.test(u)) return toast('That is not an Instagram post or reel link. Copy the link from the Share menu of the post.');
    if(SITE.tips.length>=12) return toast('You can show up to 12 posts. Remove one first.');
    if(SITE.tips.includes(u)) return toast('That post is already in the list.');
    SITE.tips.unshift(u); markDirty(); }
  else if(a==='tip-rm'){ SITE.tips.splice(+v,1); markDirty(); }
  else if(a==='save-order'){ if(busy) return; const o=aEdit.obj; if(!o.customer.trim()) return toast('Add the customer name first.'); if(!cap.db) return toast('Orders cannot be saved in this view.');
    o.items=o.items.filter(i=>i.name.trim()); o.items.forEach(i=>{ const p=DATA.products.find(p=>p.name===i.name); i.pid=p?p.id:''; i.price=Number(i.price)||0; });
    o.updatedAt=new Date().toISOString(); const d=Object.assign({},o); delete d.id; busy='ord';
    try{ const col=cap.db.collection('orders'); await (o.id?col.doc(o.id):col.doc()).set(d); aEdit=null; toast('Order #'+o.no+' saved.'); }catch(e){ toast('The order could not be saved. Try again.'); } busy=''; }
  else if(a==='edit'){ const i=v.indexOf(':'), k=v.slice(0,i), id=v.slice(i+1);
    if(k==='product') aEdit={kind:k,obj:DATA.products.find(p=>p.id===id)}; else if(k==='coll') aEdit={kind:k,obj:DATA.collections.find(c=>c.id===id)};
    else if(k==='offer') aEdit={kind:k,obj:DATA.offers[+id]}; else { const o=ORD.find(o=>o.id===id); aEdit={kind:k,obj:JSON.parse(JSON.stringify(o))}; }
    if(!aEdit.obj) aEdit=null; }
  else if(a==='new-product'){ const p={id:'p'+Date.now().toString(36),name:'New design',c:[],imgs:[],tag:'',sizes:'std',desc:'',price:null,offerPrice:null,fabric:'',hidden:true,trend:false}; DATA.products.unshift(p); aEdit={kind:'product',obj:p}; markDirty(); toast('New designs start hidden. Untick Hide when it is ready.'); }
  else if(a==='new-coll'){ let id=slug('new-collection'), n=1; while(DATA.collections.some(c=>c.id===id)) id='new-collection-'+(++n); const c={id,name:'New collection',cover:null,blurb:'',group:'',hidden:false}; DATA.collections.push(c); aEdit={kind:'coll',obj:c}; markDirty(); }
  else if(a==='new-offer'){ const o={tag:'',title:'New offer',desc:'',discount:'',validUntil:'',active:false}; DATA.offers.push(o); aEdit={kind:'offer',obj:o}; markDirty(); }
  else if(a==='move'){ const [k,i,d]=v.split(':'), arr=DATA[k], j=+i+ +d; if(j<0||j>=arr.length) return; const x=arr.splice(+i,1)[0]; arr.splice(j,0,x); markDirty(); }
  else if(a==='ph'){ const [i,d]=v.split(':').map(Number), im=aEdit.obj.imgs; if(d===0) im.splice(i,1); else { const x=im.splice(i,1)[0]; im.splice(i+d,0,x); } markDirty(); }
  else if(a==='cover'){ aEdit.obj.cover=v||null; markDirty(); }
  else if(a==='site-photo-rm'){ SITE[v]=''; markDirty(); }
  else if(a==='del'){ if(el.dataset.sure!=='1'){ const l=el.textContent; el.dataset.sure='1'; el.textContent='Tap again to delete'; setTimeout(()=>{ if(el.isConnected){ el.dataset.sure=''; el.textContent=l; } },4000); return; }
    const k=aEdit.kind, o=aEdit.obj;
    if(k==='order'){ try{ await cap.db.collection('orders').doc(o.id).delete(); toast('Order deleted.'); }catch(e){ return toast('The order could not be deleted.'); } }
    else { if(k==='product') DATA.products.splice(DATA.products.indexOf(o),1);
      else if(k==='coll'){ DATA.collections.splice(DATA.collections.indexOf(o),1); DATA.products.forEach(p=>p.c=p.c.filter(c=>c!==o.id)); }
      else DATA.offers.splice(DATA.offers.indexOf(o),1); markDirty(); }
    aEdit=null; }
  else if(a==='publish') return publishSite();
  else if(a==='discard'){ try{ sessionStorage.removeItem('sreezDraft'); }catch(e){} location.reload(); return; }
  renderAdmin(); oSum(); if(a==='tab'||a==='edit'||a==='back'||a.startsWith('new-')||a==='paste-read') window.scrollTo(0,0);
}
document.addEventListener('input',e=>{ const el=e.target;
  if(el.dataset.q&&isAdmin){ if(el.dataset.q==='pSearch') pSearch=el.value; else oSearch=el.value; renderAdmin(); const s=$(el.id); if(s){ s.focus(); try{ s.setSelectionRange(s.value.length,s.value.length); }catch(e){} } return; }
  if(!isAdmin||!onManage()) return;
  if('tip' in el.dataset){ SITE.tips[+el.dataset.tip]=el.value.trim(); markDirty(); return; }
  if(el.dataset.k&&bo){ const t=el.dataset.t; bo[el.dataset.k]=t==='bool'?el.checked:t==='lines'?el.value.split('\n').map(x=>x.trim()).filter(Boolean):t==='num'?(el.value.trim()===''?null:(Number(el.value.replace(/[^\d.]/g,''))||0)):el.value;
    if(el.dataset.k==='wa') bo.wa=el.value.replace(/\D/g,'');
    if(aEdit&&aEdit.kind==='order') oSum(); else { markDirty(); const pv=$('pPrev'); if(pv&&aEdit) pv.innerHTML=priceHTML(aEdit.obj); } }
  else if(el.dataset.oi){ const [i,k]=el.dataset.oi.split(':'), it=aEdit.obj.items[+i]; it[k]=k==='price'?(Number(el.value.replace(/[^\d.]/g,''))||0):el.value;
    if(k==='name'){ const p=DATA.products.find(p=>p.name===el.value); if(p&&!it.price){ it.price=p.offerPrice||p.price||0; const pe=el.parentNode.querySelector('[data-oi$=":price"]'); if(pe) pe.value=it.price||''; } } oSum(); }
  else if(el.dataset.pc){ const c=aEdit.obj.c, id=el.dataset.pc; if(el.checked){ if(!c.includes(id)) c.push(id); } else c.splice(c.indexOf(id),1); markDirty(); }
});
document.addEventListener('change',async e=>{ const el=e.target;
  if(el.dataset&&el.dataset.f&&isAdmin){ if(el.dataset.f==='oFilter') oFilter=el.value; else pColl=el.value; renderAdmin(); return; }
  if(!el.dataset||!el.dataset.up||!el.files||!el.files.length) return;
  const kind=el.dataset.up, files=[...el.files]; busy='up'; renderAdmin(); const refs=await storeImages(files); busy='';
  if(refs.length){ if(kind==='product'&&aEdit) aEdit.obj.imgs.push(...refs); else if(kind==='cover'&&aEdit) aEdit.obj.cover=refs[0]; else if(kind.startsWith('site:')) SITE[kind.slice(5)]=refs[0]; markDirty(); }
  if(onManage()){ renderAdmin(); oSum(); } });

document.addEventListener('click',e=>{
  const ad=e.target.closest('[data-a]'); if(ad&&isAdmin){ adminAct(ad.dataset.a,ad.dataset.v,ad); return; }
  const t=e.target.closest('[data-cnav],#searchBtn,#showMore,[data-tab],[data-s],[data-rm],[data-img],[data-zoom],[data-custom],[data-offer],#lbClose,#lbPrev,#lbNext,#lbImg,[data-copy],[data-close],#menuBtn,#bagBtn,#bagTab,#pAdd,#pBuy,#ckDone,#scrim');
  if(!t) return;
  if(t.dataset.cnav){ const g=t.parentNode.querySelector('.cgal'), n=g.children.length, i=(Math.round(g.scrollLeft/g.clientWidth)+ +t.dataset.cnav+n)%n; g.scrollTo({left:i*g.clientWidth,behavior:'smooth'}); }
  else if(t.id==='searchBtn') toggleSearch($('searchBar').hidden);
  else if(t.id==='showMore'){ $('newGrid').classList.remove('less'); t.parentNode.remove(); }
  else if(t.dataset.tab){ homeTab=t.dataset.tab; renderHomeTab(); }
  else if(t.dataset.s){ pick=t.dataset.s; renderSizes(); }
  else if(t.dataset.rm){ bag.splice(+t.dataset.rm,1); saveBag(); renderBag(); }
  else if(t.dataset.img){ const g=$('gal'); g.scrollTo({left:+t.dataset.img*g.clientWidth,behavior:'smooth'}); }
  else if(t.dataset.zoom){ const all=[...t.closest('[data-zset]').querySelectorAll('[data-zoom]')]; openLB(all.map(x=>x.dataset.zoom),all.indexOf(t)); }
  else if(t.dataset.custom){ const p=prod(t.dataset.custom), c=pcoll(p); draft={design:p.name,type:c?c.name:''}; location.hash='custom-order'; }
  else if(t.dataset.offer){ draft={offer:t.dataset.offer}; location.hash='custom-order'; }
  else if(t.id==='lbClose') closeLB();
  else if(t.id==='lbPrev') stepLB(-1);
  else if(t.id==='lbNext') stepLB(1);
  else if(t.id==='lbImg') t.classList.toggle('z');
  else if(t.dataset.copy) copyFrom(t);
  else if(t.id==='menuBtn') openSheet('menuSheet');
  else if(t.id==='bagBtn'||t.id==='bagTab'){ renderBag(); openSheet('bagSheet'); }
  else if(t.id==='pAdd'){ if(!bag.some(b=>b.id===cur.id&&b.size===pick)){ bag.push({id:cur.id,size:pick}); saveBag(); } renderBag(); openSheet('bagSheet'); }
  else if(t.id==='pBuy'){ if(!bag.some(b=>b.id===cur.id&&b.size===pick)){ bag.push({id:cur.id,size:pick}); saveBag(); } renderBag(); location.hash='checkout'; }
  else if(t.id==='ckDone'){ bag=[]; saveBag(); renderBag(); location.hash='home'; }
  else closeSheets();
});
/* tell the owner by email that an order arrived; details stay in Manage shop */
const alertOwner=(name,items,extra)=>{ const body=['Customer: '+name].concat(items.map(x=>'- '+x),extra?['',extra]:[],['','Open Manage shop to see the phone number and details:',location.origin+'/#manage']);
  SB.notify((SITE.notifyKey||'').trim(),'New order on the website from '+name,['A new order was placed on sreezthedressmaker.com.',''].concat(body).join('\n'));
  SB.notifyWa(SITE.waAlertTo||SITE.wa,(SITE.waAlertKey||'').trim(),['*New order on the website*'].concat(body).join('\n')); };
/* advance asked at checkout: a share of the total, only when the shop has a UPI ID and every item has a price */
const advPct=()=>{ const n=Number(SITE.advancePct); return n>0?Math.min(100,Math.round(n)):50; };
const advDue=()=>{ const x=bagTotal(); return SITE.upi&&x.t&&!x.open?Math.ceil(x.t*advPct()/100):0; };
const upiLink=amt=>'upi://pay?pa='+encodeURIComponent(SITE.upi.trim())+'&pn='+encodeURIComponent(SITE.upiName||'Sreez The Dress Maker')+'&am='+amt+'.00&cu=INR&tn='+encodeURIComponent('Sreez order advance');
let ckv=null, qrLib=null;
const loadQr=()=>qrLib||(qrLib=new Promise((res,rej)=>{ const e=document.createElement('script'); e.src='qr.js'; e.onload=res; e.onerror=()=>{ qrLib=null; rej(); }; document.head.appendChild(e); }));
function payStep(){
  const amt=advDue(), tot=bagTotal().t, full=advPct()>=100;
  $('view').innerHTML=`<div class="sent"><div><span class="eyebrow">Payment</span><h1 style="margin-top:4px">${full?'Pay for your order':'Pay the advance'}</h1><p class="lede">${full?`Pay ${inr(amt)} by UPI to confirm your order.`:`Pay ${inr(amt)} now by UPI, which is ${advPct()}% of ${inr(tot)}, to confirm your order. The balance is paid at delivery.`}</p></div>
    <div class="box paybox"><div class="payqr" id="payQr" role="img" aria-label="UPI payment code"></div>
      <div class="payinfo"><div class="payamt">${inr(amt)}</div><div class="payto">to ${esc(SITE.upiName||'Sreez The Dress Maker')}</div><div class="payid"><code id="payId">${esc(SITE.upi.trim())}</code><button class="mini" id="payCopy" type="button">Copy</button></div>
        <a class="btn block" href="${esc(upiLink(amt))}">Pay with a UPI app</a><p class="hint">On a phone, tap the button. On a computer, scan the code with GPay, PhonePe, Paytm or any UPI app.</p></div></div>
    <div class="box"><div class="field full"><label for="payRef">UPI reference number (optional)</label><input id="payRef" inputmode="numeric" maxlength="24" placeholder="The number shown after you pay"><span class="hint">Sreez checks the payment on her side and then confirms your order.</span></div></div>
    <div class="btns"><button class="btn" id="payDone" type="button">I have paid, place my order</button><button class="btn ghost" id="payLater" type="button">Place order and pay later</button></div>
    <a class="hint" href="#checkout" id="payBack">‹ Change my details</a></div>`;
  window.scrollTo(0,0);
  loadQr().then(()=>{ const q=qrcode(0,'M'); q.addData(upiLink(amt)); q.make(); if($('payQr')) $('payQr').innerHTML=q.createSvgTag({cellSize:4,margin:2,scalable:true}); }).catch(()=>{ if($('payQr')) $('payQr').hidden=true; });
}
document.addEventListener('click',e=>{ const t=e.target.closest('#payDone,#payLater,#payCopy'); if(!t) return;
  if(t.id==='payCopy'){ const v=$('payId').textContent; (navigator.clipboard?navigator.clipboard.writeText(v):Promise.reject()).then(()=>toast('UPI ID copied.'),()=>toast('Copy this UPI ID: '+v)); return; }
  if(t.disabled) return; t.disabled=true; t.textContent='Placing your order…';
  placeOrder(t.id==='payDone'?{paid:true,ref:$('payRef').value.replace(/[^\w-]/g,'').slice(0,24)}:{paid:false}); });
async function placeOrder(pay){
  if($('ckForm')){ ckv={}; ['ckName','ckPhone','ckDel','ckAddr','ckDate','ckNotes'].forEach(k=>ckv[k]=$(k)?$(k).value.trim():''); }
  if(!ckv||!bag.length){ location.hash='checkout'; return; }
  const val=id=>ckv[id]||'', L=bagLead(), del=val('ckDel');
  if(del.startsWith('Deliver')&&!val('ckAddr')){ $('ckAddr').focus(); return toast('Add your delivery address, or choose Collect from the studio.'); }
  const due=advDue();
  if(due&&!pay) return payStep();
  const payLine=!due?'':pay.paid?`Payment: customer says ${inr(due)} was paid by UPI${pay.ref?', reference '+pay.ref:''}. Please check before confirming.`:`Payment: not paid yet. Advance to collect: ${inr(due)}.`;
  const lines=[`Hi Sreez, this is ${val('ckName')}. I would like to place an order:`].concat(bag.map((b,i)=>`${i+1}. ${prod(b.id).name} (${b.size})${effPrice(prod(b.id))?' - '+inr(effPrice(prod(b.id))):''}`));
  lines.push(`Phone: ${val('ckPhone')}`,`Delivery: ${del}`);
  if(val('ckAddr')) lines.push(`Address: ${val('ckAddr').replace(/\s*\n\s*/g,', ')}`);
  if(val('ckDate')) lines.push(`Needed by: ${val('ckDate')}`);
  if(val('ckNotes')) lines.push(`Notes: ${val('ckNotes').replace(/\s*\n\s*/g,' ')}`);
  lines.push(`Estimated total: ${totTxt()}`);
  if(payLine) lines.push(payLine);
  const msg=lines.join('\n');
  const steps=`<ol class="steps"><li><b>Sreez confirms</b><span>She checks the design, your size and the date, and shares the final price.</span></li><li><b>${due&&pay.paid?'Advance checked':'Pay the advance'}</b><span>${due&&pay.paid?'She checks your UPI payment of '+inr(due)+'.':SITE.payment?nl(SITE.payment):'She tells you how much to pay in advance and how.'}</span></li><li><b>Stitching${L?', about '+dayTxt(L):''}</b><span>Your piece is cut and stitched to your measurements.</span></li><li><b>Fitting and delivery</b><span>Final adjustments, then pickup or delivery.</span></li></ol>`;
  let placed=false;
  if(SB.on){ const go=document.querySelector('#ckForm [type=submit]'); if(go){ if(go.disabled) return; go.disabled=true; go.textContent='Placing your order…'; }
    const note=[`Delivery: ${del}`]; if(val('ckAddr')) note.push('Address: '+val('ckAddr').replace(/\s*\n\s*/g,', ')); if(val('ckNotes')) note.push('Notes: '+val('ckNotes')); if(payLine) note.push(payLine);
    try{ await SB.createOrder({createdAt:new Date().toISOString(),customer:val('ckName').slice(0,80),phone:val('ckPhone').replace(/[^\d+]/g,'').slice(0,20),channel:'Website',status:'New',
        items:bag.slice(0,30).map(b=>({pid:b.id,name:prod(b.id).name,size:b.size,price:effPrice(prod(b.id))})),due:/^\d{4}-\d{2}-\d{2}$/.test(val('ckDate'))?val('ckDate'):'',discount:0,advance:0,measurements:'',notes:note.join('\n').slice(0,1500)});
      placed=true; alertOwner(val('ckName'),bag.map(b=>prod(b.id).name+' ('+b.size+')'),totTxt()+(payLine?'\n'+payLine:'')); }catch(e){} }
  if(placed){ bag=[]; saveBag(); renderBag();
    $('view').innerHTML=`<div class="sent"><div><span class="eyebrow">Thank you</span><h1 style="margin-top:4px">Your order has reached Sreez</h1><p class="lede">Sreez will contact you on ${esc(val('ckPhone'))} to confirm the price${L?'. Stitching takes about '+dayTxt(L)+' after your measurements are confirmed':' and the stitching time'}.</p></div>
    <div class="box"><div class="label">Your order</div><textarea id="ckMsg" readonly style="min-height:190px">${esc(msg)}</textarea><p class="hint" style="margin:10px 0 0">Want a quicker reply? You can also send this to Sreez yourself.</p>${sendHTML('ckMsg',msg)}</div>
    ${steps}
    <div class="btns"><a class="btn" href="#shop">Keep shopping</a></div></div>`; }
  else $('view').innerHTML=`<div class="sent"><div><span class="eyebrow">Last step</span><h1 style="margin-top:4px">Send your order to Sreez</h1><p class="lede">Your order is ready. Send this message so Sreez receives it. She replies to confirm the price${L?', and stitching takes about '+dayTxt(L)+' after your measurements are confirmed':' and the stitching time'}.</p></div>
    <div class="box"><div class="label">Your order</div><textarea id="ckMsg" readonly style="min-height:190px">${esc(msg)}</textarea>${sendHTML('ckMsg',msg)}</div>
    ${steps}
    <div class="btns"><button class="btn" id="ckDone">I have sent it</button><a class="btn ghost" href="#checkout">Change my details</a></div></div>`;
  window.scrollTo(0,0);
}
document.addEventListener('submit',async e=>{
  if(e.target.id==='ckForm'){ e.preventDefault(); placeOrder(); return; }
  if(e.target.id!=='coForm') return;
  e.preventDefault();
  const val=id=>$(id)?$(id).value.trim():'', visit=$('coVisit')&&$('coVisit').checked;
  if(visit&&!val('coVDate')){ $('coVDate').focus(); return toast('Choose the date you would like to visit the studio.'); }
  const vD=visit?new Date(val('coVDate')+'T00:00'):null, vDay=visit?['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][vD.getDay()]+', '+vD.getDate()+' '+['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][vD.getMonth()]+' '+vD.getFullYear():'', vTxt=visit?`${vDay}, ${val('coVTime')}`:'';
  const m=visit?'':[['Bust','coBust'],['Waist','coWaist'],['Hip','coHip'],['Shoulder','coShoulder'],['Armhole','coArm'],['Upper arm','coUpper'],['Sleeve length','coSleeve'],['Length','coLen']].filter(x=>val(x[1])).map(x=>`${x[0]} ${val(x[1])} in`).join(', ');
  const lines=[`Hi Sreez, this is ${val('coName')}. I would like a custom order.`,`Garment: ${val('coType')}`], extra=[`Garment: ${val('coType')}`];
  const add=(l,keep)=>{ lines.push(l); if(keep) extra.push(l); };
  if(val('coDesign')) add(`Starting design: ${val('coDesign')}`);
  if(val('coOffer')) add(`Offer: ${val('coOffer')}`,1);
  if(val('coOcc')) add(`Occasion: ${val('coOcc')}`,1);
  if(val('coDate')) add(`Needed by: ${val('coDate')}`);
  if(visit) add(`Studio visit for measurements: ${vTxt}`,1); else add(`Size: ${val('coSize')}`);
  if(m) add(`Measurements: ${m}`,1);
  if(val('coNotes')) add(`Notes: ${val('coNotes').replace(/\s*\n\s*/g,' ')}`,1);
  if(val('coPhone')) add(`Phone: ${val('coPhone')}`);
  const msg=lines.join('\n'), box=(label,hint)=>`<div class="box"><div class="label">${label}</div><textarea id="coMsg" readonly>${esc(msg)}</textarea>${hint}${sendHTML('coMsg',msg)}</div>`;
  let placed=false;
  if(SB.on){ const go=e.target.querySelector('[type=submit]'); if(go.disabled) return; go.disabled=true; go.textContent='Sending your order…';
    const p=DATA.products.find(p=>p.name.toLowerCase()===val('coDesign').toLowerCase()), d=val('coDesign'), g=val('coType');
    try{ await SB.createOrder({createdAt:new Date().toISOString(),customer:val('coName').slice(0,80),phone:val('coPhone').replace(/[^\d+]/g,'').slice(0,20),channel:'Website',status:'New',
        items:[{pid:p?p.id:'',name:(d?d+' ('+g+', custom)':g+' (custom)').slice(0,120),size:visit?'Measure at studio':val('coSize'),price:0}],due:/^\d{4}-\d{2}-\d{2}$/.test(val('coDate'))?val('coDate'):'',discount:0,advance:0,measurements:'',notes:extra.join('\n').slice(0,1500)});
      placed=true; alertOwner(val('coName'),[(d?d+', ':'')+g+' (custom order)'],visit?'Studio visit asked for: '+vTxt:''); }catch(err){} go.disabled=false; go.textContent='Send my custom order'; }
  if(placed){ e.target.hidden=true;
    $('coOut').innerHTML=`<div class="box"><span class="eyebrow">Thank you</span><h2 style="margin:0">Your custom order has reached Sreez</h2><p class="hint" style="margin:0">${visit?'She will confirm your studio visit on '+esc(vTxt)+' by calling or messaging '+esc(val('coPhone'))+'.':'She will contact you on '+esc(val('coPhone'))+' to confirm the design, price and date.'}</p></div>`+box('Your order','<p class="hint" style="margin:0">Want a quicker reply? You can also send this to Sreez yourself.</p>'); }
  else $('coOut').innerHTML=box('Your message','');
  $('coOut').scrollIntoView({block:'nearest'});
});
document.addEventListener('change',e=>{ if(e.target.id!=='coVisit') return; const on=e.target.checked; $('coVisitBox').hidden=!on; $('coMeas').hidden=on; if(on&&!$('coVDate').value) $('coVDate').value=addDays(1); });
document.addEventListener('keydown',e=>{
  if(!$('lb').hidden){ if(e.key==='Escape') closeLB(); else if(e.key==='ArrowLeft') stepLB(-1); else if(e.key==='ArrowRight') stepLB(1); return; }
  if(e.key==='Escape'){ closeSheets(); if(!$('searchBar').hidden) toggleSearch(false); } });
$('q').addEventListener('input',e=>{
  q=e.target.value.trim();
  if(location.hash!=='#shop'){ location.hash='shop'; return; }
  $('view').innerHTML=V.shop();
});
/* later carousel photos load only when swiped into view (or when the card is about to be used) */
const loadImg=im=>{ if(!im.dataset.src) return; if(im.dataset.fb){ const fb=im.dataset.fb; im.onerror=()=>{ im.onerror=null; im.src=fb; }; } im.src=im.dataset.src; im.removeAttribute('data-src'); };
const lazyIO='IntersectionObserver' in window?new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ loadImg(e.target); lazyIO.unobserve(e.target); } }),{rootMargin:'60px'}):null;
const lazyScan=r=>(r.querySelectorAll?r.querySelectorAll('img[data-src]'):[]).forEach(im=>{ if(im.hasAttribute('data-defer')) setTimeout(()=>loadImg(im),3500); lazyIO?lazyIO.observe(im):loadImg(im); });
new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{ if(n.nodeType===1) lazyScan(n); }))).observe(document.body,{childList:true,subtree:true});
lazyScan(document);
document.addEventListener('pointerenter',e=>{ const c=e.target.closest&&e.target.closest('.card'); if(c) c.querySelectorAll('img[data-src]').forEach(loadImg); },true);
document.addEventListener('touchstart',e=>{ const c=e.target.closest&&e.target.closest('.card'); if(c) c.querySelectorAll('img[data-src]').forEach(loadImg); },{capture:true,passive:true});
$('intro').addEventListener('click',()=>{ $('intro').style.display='none'; document.documentElement.classList.add('no-intro'); });
setTimeout(()=>document.documentElement.classList.add('no-intro'),3400);
document.addEventListener('scroll',e=>{ const g=e.target; if(!g.classList||!g.classList.contains('cgal')) return;
  const d=g.parentNode.querySelector('.cdots'); if(!d) return; const i=Math.round(g.scrollLeft/g.clientWidth);
  [...d.children].forEach((o,k)=>o.classList.toggle('on',k===i)); },{capture:true,passive:true});
window.addEventListener('hashchange',()=>{ closeLB(); if(!onManage()) aEdit=null; route(); if(onManage()) ownerCheck(); });
window.addEventListener('beforeunload',e=>{ if(dirty&&busy!=='pub'){ e.preventDefault(); e.returnValue=''; } });

chrome(); renderBag(); route();
/* owner check: the manager only lights up for the shop owner's Google account.
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
const authMsg=err=>{ const c=(err&&err.code)||''; return c.includes('wrong-password')||c.includes('invalid-credential')||c.includes('invalid-login')||c.includes('user-not-found')?'That email or password is not right.':c.includes('email-already-in-use')?'This email already has an account. Tap Forgot password to set a new password.':c.includes('weak-password')?'Choose a password with at least 6 characters.':c.includes('invalid-email')?'Check the email address.':c.includes('too-many-requests')?'Too many tries. Wait a few minutes and try again.':c.includes('popup')?'The Google window was closed or blocked. Try again, or use email and password.':c.includes('network')?'No connection. Check your internet and try again.':'That did not work. Try again.'; };
const recheck=()=>{ ownerAsked=false; capsReady=false; route(); ownerCheck(); };
async function ownAct(kind){
  const email=$('ownEmail')?$('ownEmail').value.trim():'', pw=$('ownPw')?$('ownPw').value:'';
  if(kind==='in'||kind==='new'){ if(!email||pw.length<6) return toast('Enter your email and a password of at least 6 characters.'); }
  if(kind==='reset'&&!email){ $('ownEmail').focus(); return toast('Type your email first, then tap Forgot password.'); }
  try{
    if(kind==='in') await own.signInEmail(email,pw);
    else if(kind==='new') await own.signUp(email,pw);
    else if(kind==='reset'){ await own.reset(email); return toast('If that email has an account, a link to set a new password is on its way.'); }
    else if(kind==='again'){ await own.sendVerify(); return toast('Link sent. Check your email.'); }
    else if(kind==='go') await own.refresh();
    else if(kind==='google') await own.signIn();
    else if(kind==='out') await own.signOut();
  }catch(err){ return toast(authMsg(err)); }
  if(kind==='out'){ try{ localStorage.removeItem('sreezOwner'); }catch(e){} location.hash='home'; location.reload(); return; }
  recheck();
}
document.addEventListener('submit',e=>{ if(e.target.id!=='ownForm') return; e.preventDefault(); if(own.signInEmail) ownAct('in'); });
document.addEventListener('click',e=>{ const t=e.target.closest('#ownIn,#ownOut,#ownNew,#ownReset,#ownGo,#ownAgain'); if(!t||!own.signIn) return;
  if(t.id==='ownOut'&&dirty&&!confirm('You have changes that are not published. Sign out anyway?')) return;
  ownAct({ownIn:'google',ownOut:'out',ownNew:'new',ownReset:'reset',ownGo:'go',ownAgain:'again'}[t.id]); });
/* fetch the owner's latest published catalogue; the page was drawn from the saved copy, so redraw only if something changed */
SB.watchImages();
SB.loadCatalogue().then(x=>{ if(!x||!x.products||!x.site) return; const j=JSON.stringify(x); try{ localStorage.setItem('sreezCat',j); }catch(e){}
  if(dirty||j===JSON.stringify(DATA)) return;
  Object.keys(SITE).forEach(k=>delete SITE[k]); Object.assign(SITE,x.site); ['collections','products','offers'].forEach(k=>DATA[k]=x[k]); if(x.v) DATA.v=x.v;
  chrome(); renderBag(); if(!onManage()&&location.hash!=='#checkout') route(); }).catch(()=>{});
if(onManage()||wasOwner()) ownerCheck();
