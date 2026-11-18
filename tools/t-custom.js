const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch(); let fail=0; const ok=(c,m)=>{ if(!c){ fail++; console.log('FAIL',m); } else console.log('ok',m); };
  for(const w of [390,1280]){
    const ctx=await b.newContext({viewport:{width:w,height:800}}); const pg=await ctx.newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
    const posted=[];
    await pg.route('**/firebase-config.js',r=>r.fulfill({contentType:'text/javascript',body:"window.FB_CONFIG={apiKey:'k',projectId:'p',appId:'a'};"}));
    await pg.route('https://firestore.googleapis.com/**',r=>{ if(r.request().method()==='POST'){ posted.push(JSON.parse(r.request().postData())); return r.fulfill({contentType:'application/json',body:JSON.stringify({name:'x/orders/abc'})}); } r.fulfill({status:404,body:'{}'}); });
    await pg.route('https://fonts.g*/**',r=>r.abort());
    await pg.goto('http://localhost:8767/index.html#custom-order'); await pg.waitForTimeout(600);
    await pg.fill('#coName','Meena'); await pg.fill('#coPhone','98765 43210');
    ok(await pg.locator('#coMeas').isVisible()&&!(await pg.locator('#coVisitBox').isVisible()),w+' measurements shown by default');
    await pg.check('#coVisit'); await pg.waitForTimeout(150);
    ok(!(await pg.locator('#coMeas').isVisible())&&await pg.locator('#coVisitBox').isVisible(),w+' visit box replaces measurements');
    await pg.fill('#coVDate','2026-11-21'); await pg.selectOption('#coVTime','4:00 pm'); await pg.fill('#coNotes','Peach silk');
    await pg.screenshot({path:'/tmp/claude-0/-home-user/f6d5a27d-639e-5c8e-8f0d-89ddb1cbc0c9/scratchpad/co'+w+'.png',fullPage:true});
    const over=await pg.evaluate(()=>document.documentElement.scrollWidth-innerWidth); ok(over<=1,w+' no overflow '+over);
    await pg.click('#coForm [type=submit]'); await pg.waitForTimeout(600);
    const f=posted[0]&&posted[0].fields;
    ok(f&&f.customer.stringValue==='Meena'&&f.phone.stringValue==='9876543210'&&f.items.arrayValue.values[0].mapValue.fields.size.stringValue==='Measure at studio'&&f.measurements.stringValue===''&&f.status.stringValue==='New',w+' order fields');
    ok(f&&/Studio visit for measurements: Sat, 21 Nov 2026, 4:00 pm/.test(f.notes.stringValue)&&/Notes: Peach silk/.test(f.notes.stringValue),w+' notes: '+(f?f.notes.stringValue.replace(/\n/g,' | '):''));
    ok(/has reached Sreez/.test(await pg.textContent('#coOut'))&&/studio visit on Sat, 21 Nov 2026, 4:00 pm/.test(await pg.textContent('#coOut')),w+' confirmation');
    // without visit, with measurements
    await pg.reload(); await pg.waitForTimeout(600);
    await pg.fill('#coName','Ravi'); await pg.fill('#coPhone','9000000001'); await pg.fill('#coBust','36'); await pg.click('#coForm [type=submit]'); await pg.waitForTimeout(600);
    const g=posted[1]&&posted[1].fields; ok(g&&/Measurements: Bust 36 in/.test(g.notes.stringValue)&&!/Studio visit/.test(g.notes.stringValue),w+' plain custom order');
    ok(errs.length===0,w+' no page errors '+errs.join('|'));
    await ctx.close();
  }
  await b.close(); process.exit(fail?1:0);
})();
