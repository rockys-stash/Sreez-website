const {chromium}=require('playwright');
const FAKE=`window.firebase=(function(){
 const st=window.__st=window.__st||{user:JSON.parse(localStorage.getItem('fu')||'null'),docs:{'orders/w1':{createdAt:'2026-11-18T10:00:00Z',customer:'Web Cust',phone:'9876543210',channel:'Website',status:'New',items:[{pid:'p1',name:'X',size:'M',price:1200}],due:'',discount:0,advance:0,measurements:'',notes:'Delivery: Collect'}},subs:[]};
 const fire=()=>st.subs.forEach(f=>f());
 const col=c=>({ doc(id){ id=id||('n'+Math.random().toString(36).slice(2,8)); const k=c+'/'+id; return {id,set(d,o){ if(!st.user||st.user.email!=='owner@x.com') return Promise.reject({code:'permission-denied'}); st.docs[k]=o&&o.merge?Object.assign({},st.docs[k],d):d; fire(); return Promise.resolve(); },delete(){ delete st.docs[k]; fire(); return Promise.resolve(); }}; },
   limit(){ return {get(){ return st.user&&st.user.email==='owner@x.com'?Promise.resolve({docs:[]}):Promise.reject({code:'permission-denied'}); }}; },
   onSnapshot(ok,err){ const f=()=>ok({docs:Object.keys(st.docs).filter(k=>k.startsWith(c+'/')).map(k=>({id:k.split('/')[1],data:()=>st.docs[k]}))}); st.subs.push(f); setTimeout(f,10); } });
 const mk=u=>Object.assign(u,{sendEmailVerification(){ window.__sent=(window.__sent||0)+1; return Promise.resolve(); },reload(){ if(window.__clicked){ this.emailVerified=true; localStorage.setItem('fv','1'); localStorage.setItem('fu',JSON.stringify(this)); } return Promise.resolve(); },getIdToken(){ return Promise.resolve('t'); }}); if(st.user) mk(st.user);
 const auth={get currentUser(){ return st.user; },onAuthStateChanged(f){ setTimeout(f,5); return ()=>{}; },signInWithEmailAndPassword(e,p){ if(p!=='secret1') return Promise.reject({code:'auth/wrong-password'}); st.user=mk({email:e,emailVerified:!!localStorage.getItem('fv')}); localStorage.setItem('fu',JSON.stringify(st.user)); return Promise.resolve(); },
   createUserWithEmailAndPassword(e,p){ st.user=mk({email:e,emailVerified:false}); localStorage.setItem('fu',JSON.stringify(st.user)); return Promise.resolve({user:st.user}); },
   sendPasswordResetEmail(){ window.__reset=1; return Promise.resolve(); },
   signInWithPopup(){ st.user=mk({email:window.__signAs||'owner@x.com',emailVerified:true}); localStorage.setItem('fu',JSON.stringify(st.user)); return Promise.resolve(); },signOut(){ st.user=null; localStorage.removeItem('fu'); return Promise.resolve(); }};
 const f={initializeApp(){ return {}; },auth(){ return auth; },firestore(){ return {collection:col}; }}; f.auth.GoogleAuthProvider=function(){}; return f; })();`;
