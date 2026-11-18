/* Sreez backend: talks to Firebase. Customers use only small web requests (no Firebase library is downloaded for them).
   The Firebase library loads only when the owner opens Manage shop. Settings live in firebase-config.js. */
(function(){
  const C=window.FB_CONFIG||{}, on=!!(C.apiKey&&C.projectId);
  const base=()=>`https://firestore.googleapis.com/v1/projects/${C.projectId}/databases/(default)/documents/`;
  const enc=v=>v===null||v===undefined?{nullValue:null}:typeof v==='string'?{stringValue:v}:typeof v==='boolean'?{booleanValue:v}:
    typeof v==='number'?(Number.isInteger(v)?{integerValue:String(v)}:{doubleValue:v}):
    Array.isArray(v)?{arrayValue:{values:v.map(enc)}}:{mapValue:{fields:Object.fromEntries(Object.entries(v).map(([k,x])=>[k,enc(x)]))}};
  const get=async path=>{ const r=await fetch(base()+path+'?key='+encodeURIComponent(C.apiKey)); if(r.status===404) return null; if(!r.ok) throw new Error('read '+r.status); return r.json(); };
  const SB=window.SB={on};
  /* the shop's catalogue as last published by the owner; null when nothing is published yet */
  SB.loadCatalogue=async()=>{ if(!on) return null; const d=await get('site/catalogue'); const j=d&&d.fields&&d.fields.json&&d.fields.json.stringValue; return j?JSON.parse(j):null; };
  /* a customer's order goes straight into the owner's order list */
  SB.createOrder=async o=>{ if(!on) throw new Error('off');
    const r=await fetch(base()+'orders?key='+encodeURIComponent(C.apiKey),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fields:enc(o).mapValue.fields})});
    if(!r.ok) throw new Error('order '+r.status); return (await r.json()).name.split('/').pop(); };
  /* photos the owner uploads from the manager are kept in the database and shown from there */
  const PX='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', cache=new Map();
  SB.imgRef=id=>PX+'#a:'+id;
  SB.img=id=>{ if(!cache.has(id)) cache.set(id,get('images/'+encodeURIComponent(id)).then(d=>{ const f=d&&d.fields; return f&&f.data?'data:'+((f.type&&f.type.stringValue)||'image/jpeg')+';base64,'+f.data.stringValue:''; }).catch(()=>{ cache.delete(id); return ''; })); return cache.get(id); };
  const fill=im=>{ const s=im.getAttribute('src')||'', i=s.indexOf('#a:'); if(i<0||!on) return; const id=s.slice(i+3); SB.img(id).then(u=>{ if(u&&(im.getAttribute('src')||'').endsWith('#a:'+id)) im.src=u; }); };
  const scan=n=>{ if(n.nodeType!==1) return; if(n.tagName==='IMG') fill(n); n.querySelectorAll&&n.querySelectorAll('img[src*="#a:"]').forEach(fill); };
  SB.watchImages=()=>{ new MutationObserver(ms=>ms.forEach(m=>{ if(m.type==='attributes') fill(m.target); else m.addedNodes.forEach(scan); })).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['src']}); scan(document.body); };

  /* ---- owner side: sign-in, saving the catalogue, photos and orders ---- */
  const V='10.14.1', LIBS=['app','auth','firestore'].map(n=>`https://www.gstatic.com/firebasejs/${V}/firebase-${n}-compat.js`);
  const load=src=>new Promise((res,rej)=>{ const s=document.createElement('script'); s.src=src; s.onload=res; s.onerror=()=>rej(new Error('load')); document.head.appendChild(s); });
  let sdk=null;
  const ready=()=>sdk||(sdk=(async()=>{ if(!on) throw new Error('off'); for(const l of LIBS) await load(l);
    const app=firebase.initializeApp({apiKey:C.apiKey,authDomain:C.authDomain||C.projectId+'.firebaseapp.com',projectId:C.projectId,appId:C.appId});
    const auth=firebase.auth(app), db=firebase.firestore(app);
    await new Promise(res=>{ const off=auth.onAuthStateChanged(()=>{ off(); res(); }); });
    return {auth,db}; })().catch(e=>{ sdk=null; throw e; }));
  const b64=blob=>new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(String(r.result).split(',')[1]); r.onerror=rej; r.readAsDataURL(blob); });
  /* resolves to {state:'off'|'out'|'verify'|'no'|'ok', email, db, store, assets, signIn, signOut} */
  SB.owner=async()=>{ if(!on) return {state:'off'};
    const {auth,db}=await ready(), u=auth.currentUser;
    const o={email:u?u.email:'',db,
      signIn:()=>auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()),
      signOut:()=>auth.signOut(),
      /* email and password: the address must be confirmed by the link Firebase emails before it counts as the owner */
      signInEmail:(e,p)=>auth.signInWithEmailAndPassword(e,p),
      signUp:async(e,p)=>{ const c=await auth.createUserWithEmailAndPassword(e,p); await c.user.sendEmailVerification(); },
      sendVerify:()=>auth.currentUser.sendEmailVerification(),
      reset:e=>auth.sendPasswordResetEmail(e),
      refresh:async()=>{ await auth.currentUser.reload(); await auth.currentUser.getIdToken(true); },
      store:{save:data=>db.collection('site').doc('catalogue').set({json:JSON.stringify(data),updatedAt:new Date().toISOString()})},
      assets:{upload:async blob=>{ if(blob.size>740000){ const e=new Error('big'); e.code='too_large'; throw e; }
        const ref=db.collection('images').doc(); await ref.set({data:await b64(blob),type:blob.type||'image/jpeg',createdAt:new Date().toISOString()}); return {id:ref.id}; }}};
    if(!u){ o.state='out'; return o; }
    if(!u.emailVerified){ o.state='verify'; return o; }
    /* only the owner account may read orders, so this read is the owner test */
    try{ await db.collection('orders').limit(1).get(); o.state='ok'; }catch(e){ o.state='no'; }
    return o; };
})();
