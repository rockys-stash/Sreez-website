const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch(); let fail=0; const ok=(c,m)=>{ if(!c){ fail++; console.log('FAIL',m); } else console.log('ok',m); };
  for(const w of [390,1280]){
    const ctx=await b.newContext({viewport:{width:w,height:800}}); const pg=await ctx.newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
    let cat=null;
    await pg.route('**/firebase-config.js',r=>r.fulfill({contentType:'text/javascript',body:"window.FB_CONFIG={apiKey:'k',projectId:'p',appId:'a'};"}));
    await pg.route('https://firestore.googleapis.com/**',r=>cat&&r.request().url().includes('site/catalogue')?r.fulfill({contentType:'application/json',body:JSON.stringify({fields:{json:{stringValue:JSON.stringify(cat)}}})}):r.fulfill({status:404,body:'{}'}));
    await pg.route('https://www.instagram.com/**',r=>r.fulfill({contentType:'text/html',body:'<body style="margin:0;background:#eee">embed</body>'}));
    await pg.route('https://fonts.g*/**',r=>r.abort());
    await pg.goto('http://localhost:8768/index.html'); await pg.waitForTimeout(500);
    ok(await pg.locator('.tips').count()===0,w+' hidden when no tips');
    cat=await pg.evaluate(()=>JSON.parse(JSON.stringify(DATA)));
    cat.site.tips=['https://www.instagram.com/reel/DAbc_12-x/?igsh=abc','https://www.instagram.com/p/CxYz123/','https://www.instagram.com/_sreez_the_dress_maker/reel/Dzz9/','not a link'];
    await pg.reload(); await pg.waitForTimeout(700);
    const srcs=await pg.locator('.tip iframe').evaluateAll(a=>a.map(x=>x.getAttribute('src')));
    ok(JSON.stringify(srcs)===JSON.stringify(['https://www.instagram.com/reel/DAbc_12-x/embed/','https://www.instagram.com/p/CxYz123/embed/','https://www.instagram.com/reel/Dzz9/embed/']),w+' embeds '+srcs.join(' '));
    const over=await pg.evaluate(()=>document.documentElement.scrollWidth-innerWidth); ok(over<=1,w+' no overflow '+over);
    await pg.locator('.tips').scrollIntoViewIfNeeded(); await pg.waitForTimeout(300); await pg.screenshot({path:'/tmp/claude-0/-home-user/f6d5a27d-639e-5c8e-8f0d-89ddb1cbc0c9/scratchpad/tips'+w+'.png'});
    ok(errs.length===0,w+' no page errors '+errs.join('|'));
    await ctx.close();
  }
  await b.close(); process.exit(fail?1:0);
})();
