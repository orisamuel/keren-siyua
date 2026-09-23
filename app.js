/* ═══════════════════ קרן הסיוע — המנוע ═══════════════════ */

const KEY = 'keren-v2';
const STATUS = [
  {v:'todo', l:'עוד לא התחלנו'},
  {v:'coll', l:'באיסוף'},
  {v:'ready',l:'מוכן להגשה'},
  {v:'sent', l:'הוגש 📮'},
  {v:'paid', l:'הכסף הגיע 🎉'}
];

let S = loadState();

function loadState(){
  try{
    const r = JSON.parse(localStorage.getItem(KEY));
    if(r && r.a) return r;
  }catch(e){}
  return { a:PROFILE, items:{}, medals:[], love:0, qi:0 };
}
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} }

function st(id){
  if(!S.items[id]) S.items[id] = {d:{}, n:{}, s:'todo'};
  return S.items[id];
}
const P  = () => buildProfile(S.a || {});
const buzz = ms => { try{ navigator.vibrate && navigator.vibrate(ms); }catch(e){} };
const nis = n => n.toLocaleString('he-IL');
const driveUrl = () => DRIVE_FOLDER;

const hist = id => HISTORY[id];
/* סעיף שכבר טופל ואינו חוזר על עצמו — יורד מהרשימה של רוני */
const closed = id => { const h = hist(id); return !!h && !h.again; };

/* ───────── חישובים ───────── */
function rel(item){
  if(!S.a) return {l:'maybe', why:''};
  try{ return item.rel(P()); }catch(e){ return {l:'maybe', why:''}; }
}
const live = () => CATALOG.filter(i => rel(i).l !== 'no' && !closed(i.id));

function prog(i){
  const s = st(i.id);
  const done = i.docs.filter(d => s.d[d.id]).length;
  return {done, total:i.docs.length, pct: i.docs.length ? done/i.docs.length : 0};
}
function stats(){
  const L = live();
  let docs=0, total=0, ready=0, sent=0, paid=0, money=0;
  L.forEach(i=>{
    const p = prog(i), s = st(i.id);
    docs += p.done; total += p.total;
    money += i.value || 0;
    if(p.total && p.done === p.total) ready++;
    if(s.s==='sent') sent++;
    if(s.s==='paid') paid++;
  });
  return {docs, total, pct: total ? docs/total : 0, ready, sent, paid, money, n:L.length};
}

/* ───────── ניווט ───────── */
function show(id){
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id===id));
  const quizOn = id === 'quiz';
  document.querySelector('.nav').classList.toggle('hidden', quizOn);
  document.body.style.paddingBottom = quizOn ? '0' : '';
  window.scrollTo(0,0);
}
function tab(t){
  document.querySelectorAll('.nav button').forEach(b => b.classList.toggle('on', b.dataset.t===t));
}

/* ═══════════════════ שאלון ═══════════════════ */
let A = {};

function quiz(){
  const i = S.qi;
  if(i >= QUESTIONS.length) return finish();
  const q = QUESTIONS[i];
  const pct = Math.round(i / QUESTIONS.length * 100);
  const cur = A[q.id];

  const opts = q.opts.map(o=>{
    const on = q.type==='multi' ? (cur||[]).includes(o.v) : cur===o.v;
    return '<button class="opt '+(on?'on':'')+'" data-v="'+o.v+'">'
      + (q.type==='grid' ? '' : '<span class="d"></span>')
      + '<span>'+(o.label!==undefined ? o.label : o.v)+'</span></button>';
  }).join('');

  document.getElementById('q').innerHTML =
    '<div class="qbar"><i style="width:'+pct+'%"></i></div>'
    + '<div class="qb">'
    + '<div class="qn">שאלה '+(i+1)+' מתוך '+QUESTIONS.length+'</div>'
    + '<h2 class="disp">'+q.q+'</h2>'
    + '<p class="s">'+q.sub+'</p>'
    + '<div class="'+(q.type==='grid'?'grid':'')+'">'+opts+'</div></div>'
    + '<button class="btn" id="nx">'+(i===QUESTIONS.length-1 ? 'יאללה, בואי נראה מה מגיע לנו' : 'הבא')+'</button>'
    + (i ? '<button class="btn ghost sm" id="bk">חזרה</button>' : '');

  document.querySelectorAll('#q .opt').forEach(b => b.onclick = () => {
    buzz(8);
    let v = b.dataset.v;
    if(v !== '' && !isNaN(v)) v = +v;
    if(q.type==='multi'){
      const c = A[q.id] || [];
      A[q.id] = c.indexOf(v) > -1 ? c.filter(x=>x!==v) : c.concat([v]);
      quiz();
    }else{
      A[q.id] = v; quiz(); setTimeout(next, 170);
    }
  });
  document.getElementById('nx').onclick = next;
  const bk = document.getElementById('bk');
  if(bk) bk.onclick = () => { S.qi--; quiz(); };

  function next(){ S.qi++; quiz(); }
}

