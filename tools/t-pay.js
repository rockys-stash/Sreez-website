const {chromium}=require('playwright');
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
    const mails=[]; await pg.route('https://api.web3forms.com/**',r=>{ mails.push(JSON.parse(r.request().postData())); r.fulfill({contentType:'application/json',body:'{"success":true}'}); });
    await pg.route('https://fonts.g*/**',r=>r.abort());
    await pg.goto('http://localhost:8766/index.html'); await pg.waitForTimeout(500);
    cat=await pg.evaluate(()=>JSON.parse(JSON.stringify(DATA))); cat.site.upi='sreez@okaxis'; cat.site.upiName='Sreeja B'; cat.site.notifyKey='KEY1';
    const priced=cat.products.find(p=>!p.hidden&&p.price)||cat.products.find(p=>!p.hidden); if(!priced.price) priced.price=2400;
    for(const [mode,btn] of [['paid','#payDone'],['later','#payLater']]){
      await pg.evaluate(()=>localStorage.removeItem('sreezBag'));
      await pg.goto('http://localhost:8766/index.html#p-'+priced.id); await pg.reload(); await pg.waitForTimeout(700);
      const sz=pg.locator('[data-s]').first(); if(await sz.count()) await sz.click();
      await pg.click('#pBuy'); await pg.waitForTimeout(300);
      await pg.fill('#ckName','Asha'); await pg.fill('#ckPhone','9876543210');
      await pg.click('#ckForm [type=submit]'); await pg.waitForTimeout(700);
      ok(await pg.locator('#payQr svg').count()===1,w+' '+mode+' QR drawn');
      const href=await pg.getAttribute('.payinfo a.btn','href'), amt=Math.ceil((priced.offerPrice&&priced.offerPrice<priced.price?priced.offerPrice:priced.price)/2);
      ok(href==='upi://pay?pa=sreez%40okaxis&pn=Sreeja%20B&am='+amt+'.00&cu=INR&tn=Sreez%20order%20advance',w+' '+mode+' link '+href);
      if(mode==='paid'){ await pg.fill('#payRef','4321 8765 0099'); await pg.screenshot({path:'/tmp/claude-0/-home-user/f6d5a27d-639e-5c8e-8f0d-89ddb1cbc0c9/scratchpad/pay'+w+'.png',fullPage:true}); }
      const over=await pg.evaluate(()=>document.documentElement.scrollWidth-innerWidth); ok(over<=1,w+' no overflow '+over);
      await pg.click(btn); await pg.waitForTimeout(600);
      const n=posted[posted.length-1].fields.notes.stringValue;
      ok(mode==='paid'?/customer says .* was paid by UPI, reference 432187650099/.test(n):/not paid yet/.test(n),w+' '+mode+' note: '+n.split('\n').pop());
      ok(/has reached Sreez/.test(await pg.textContent('#view')),w+' '+mode+' confirmation');
    }
    ok(posted.length===2,w+' two orders');
    ok(mails.length===2&&mails[0].access_key==='KEY1'&&/New order on the website from Asha/.test(mails[0].subject)&&/#manage/.test(mails[0].message)&&!/9876543210/.test(mails[0].message),w+' alert email: '+(mails[0]?mails[0].message.replace(/\n/g,' | '):''));
    // no UPI set: no pay step
    cat.site.upi=''; await pg.evaluate(()=>localStorage.removeItem('sreezBag'));
    await pg.goto('http://localhost:8766/index.html#p-'+priced.id); await pg.reload(); await pg.waitForTimeout(700);
    const sz=pg.locator('[data-s]').first(); if(await sz.count()) await sz.click();
    await pg.click('#pBuy'); await pg.waitForTimeout(300); await pg.fill('#ckName','B'); await pg.fill('#ckPhone','9876543210'); await pg.click('#ckForm [type=submit]'); await pg.waitForTimeout(600);
    ok(posted.length===3&&!/Payment/.test(posted[2].fields.notes.stringValue),w+' no UPI: straight to order');
    ok(errs.length===0,w+' no page errors '+errs.join('|'));
    await ctx.close();
  }
  await b.close(); process.exit(fail?1:0);
})();