(async()=>{
  const b=await chromium.launch(); let fail=0; const ok=(c,m)=>{ if(!c){ fail++; console.log('FAIL',m); } else console.log('ok',m); };
  for(const w of [390,1280]){
    const ctx=await b.newContext({viewport:{width:w,height:800}}); const pg=await ctx.newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
    let cat=null; const posted=[];
    await pg.route('**/firebase-config.js',r=>r.fulfill({contentType:'text/javascript',body:"window.FB_CONFIG={apiKey:'k',projectId:'p',appId:'a'};"}));
    await pg.route('https://www.gstatic.com/**',r=>r.fulfill({contentType:'text/javascript',body:r.request().url().includes('app-compat')?FAKE:''}));
    await pg.route('https://firestore.googleapis.com/**',r=>{ const u=r.request().url();
      if(r.request().method()==='POST'){ posted.push(JSON.parse(r.request().postData())); return r.fulfill({contentType:'application/json',body:JSON.stringify({name:'projects/p/databases/(default)/documents/orders/abc'})}); }
      if(u.includes('site/catalogue')) return cat?r.fulfill({contentType:'application/json',body:JSON.stringify({fields:{json:{stringValue:JSON.stringify(cat)}}})}):r.fulfill({status:404,body:'{}'});
      r.fulfill({status:404,body:'{}'}); });
    await pg.route('https://fonts.g*/**',r=>r.abort());
    await pg.goto('http://localhost:8765/index.html'); await pg.waitForTimeout(600);
    ok(await pg.locator('.card').count()>3,w+' home renders cards');
    const data=await pg.evaluate(()=>JSON.parse(JSON.stringify(DATA)));
    // catalogue override
    cat=JSON.parse(JSON.stringify(data)); cat.site.announce='HELLO FROM DB'; cat.site.leadDays=7;
    await pg.reload(); await pg.waitForTimeout(600);
    ok((await pg.textContent('#announce'))==='HELLO FROM DB',w+' catalogue from database applied');
    // buy flow
    const pid=data.products.find(p=>!p.hidden).id;
    await pg.goto('http://localhost:8765/index.html#p-'+pid); await pg.waitForTimeout(500);
    const sz=pg.locator('[data-s]').first(); if(await sz.count()) await sz.click();
    await pg.click('#pBuy'); await pg.waitForTimeout(300);
    if(!(await pg.locator('#ckForm').count())){ await pg.goto('http://localhost:8765/index.html#checkout'); await pg.waitForTimeout(300); }
    await pg.fill('#ckName','Asha'); await pg.fill('#ckPhone','98765 43210');
    await pg.selectOption('#ckDel',{index:0}).catch(()=>{});
    await pg.click('#ckForm [type=submit]'); await pg.waitForTimeout(500);
    const txt=await pg.textContent('#view');
    ok(posted.length===1&&posted[0].fields.customer.stringValue==='Asha'&&posted[0].fields.status.stringValue==='New'&&posted[0].fields.items.arrayValue.values.length===1,w+' order posted '+JSON.stringify(posted[0]||txt.slice(0,200)).slice(0,300));
    ok(/has reached Sreez/.test(txt),w+' confirmation shown');
    // manage signed out
    await pg.goto('http://localhost:8765/index.html#manage'); await pg.waitForTimeout(600);
    ok(await pg.locator('#ownIn').count()===1&&await pg.locator('#ownForm').count()===1,w+' sign-in form and Google button');
    await pg.screenshot({path:'/tmp/claude-0/-home-user/f6d5a27d-639e-5c8e-8f0d-89ddb1cbc0c9/scratchpad/login'+w+'.png'});
    await pg.fill('#ownEmail','owner@x.com'); await pg.fill('#ownPw','badpass'); await pg.click('#ownForm [type=submit]'); await pg.waitForTimeout(300);
    ok(/not right/.test(await pg.textContent('#toast')),w+' wrong password message');
    await pg.fill('#ownPw','secret1'); await pg.click('#ownNew'); await pg.waitForTimeout(500);
    ok(/We sent a link to owner@x.com/.test(await pg.textContent('#view'))&&await pg.evaluate(()=>window.__sent)===1,w+' verify step after creating password');
    await pg.click('#ownGo'); await pg.waitForTimeout(500);
    ok(await pg.locator('#ownGo').count()===1,w+' still waiting until link is opened');
    await pg.evaluate(()=>window.__clicked=1); await pg.click('#ownGo'); await pg.waitForTimeout(700);
    ok(await pg.locator('.mg').count()===1,w+' manager opens after email confirmed');
    await pg.evaluate(()=>{ localStorage.removeItem('fu'); localStorage.removeItem('fv'); localStorage.removeItem('sreezOwner'); }); await pg.reload(); await pg.waitForTimeout(700);
    await pg.fill('#ownEmail','owner@x.com'); await pg.click('#ownReset'); await pg.waitForTimeout(300);
    ok(await pg.evaluate(()=>window.__reset)===1,w+' reset email requested');
    await pg.evaluate(()=>window.__signAs='stranger@x.com'); await pg.click('#ownIn'); await pg.waitForTimeout(500);
    ok(/not the shop owner/.test(await pg.textContent('#view')),w+' stranger refused');
    await pg.click('#ownOut'); await pg.waitForTimeout(800);
    await pg.goto('http://localhost:8765/index.html#manage'); await pg.waitForTimeout(600);
    await pg.click('#ownIn'); await pg.waitForTimeout(700);
    ok(await pg.locator('.mg').count()===1,w+' manager opens for owner');
    ok(/Web Cust/.test(await pg.textContent('#view')),w+' website order listed');
    ok(await pg.evaluate(()=>window.__st.docs['orders/w1'].no)===1,w+' order numbered');
    for(const t of ['products','collections','promos','shop','insights','orders']){ await pg.click(`.mgtab[data-v="${t}"]`); await pg.waitForTimeout(150); }
    await pg.click('.mgtab[data-v="promos"]'); await pg.waitForTimeout(200);
    ok(await pg.locator('.t-off .trow').count()===6&&/SREENEW/.test(await pg.textContent('#view')),w+' six starter promo codes listed');
    await pg.click('[data-a="new-promo"]'); await pg.waitForTimeout(200);
    await pg.fill('[data-k="code"]','diwali 20!'); await pg.fill('[data-k="value"]','20'); await pg.check('[data-k="show"]');
    ok(await pg.evaluate(()=>{ const p=DATA.promos[DATA.promos.length-1]; return p.code==='DIWALI20'&&p.value===20&&p.show===true&&promoCheck('diwali20',1000,0).off===200; }),w+' new promo code saved and working');
    ok(await pg.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=1,w+' promo edit no overflow');
    if(process.env.SHOT) await pg.screenshot({path:process.env.SHOT+'/promo-edit'+w+'.png',fullPage:true});
    await pg.click('[data-a="back"]'); await pg.waitForTimeout(200);
    if(process.env.SHOT) await pg.screenshot({path:process.env.SHOT+'/promo-list'+w+'.png',fullPage:true});
    await pg.click('.mgtab[data-v="shop"]'); await pg.waitForTimeout(200);
    await pg.uncheck('[data-k="tipsOn"]'); ok(await pg.evaluate(()=>SITE.tipsOn)===false,w+' tips switch off'); await pg.check('[data-k="tipsOn"]'); ok(await pg.evaluate(()=>SITE.tipsOn)===true,w+' tips switch on');
    await pg.fill('#tipNew','hello'); await pg.click('[data-a="tip-add"]'); await pg.waitForTimeout(150);
    ok(await pg.locator('.tiprow').count()===0,w+' bad tip link refused');
    await pg.fill('#tipNew','https://www.instagram.com/reel/AAA111/'); await pg.click('[data-a="tip-add"]'); await pg.waitForTimeout(150);
    await pg.fill('#tipNew','https://www.instagram.com/p/BBB222/'); await pg.click('[data-a="tip-add"]'); await pg.waitForTimeout(150);
    ok(await pg.locator('.tiprow').count()===2&&await pg.inputValue('[data-tip="0"]')==='https://www.instagram.com/p/BBB222/',w+' tips added, newest first');
    await pg.locator('.tiplist').scrollIntoViewIfNeeded(); await pg.screenshot({path:'/tmp/claude-0/-home-user/f6d5a27d-639e-5c8e-8f0d-89ddb1cbc0c9/scratchpad/tipmg'+w+'.png'});
    await pg.click('[data-a="tip-rm"][data-v="1"]'); await pg.waitForTimeout(150);
    ok(JSON.stringify(await pg.evaluate(()=>SITE.tips))==='["https://www.instagram.com/p/BBB222/"]',w+' tip removed');
    await pg.fill('[data-k="announce"]','New line'); await pg.waitForTimeout(100);
    await pg.locator('[data-k="announce"]').dispatchEvent('change'); await pg.waitForTimeout(600);
    ok(await pg.locator('#pubBar').isVisible(),w+' publish bar');
    await pg.click('#pubGo'); await pg.waitForTimeout(400);
    ok(JSON.parse(await pg.evaluate(()=>window.__st.docs['site/catalogue'].json)).site.announce==='New line',w+' catalogue saved');
    const over=await pg.evaluate(()=>document.documentElement.scrollWidth-innerWidth); ok(over<=1,w+' no overflow '+over);
    await pg.screenshot({path:'m'+w+'.png'});
    ok(errs.length===0,w+' no page errors '+errs.join('|'));
    await ctx.close();
  }
  await b.close(); process.exit(fail?1:0);
})();