function finish(){
  S.a = A; save();
  home(); show('home'); tab('home');
  confetti(90);
  setTimeout(()=>toast('נפתחו '+live().length+' סעיפים שמתאימים לכם 💛'), 400);
}

/* ═══════════════════ בית ═══════════════════ */
const PEPS = [
  'כל מסמך שאת מסמנת הוא כסף שנשאר אצלכם.',
  'אין פה מרוץ. יש פה רשימה, והיא נגמרת.',
  'הקרן לא תזכיר לכם. האפליקציה כן.',
  'המסמך הכי קשה הוא הראשון. אחר כך זה מתגלגל.',
  'מה שלא נאסף — פשוט לא יוגש. זה כל הסיפור.',
  'חמש דקות עכשיו שוות כמה אלפי שקלים אחר כך.'
];

function greet(){
  const h = new Date().getHours();
  if(h < 5)  return 'לילה טוב';
  if(h < 11) return 'בוקר טוב';
  if(h < 16) return 'צהריים טובים';
  if(h < 19) return 'אחר צהריים טובים';
  return 'ערב טוב';
}

function home(){
  const s = stats();
  checkMedals(s);

  let h = ''
  + '<div class="hero">'
  + '<div class="hi">'+greet()+',</div>'
  + '<h1 class="disp">'+HER+' <em>💛</em></h1>'
  + '<div class="pep">'+PEPS[new Date().getDate() % PEPS.length]+'</div>'

  + '<div class="money">'
  + '<div class="k">סך התקרות שנפתחו לכם</div>'
  + '<div class="v" id="cnt">0 ₪</div>'
  + '<div class="s">אלה תקרות מהתקנון — לא סכום מובטח. הקרן רשאית להפחית (סעיף 5.2).</div>'
  + '</div>'

  + '<div class="strip">'
  + '<div class="stat r"><b>'+s.ready+'</b><span>מוכן להגשה</span></div>'
  + '<div class="stat s"><b>'+s.sent+'</b><span>הוגש</span></div>'
  + '<div class="stat p"><b>'+s.n+'</b><span>סעיפים פתוחים</span></div>'
  + '</div>'

  + '<div class="prog">'
  + '<div class="prog-h"><span>המסמכים שנאספו</span><b>'+s.docs+'/'+s.total+'</b></div>'
  + '<div class="bar"><i style="width:'+Math.round(s.pct*100)+'%"></i></div>'
  + '</div>'

  + '<div class="medals">'
  + MEDALS.map(m=>'<div class="medal '+(S.medals.indexOf(m.id)>-1?'on':'')+'" title="'+m.desc+'">'
      + '<div class="c">'+m.icon+'</div><span>'+m.name+'</span></div>').join('')
  + '</div>'

  + '<div class="dl"><div class="big">31.12</div>'
  + '<div><span class="em">המועד האחרון להגשה</span> על תקופת זכאות שבין 7/10/23 ל-31/12/25. '
  + 'אחרי זה הכסף הזה פשוט לא קיים.</div></div>'
  + '<button class="love-card" data-love="1"><span class="e">💛</span><span>'
  + '<b>רגע, ו'+HIM+'?</b>'
  + '<span>הוא בנה את כל זה בשבילך. אפשר להגיד לו משהו.</span></span></button>'
  + '</div>';

  Object.keys(CATEGORIES).forEach(k=>{
    const c = CATEGORIES[k];
    const items = CATALOG.filter(i=>i.cat===k);
    if(!items.length) return;
    const on = items.filter(i=>rel(i).l!=='no');
    const d = on.reduce((a,i)=>a+prog(i).done,0), t = on.reduce((a,i)=>a+prog(i).total,0);
    h += '<div class="cat" style="--h:'+c.hue+'">'
       + '<div class="ic">'+c.icon+'</div><h2>'+c.name+'</h2>'
       + '<span class="up">'+(t ? d+'/'+t : '—')+'</span></div>';
    const ord = {yes:0, maybe:1, no:2};
    items.slice().sort((a,b)=>{
      const x = ord[rel(a).l] - ord[rel(b).l];
      return x || ((b.star?1:0) - (a.star?1:0));
    }).forEach(i => h += card(i, c.hue));
  });

  h += '<button class="tiny" id="redo">אורי — לעדכן את פרטי השירות</button>';
  document.getElementById('home').innerHTML = '<div class="wrap">'+h+'</div>';

  document.querySelectorAll('#home [data-i]').forEach(e => e.onclick = () => openItem(e.dataset.i));
  document.querySelectorAll('#home [data-love]').forEach(e => e.onclick = loveSheet);
  document.getElementById('redo').onclick = () => { A = Object.assign({}, S.a); S.qi = 0; quiz(); show('quiz'); };
  countUp(document.getElementById('cnt'), s.money);
}

