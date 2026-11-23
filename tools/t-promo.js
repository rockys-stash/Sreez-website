/* promo codes: home row, checkout box, pay step amount, order notes, custom order form, old catalogue without promos */
const {chromium}=require('playwright');
const SHOT=process.env.SHOT||'';
(async()=>{
  const b=await chromium.launch(); let fail=0; const ok=(c,m)=>{ if(!c){ fail++; console.log('FAIL',m); } else console.log('ok',m); };
  for(const w of [390,1280]){
    const ctx=await b.newContext({viewport:{width:w,height:800}}); const pg=await ctx.newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
    let cat=null; const posted=[];
    await pg.route('**/firebase-config.js',r=>r.fulfill({contentType:'text/javascript',body:"window.FB_CONFIG={apiKey:'k',projectId:'p',appId:'a'};"}));
    await pg.route('https://firestore.googleapis.com/**',r=>{ const u=r.request().url();
      if(r.request().method()==='POST'){ posted.push(JSON.parse(r.request().postData())); return r.fulfill({contentType:'application/json',body:JSON.stringify({name:'x/orders/abc'})}); }
      if(u.includes('site/catalogue')&&cat) return r.fulfill({contentType:'application/json',body:JSON.stringify({fields:{json:{stringValue:JSON.stringify(cat)}}})});
      r.fulfill({status:404,body:'{}'}); });
    await pg.route('https://fonts.g*/**',r=>r.abort());
    const U='http://localhost:8769/index.html';
    await pg.goto(U); await pg.waitForTimeout(500);
    cat=await pg.evaluate(()=>JSON.parse(JSON.stringify(DATA)));
    // an older saved catalogue: offers, no promos. The starter codes must appear and offers must not.
    const seed=cat.promos; delete cat.promos; cat.offers=[{tag:'x',title:'Old offer',desc:'d',discount:'',validUntil:'',active:true}]; cat.site.upi='sreez@okaxis';
    const priced=cat.products.find(p=>!p.hidden); priced.price=5000; priced.offerPrice=null; const open=cat.products.filter(p=>!p.hidden)[1]; open.price=null;
    await pg.reload(); await pg.waitForTimeout(700);
    const home=await pg.textContent('#view');
    ok(/Promo codes/.test(home)&&/SREENEW/.test(home)&&/SREE10/.test(home)&&!/TWINSREE/.test(home)&&!/Old offer/.test(home),w+' home shows public codes only, no offers');
    ok(await pg.locator('a[href="#offers"]').count()===0,w+' no Offers links');
    ok(await pg.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=1,w+' home no overflow');
    if(SHOT) await pg.locator('.pcode').first().scrollIntoViewIfNeeded(), await pg.screenshot({path:SHOT+'/promo-home'+w+'.png'});
    // priced cart
    await pg.evaluate(()=>localStorage.removeItem('sreezBag'));
    await pg.goto(U+'#p-'+priced.id); await pg.reload(); await pg.waitForTimeout(700);
    const sz=pg.locator('[data-s]').first(); if(await sz.count()) await sz.click();
    await pg.click('#pBuy'); await pg.waitForTimeout(300);
    await pg.fill('#ckName','Asha'); await pg.fill('#ckPhone','9876543210');
    await pg.fill('#promoIn','nope'); await pg.click('#promoGo');
    ok(/not valid/.test(await pg.textContent('#promoMsg')),w+' wrong code refused');
    await pg.fill('#promoIn','bridesree'); await pg.click('#promoGo');
    ok(/10,000 or more/.test(await pg.textContent('#promoMsg')),w+' minimum order enforced');
    await pg.fill('#promoIn',' sree10 '); await pg.press('#promoIn','Enter'); await pg.waitForTimeout(200);
    ok(/SREE10/.test(await pg.textContent('#promoBox'))&&/you save ₹500/.test(await pg.textContent('#promoBox')),w+' code applied with Enter');
    ok(/4,500/.test(await pg.textContent('#ckSums')),w+' total after code '+(await pg.textContent('#ckSums')).replace(/\s+/g,' '));
    ok(await pg.inputValue('#ckName')==='Asha',w+' form kept');
    ok(await pg.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=1,w+' checkout no overflow');
    if(SHOT) await pg.screenshot({path:SHOT+'/promo-ck'+w+'.png',fullPage:true});
    await pg.click('#ckForm [type=submit]'); await pg.waitForTimeout(700);
    ok(/am=2250\.00/.test(await pg.getAttribute('.payinfo a.btn','href')),w+' advance is half of the discounted total');
    await pg.click('#payLater'); await pg.waitForTimeout(600);
    let n=posted[posted.length-1].fields.notes.stringValue;
    ok(/Promo code: SREE10 \(10% off, saves ₹500\)\. Total after the code: ₹4,500\./.test(n)&&/Advance to collect: ₹2,250/.test(n),w+' order note: '+n.replace(/\n/g,' | '));
    ok(posted[posted.length-1].fields.discount.integerValue==='0'||posted[posted.length-1].fields.discount.doubleValue===0||JSON.stringify(posted[posted.length-1].fields.discount).includes('0'),w+' discount field stays 0 for the rules');
    ok(await pg.evaluate(()=>!sessionStorage.getItem('sreezPromo')),w+' code cleared after ordering');
    // tap a code on the home page, then order a design with no price
    await pg.goto(U+'#home'); await pg.waitForTimeout(400);
    await pg.click('[data-promo="SREENEW"]');
    await pg.goto(U+'#p-'+open.id); await pg.reload(); await pg.waitForTimeout(700);
    const sz2=pg.locator('[data-s]').first(); if(await sz2.count()) await sz2.click();
    await pg.click('#pBuy'); await pg.waitForTimeout(300);
    ok(/SREENEW/.test(await pg.textContent('#promoBox'))&&/confirms your price/.test(await pg.textContent('#promoBox')),w+' tapped code waits at checkout');
    await pg.fill('#ckName','Bina'); await pg.fill('#ckPhone','9876543211');
    await pg.click('#ckForm [type=submit]'); await pg.waitForTimeout(700);
    n=posted[posted.length-1].fields.notes.stringValue;
    ok(/Promo code: SREENEW \(15% off, to apply on the final price\)/.test(n),w+' unpriced order note: '+n.replace(/\n/g,' | '));
    // typed but not applied wrong code blocks the order
    await pg.goto(U+'#p-'+open.id); await pg.reload(); await pg.waitForTimeout(700);
    const sz3=pg.locator('[data-s]').first(); if(await sz3.count()) await sz3.click();
    await pg.click('#pBuy'); await pg.waitForTimeout(300);
    await pg.fill('#ckName','Cara'); await pg.fill('#ckPhone','9876543212'); await pg.fill('#promoIn','WRONG1');
    const before=posted.length; await pg.click('#ckForm [type=submit]'); await pg.waitForTimeout(500);
    ok(posted.length===before&&await pg.locator('#ckForm').count()===1,w+' wrong typed code stops the order');
    // ended and switched off codes
    const r=await pg.evaluate(()=>{ DATA.promos.push({code:'OLD1',type:'pct',value:5,until:'2020-01-01',active:true},{code:'OFF1',type:'pct',value:5,active:false}); return [promoCheck('old1',0,true).err,promoCheck('off1',0,true).err,promoCheck('SREEFRIEND',1500,0).err,promoCheck('SREEFRIEND',2500,0).off,promoCheck('SREE10',99,0).off]; });
    ok(/ended/.test(r[0])&&/not valid/.test(r[1])&&/2,000/.test(r[2])&&r[3]===300&&r[4]===10,w+' ended, off, minimum, flat, percent '+JSON.stringify(r));
    // custom order form
    await pg.goto(U+'#custom-order'); await pg.reload(); await pg.waitForTimeout(600);
    ok(await pg.locator('#coOffer').count()===0&&await pg.locator('#coPromo').count()===1,w+' custom order has a promo box');
    await pg.fill('#coName','Dee'); await pg.fill('#coPhone','9876543213'); await pg.fill('#coPromo','bad');
    const b2=posted.length; await pg.click('#view form [type=submit]'); await pg.waitForTimeout(500);
    ok(posted.length===b2,w+' custom order refuses a wrong code');
    await pg.fill('#coPromo','twinsree'); await pg.click('#view form [type=submit]'); await pg.waitForTimeout(700);
    n=posted.length>b2?posted[posted.length-1].fields.notes.stringValue:'(not posted)';
    ok(/Promo code: TWINSREE \(10% off\)/.test(n),w+' custom order note: '+n.replace(/\n/g,' | ').slice(0,160));
    ok(errs.length===0,w+' no page errors '+errs.join(';'));
    await ctx.close();
  }
  await b.close(); console.log(fail?'FAILED '+fail:'ALL OK'); process.exit(fail?1:0);
})();
