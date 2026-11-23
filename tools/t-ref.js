/* design photos on the custom order form: resize, send, ids in the order notes, and the path where saving a photo fails */
const {chromium}=require('playwright'); const path=require('path');
const SHOT=process.env.SHOT||'', IMG=n=>path.join(__dirname,'../public/img',n);
(async()=>{
  const b=await chromium.launch(); let fail=0; const ok=(c,m)=>{ if(!c){ fail++; console.log('FAIL',m); } else console.log('ok',m); };
  for(const w of [390,1280]){
    const ctx=await b.newContext({viewport:{width:w,height:800}}); const pg=await ctx.newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
    const refs=[], orders=[]; let refOk=true, n=0;
    await pg.route('**/firebase-config.js',r=>r.fulfill({contentType:'text/javascript',body:"window.FB_CONFIG={apiKey:'k',projectId:'p',appId:'a'};"}));
    await pg.route('https://firestore.googleapis.com/**',r=>{ const u=r.request().url(), m=r.request().method();
      if(m==='POST'&&u.includes('/documents/refs')){ if(!refOk) return r.fulfill({status:403,body:'{}'}); refs.push(JSON.parse(r.request().postData())); return r.fulfill({contentType:'application/json',body:JSON.stringify({name:'x/refs/photo00'+(++n)})}); }
      if(m==='POST'){ orders.push(JSON.parse(r.request().postData())); return r.fulfill({contentType:'application/json',body:JSON.stringify({name:'x/orders/abc'})}); }
      r.fulfill({status:404,body:'{}'}); });
    await pg.route('https://fonts.g*/**',r=>r.abort());
    const U='http://localhost:8770/index.html#custom-order';
    await pg.goto(U); await pg.waitForTimeout(600);
    await pg.fill('#coName','Meena'); await pg.fill('#coPhone','9876543210');
    await pg.setInputFiles('#coPics',[IMG('about-sreeja.jpg'),IMG('blazer-floral-1.jpg')]); await pg.waitForTimeout(900);
    ok(await pg.locator('.copic img').count()===2,w+' two photo previews');
    await pg.setInputFiles('#coPics',[IMG('about-sreeja-face.jpg'),IMG('blazer-floral-1.jpg')]); await pg.waitForTimeout(900);
    ok(await pg.locator('.copic img').count()===3&&!(await pg.locator('#coPics').isVisible()),w+' stops at three photos');
    await pg.click('[data-coprm="0"]'); await pg.waitForTimeout(150);
    ok(await pg.locator('.copic img').count()===2&&await pg.locator('#coPics').isVisible(),w+' photo removed');
    await pg.setInputFiles('#coPics',{name:'notes.txt',mimeType:'text/plain',buffer:Buffer.from('hello')}); await pg.waitForTimeout(500);
    ok(await pg.locator('.copic img').count()===2,w+' a file that is not a photo is refused');
    ok(await pg.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=1,w+' no overflow');
    if(SHOT){ await pg.locator('#coPics').scrollIntoViewIfNeeded(); await pg.screenshot({path:SHOT+'/ref-form'+w+'.png'}); }
    await pg.click('#coForm [type=submit]'); await pg.waitForTimeout(1200);
    const sizes=refs.map(x=>x.fields.data.stringValue.length);
    ok(refs.length===2&&sizes.every(s=>s>1000&&s<=950000)&&refs.every(x=>Object.keys(x.fields).sort().join()==='createdAt,data'),w+' two photos sent, sizes '+sizes.join(', '));
    ok(await pg.evaluate(async d=>{ const im=new Image(); im.src='data:image/jpeg;base64,'+d; await im.decode(); return Math.max(im.width,im.height)<=1400&&im.width>100; },refs[0].fields.data.stringValue),w+' photo is a JPEG of 1400px or less');
    let nt=orders[0]&&orders[0].fields.notes.stringValue;
    ok(orders.length===1&&/^Garment: .*\nDesign photos \(keep this line\): ref:photo001 ref:photo002/.test(nt),w+' order notes: '+String(nt).replace(/\n/g,' | ').slice(0,120));
    ok(/2 photos have reached her too/.test(await pg.textContent('#coOut'))&&/Design photos: 2 added/.test(await pg.inputValue('#coMsg')),w+' customer told the photos arrived');
    // saving photos is refused (for example before the new database rule is published): the order still goes
    refOk=false; await pg.goto('about:blank'); await pg.goto(U); await pg.waitForTimeout(600);
    await pg.fill('#coName','Ravi'); await pg.fill('#coPhone','9000000001');
    await pg.setInputFiles('#coPics',IMG('blazer-floral-1.jpg')); await pg.waitForTimeout(700);
    await pg.click('#coForm [type=submit]'); await pg.waitForTimeout(1200);
    nt=orders[1]&&orders[1].fields.notes.stringValue;
    ok(orders.length===2&&/added 1 design photo that could not be saved\. Ask for it on WhatsApp/.test(nt)&&!/ref:/.test(nt),w+' order still sent: '+String(nt).replace(/\n/g,' | ').slice(0,130));
    ok(/One photo could not be sent/.test(await pg.textContent('#coOut')),w+' customer told to send the photo another way');
    // no photos: nothing extra
    refOk=true; await pg.goto('about:blank'); await pg.goto(U); await pg.waitForTimeout(600);
    await pg.fill('#coName','Zoe'); await pg.fill('#coPhone','9000000002'); await pg.click('#coForm [type=submit]'); await pg.waitForTimeout(700);
    ok(orders.length===3&&refs.length===2&&!/photo/i.test(orders[2].fields.notes.stringValue),w+' order without photos unchanged');
    ok(errs.length===0,w+' no page errors '+errs.join('|'));
    await ctx.close();
  }
  await b.close(); console.log(fail?'FAILED '+fail:'ALL OK'); process.exit(fail?1:0);
})();