function card(i, hue){
  const r = rel(i), p = prog(i), s = st(i.id);
  const full = p.total && p.done === p.total;
  const lbl = {yes:'מתאים לכם', maybe:'כנראה — לבדוק', no:'לא רלוונטי'}[r.l];
  return '<div class="card '+(r.l==='no'?'off':'')+' '+(full?'done':'')
    + ' '+(i.star && r.l==='yes' ? 'star':'')+'" style="--h:'+hue+'" data-i="'+i.id+'">'
    + '<div class="card-h"><div class="t"><h3>'+i.title+'</h3>'
    + '<div class="tag">'+i.tagline+'</div></div>'
    + '<div class="chip">'+(i.value ? nis(i.value)+' ₪' : 'לפי קבלה')+'</div></div>'
    + '<div class="flags">'
    + (hist(i.id) ? '<span class="flag f-hist">'
        + {ok:'✅ כבר אושר בעבר', no:'⛔ נדחה בעבר', sent:'📮 הוגש בעבר'}[hist(i.id).r]
        + '</span>' : '')
    + (i.star && r.l==='yes' ? '<span class="flag f-star">⭐ שווה הכי הרבה</span>' : '')
    + '<span class="flag f-'+r.l+'">'+lbl+'</span>'
    + (r.why ? '<span class="flag f-no">'+r.why+'</span>' : '')
    + '</div>'
    + (r.l!=='no'
      ? '<div class="trail">'+i.docs.map((d,n)=>'<i class="'+(n<p.done?'on':'')+'"></i>').join('')+'</div>'
        + '<div class="trail-l"><span>'+p.done+'/'+p.total+' מסמכים</span>'
        + '<span>'+STATUS.filter(x=>x.v===s.s)[0].l+'</span></div>'
      : '')
    + '</div>';
}

function histBox(id){
  const h = hist(id);
  const head = {ok:'✅ כבר הוגש ואושר', no:'⛔ הוגש ונדחה', sent:'📮 כבר הוגש'}[h.r];
  return '<div class="hbox '+h.r+'">'
    + '<b>'+head+(h.sum ? ' — '+nis(h.sum)+' ₪' : '')+'</b>'
    + h.txt + '<span class="meta">פנייה ' + h.no + ' · ' + h.on
    + (h.again ? ' · זכאות שנתית — אפשר להגיש שוב על 2026' : ' · חד-פעמי, אין מה להגיש שוב')
    + '</span></div>';
}

function countUp(el, to){
  if(!el) return;
  const dur = 900, t0 = performance.now();
  (function step(t){
    const k = Math.min(1, (t-t0)/dur);
    el.textContent = nis(Math.round(to * (1 - Math.pow(1-k, 3)))) + ' ₪';
    if(k < 1) requestAnimationFrame(step);
  })(t0);
}

/* ═══════════════════ פריט ═══════════════════ */
let cur = null;
function openItem(id){
  cur = CATALOG.filter(x=>x.id===id)[0];
  item(); show('item');
}

function item(){
  const i = cur, s = st(i.id), r = rel(i), p = prog(i);
  const c = CATEGORIES[i.cat];

  document.getElementById('item').innerHTML = '<div class="wrap" style="--h:'+c.hue+'">'
  + '<div class="dtop"><button class="back" id="bk">→ חזרה</button>'
  + '<h2 class="disp">'+i.title+'</h2>'
  + '<div class="meta">סעיף '+i.ref+' בתקנון · '+i.who+'</div></div>'

  + (r.l==='no'
     ? '<div class="alt" style="background:rgba(255,255,255,.04);border-color:var(--stroke)">'
       + '<b style="color:var(--dim)">לפי מה שמילאנו</b>'+r.why
       + '. אם זה השתנה — אפשר לעדכן את הפרטים ולבדוק שוב.</div>'
     : '')

  + (hist(i.id) ? histBox(i.id) : '')

  + '<div class="act">'
  + (driveUrl()
     ? '<a href="'+driveUrl()+'" target="_blank" rel="noopener">📎 לצרף קובץ</a>'
     : '')
  + '<a href="'+i.submit+'" target="_blank" rel="noopener" class="go">להגיש בקרן ←</a>'
  + '</div>'

  + '<div class="blk"><h4>כמה</h4>'
  + '<div class="amt">'+i.amount+'</div>'
  + (i.ceiling && i.ceiling!=='—' ? '<div class="cap">'+i.ceiling+'</div>' : '')
  + (i.amount2025 ? '<div class="alt"><b>לשירות שעד 31/12/2025 — תקנון 2025</b>'+i.amount2025+'</div>' : '')
  + '</div>'

  + '<div class="blk"><h4>תנאי הסף</h4><ul>'
  + i.conditions.map(x=>'<li>'+x+'</li>').join('') + '</ul></div>'

  + '<div class="blk"><h4>מה צריך לאסוף <span style="color:var(--amber)">'+p.done+'/'+p.total+'</span></h4>'
  + i.docs.map(d=>'<div class="doc '+(s.d[d.id]?'ok':'')+'" data-d="'+d.id+'">'
      + '<div class="cb">✓</div><div class="db">'
      + '<div class="l">'+d.label+'</div>'
      + (d.hint ? '<div class="h">'+d.hint+'</div>' : '')
      + '<textarea data-n="'+d.id+'" placeholder="איפה זה? קישור, שם קובץ, הערה…">'
      + (s.n[d.id]||'') + '</textarea></div></div>').join('')
  + '</div>'

  + (i.notes.length ? '<div class="blk notes"><h4>דגשים והגבלות</h4><ul>'
      + i.notes.map(n=>'<li>'+n+'</li>').join('') + '</ul></div>' : '')

  + '<div class="blk"><h4>איפה זה עומד</h4><div class="sts">'
  + STATUS.map(x=>'<button class="'+(s.s===x.v?'on':'')+'" data-s="'+x.v+'">'+x.l+'</button>').join('')
  + '</div></div>'
  + (p.total && p.done === p.total
     ? '<button class="love-card" data-love="1"><span class="e">🎉</span><span>'
       + '<b>סגרת סעיף שלם</b><span>מגיע ל'+HIM+' לשמוע על זה.</span></span></button>'
     : '')
  + '<div style="height:14px"></div></div>';

  document.getElementById('bk').onclick = () => { home(); show('home'); tab('home'); };
  document.querySelectorAll('#item [data-love]').forEach(e => e.onclick = loveSheet);

  document.querySelectorAll('#item [data-d]').forEach(function(el){
    function hit(){
      const k = el.dataset.d;
      s.d[k] = !s.d[k];
      buzz(s.d[k] ? 14 : 6);
      if(s.s==='todo' && s.d[k]) s.s = 'coll';
      const np = prog(i);
      if(np.total && np.done===np.total){
        if(s.s!=='sent' && s.s!=='paid') s.s = 'ready';
        confetti(70); toast('הסעיף הזה מוכן להגשה 🎉');
      }
      save(); item();
    }
    el.querySelector('.cb').onclick = hit;
    el.querySelector('.l').onclick  = hit;
  });

  document.querySelectorAll('#item [data-n]').forEach(function(t){
    t.oninput = function(){ s.n[t.dataset.n] = t.value; save(); };
  });

  document.querySelectorAll('#item [data-s]').forEach(function(b){
    b.onclick = function(){
      s.s = b.dataset.s; buzz(10); save();
      if(s.s==='paid'){ confetti(120); toast('איזה יופי! הכסף הגיע 💰'); }
      if(s.s==='sent'){ toast('הוגש. עכשיו מחכים — עד 21 ימי עסקים.'); }
      item();
    };
  });
}

/* ═══════════════════ מצב ═══════════════════ */
function board(){
  const L = live(), s = stats();
  const missing = L.filter(function(i){ const p = prog(i); return p.done < p.total; })
                   .sort((a,b)=>(b.value||0)-(a.value||0));

  const days = {0:'פחות מ-30',30:'30–44',45:'45–59',60:'60–119',120:'120–239',240:'240+'};
  const spouse = {yes:'שכירה',self:'עצמאית',no:'לא עובדת',leave:'חל"ד / חל"ת'};

  let h = '<div class="wrap" style="padding-top:24px">'
  + '<h2 class="disp" style="font-size:27px;margin-bottom:4px">איפה אנחנו עומדים</h2>'
  + '<p style="font-size:13.5px;color:var(--dim);margin:0 0 20px">תמונת מצב אחת, בלי לגלול את כל הרשימה.</p>'

  + '<div class="blk"><h4>הסטטוסים</h4>'
  + STATUS.map(x=>'<div class="row"><span>'+x.l+'</span><b>'
      + L.filter(i=>st(i.id).s===x.v).length + '</b></div>').join('')
  + '</div>'

  + '<div class="blk"><h4>הכי כדאי להשלים עכשיו</h4>'
  + (missing.length
      ? missing.slice(0,6).map(function(i){
          const p = prog(i);
          return '<div class="row" data-i="'+i.id+'" style="cursor:pointer">'
            + '<span>'+i.title+'<span class="sm">חסרים '+(p.total-p.done)+' מתוך '+p.total+'</span></span>'
            + '<b>'+(i.value ? nis(i.value)+' ₪' : '—')+'</b></div>';
        }).join('')
      : '<div class="row"><span>הכל נאסף. באמת. 👑</span></div>')
  + '</div>'

  + (CATALOG.filter(i=>closed(i.id)).length
     ? '<div class="blk"><h4>מה שכבר סגור</h4>'
       + '<p style="font-size:13px;color:var(--dim);margin:0 0 10px">'
       + 'אלה ירדו מהרשימה — הם חד-פעמיים וכבר טופלו.</p>'
       + CATALOG.filter(i=>closed(i.id)).map(function(i){
           const h = hist(i.id);
           return '<div class="row" data-i="'+i.id+'" style="cursor:pointer">'
             + '<span>'+i.title+'<span class="sm">'+h.on+' · פנייה '+h.no+'</span></span>'
             + '<b>'+(h.sum ? nis(h.sum)+' ₪' : {ok:'אושר',no:'נדחה',sent:'הוגש'}[h.r])+'</b></div>';
         }).join('')
       + '</div>'
     : '')

  + '<div class="blk"><h4>הפרופיל שלנו</h4>'
  + (S.a
     ? '<div class="row"><span>מדרג</span><b>'+(S.a.madreg||'—')+'</b></div>'
       + '<div class="row"><span>ימי צו 8</span><b>'+(days[S.a.days]||'—')+'</b></div>'
       + '<div class="row"><span>מערך לוחם</span><b>'
       + ({yes:'כן',no:'לא','?':'לא בטוחים'}[S.a.lohem]||'—')+'</b></div>'
       + '<div class="row"><span>המעמד של '+HER+'</span><b>'+(spouse[S.a.spouse]||'—')+'</b></div>'
     : '')
  + '</div>'

  + '<button class="btn" id="exp">לשלוח ל'+HIM+' את מצב האיסוף</button>'
  + '<a class="btn ghost sm" style="display:block;text-align:center" '
  + 'href="https://wa.me/'+WHATSAPP_KEREN+'" target="_blank" rel="noopener">'
  + 'לשאול את מוקד קרן הסיוע בוואטסאפ</a>'
  + '<button class="btn ghost sm" id="bak">גיבוי הנתונים לקובץ</button>'
  + '<button class="btn ghost sm" id="rst">לטעון גיבוי</button>'
  + '<input type="file" id="fl" accept=".json" hidden>'

  + '<p class="note">הכל נשמר על המכשיר הזה בלבד ולא עולה לשום שרת. '
  + 'הקבצים עצמם — בתיקיית הגוגל דרייב המשותפת.<br><br>'
  + '<b style="color:var(--dim)">המקורות:</b> תקנון קרן הסיוע 2026 (26/04/2026) והוראת המעבר שלו, '
  + 'ותקנון 2025 (23/07/2025). שניהם שמורים בתיקיית הפרויקט, ולכל סעיף רשום מספרו בתקנון.</p>'
  + '<div style="height:14px"></div></div>';

  document.getElementById('board').innerHTML = h;
  document.querySelectorAll('#board [data-i]').forEach(e=>e.onclick=()=>openItem(e.dataset.i));
  document.getElementById('exp').onclick = shareText;
  document.getElementById('bak').onclick = backup;
  document.getElementById('rst').onclick = ()=>document.getElementById('fl').click();
  document.getElementById('fl').onchange = restore;
}

function shareText(){
  const L = live(), s = stats();
  let t = 'קרן הסיוע — מצב האיסוף · ' + new Date().toLocaleDateString('he-IL') + '\n';
  t += s.docs+'/'+s.total+' מסמכים · '+s.ready+' סעיפים מוכנים · '+s.sent+' הוגשו\n';
  t += 'סך התקרות: '+nis(s.money)+' ₪\n';
  L.forEach(function(i){
    const p = prog(i), x = st(i.id);
    t += '\n▸ '+i.title+' ('+i.ref+') — '+STATUS.filter(y=>y.v===x.s)[0].l+' · '+p.done+'/'+p.total+'\n';
    i.docs.forEach(function(d){
      t += '  '+(x.d[d.id]?'✓':'○')+' '+d.label+(x.n[d.id]?' — '+x.n[d.id]:'')+'\n';
    });
  });
  if(navigator.clipboard) navigator.clipboard.writeText(t).catch(()=>{});
  window.open('https://wa.me/?text='+encodeURIComponent(t),'_blank','noopener');
  toast('נפתח בוואטסאפ, וגם הועתק');
}

function backup(){
  const b = new Blob([JSON.stringify(S,null,2)],{type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(b);
  a.download = 'קרן-סיוע-'+new Date().toISOString().slice(0,10)+'.json';
  a.click(); toast('הגיבוי ירד');
}
function restore(e){
  const f = e.target.files[0]; if(!f) return;
  const r = new FileReader();
  r.onload = function(){
    try{
      const d = JSON.parse(r.result);
      if(!d.a) return toast('הקובץ לא מתאים');
      S = d; save(); home(); board(); toast('הגיבוי נטען ✓');
    }catch(err){ toast('לא הצלחתי לקרוא את הקובץ'); }
  };
  r.readAsText(f);
}

/* ═══════════════════ מדליות ═══════════════════ */
function checkMedals(s){
  MEDALS.forEach(function(m){
    if(S.medals.indexOf(m.id) === -1 && m.test(s)){
      S.medals.push(m.id); save();
      setTimeout(function(){ confetti(80); toast(m.icon+' מדליה חדשה — '+m.name); }, 620);
    }
  });
}

/* ═══════════════════ הפינה של רוני ═══════════════════ */
function loveSheet(){
  buzz(12);
  const pool = PRAISE.slice().sort(()=>Math.random()-.5).slice(0,5);
  document.getElementById('sheet').innerHTML = '<div class="sheet-in">'
    + '<div class="grab"></div>'
    + '<h3 class="disp">הפינה של '+HER+'</h3>'
    + '<p class="sub">לוחצים על מה שמתאים, וזה נשלח ל'+HIM+' בוואטסאפ. הוא יתרגש, נו.</p>'
    + '<div class="counter"><b>'+S.love+'</b><span>פעמים שאמרת לו תודה עד היום</span></div>'
    + pool.map(p=>'<button class="praise" data-p="'+p.replace(/"/g,'&quot;')+'">'+p+'</button>').join('')
    + '<button class="btn ghost sm" id="cls">סגירה</button></div>';
  document.getElementById('sheet').classList.add('on');

  document.querySelectorAll('.praise').forEach(function(b){
    b.onclick = function(){
      S.love++; save(); buzz([18,40,18]);
      hearts();
      window.open('https://wa.me/?text='+encodeURIComponent(b.dataset.p),'_blank','noopener');
      setTimeout(closeSheet, 500);
    };
  });
  document.getElementById('cls').onclick = closeSheet;
  document.getElementById('sheet').onclick = function(e){ if(e.target.id==='sheet') closeSheet(); };
}
function closeSheet(){ document.getElementById('sheet').classList.remove('on'); }

/* ═══════════════════ אפקטים ═══════════════════ */
const FX = () => document.getElementById('fx');

function confetti(n){
  n = n || 70;
  const cols = ['#FF8A5B','#FFC24B','#FF5E8A','#A98BFF','#4FE0A8','#5BC8FF'];
  for(let i=0;i<n;i++){
    const d = document.createElement('div');
    d.className = 'fxp';
    const w = 6 + Math.random()*6;
    d.style.cssText = 'left:'+(Math.random()*100)+'vw;top:-20px;width:'+w+'px;height:'+(w*1.7)+'px;'
      + 'background:'+cols[i%cols.length]+';border-radius:2px;'
      + 'animation:drop '+(1.5+Math.random()*1.5)+'s cubic-bezier(.3,.6,.7,1) '+(Math.random()*.35)+'s forwards';
    FX().appendChild(d);
    setTimeout(()=>d.remove(), 3600);
  }
}
function hearts(){
  const e = ['💛','💖','🥹','✨','🫶','😍'];
  for(let i=0;i<22;i++){
    const d = document.createElement('div');
    d.className = 'fxp';
    d.textContent = e[i % e.length];
    d.style.cssText = 'left:'+(8+Math.random()*84)+'vw;bottom:8vh;font-size:'+(18+Math.random()*20)+'px;'
      + 'animation:floatup '+(2.1+Math.random()*1.3)+'s ease-out '+(Math.random()*.6)+'s forwards';
    FX().appendChild(d);
    setTimeout(()=>d.remove(), 4200);
  }
}
let tt;
function toast(m){
  const t = document.getElementById('toast');
  t.textContent = m; t.classList.add('on');
  clearTimeout(tt); tt = setTimeout(()=>t.classList.remove('on'), 3000);
}

/* ═══════════════════ הפעלה ═══════════════════ */
document.querySelectorAll('.nav button').forEach(function(b){
  b.onclick = function(){
    const t = b.dataset.t; buzz(6); tab(t);
    if(t==='home'){ home(); show('home'); }
    if(t==='board'){ board(); show('board'); }
    if(t==='love'){ tab(document.querySelector('.screen.on').id==='board'?'board':'home'); loveSheet(); }
  };
});

if(S.a){ A = Object.assign({}, S.a); home(); show('home'); tab('home'); }
else   { S.qi = 0; quiz(); show('quiz'); }
