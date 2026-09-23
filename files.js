/* ═══════════ מסמכים — נשמרים על המכשיר (IndexedDB) ═══════════
   רוני מצלמת או בוחרת קובץ, והוא נשמר כאן. בלי חשבון, בלי העלאה,
   בלי הרשאות. "לשלוח לאורי" פותח את תפריט השיתוף של הטלפון.
   ============================================================ */

const DB_NAME = 'keren-files', STORE = 'f';
let _db = null;
const FILES = {};                       // key -> {name, type, size, at}
const key = (i, d) => i + '::' + d;

function openDB(){
  return new Promise((res, rej) => {
    if(_db) return res(_db);
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => { _db = r.result; res(_db); };
    r.onerror   = () => rej(r.error);
  });
}
function tx(mode){ return openDB().then(db => db.transaction(STORE, mode).objectStore(STORE)); }
function req(r){ return new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }

async function loadFileIndex(){
  try{
    const s = await tx('readonly');
    const ks = await req(s.getAllKeys());
    const vs = await req(s.getAll());
    ks.forEach((k, n) => {
      const v = vs[n];
      if(v) FILES[k] = { name:v.name, type:v.type, size:v.size, at:v.at };
    });
  }catch(e){ /* דפדפן בלי IndexedDB — האפליקציה עובדת, בלי צירוף קבצים */ }
}

async function putFile(i, d, file){
  const rec = { name:file.name || 'מסמך', type:file.type, size:file.size, at:Date.now(), blob:file };
  const s = await tx('readwrite');
  await req(s.put(rec, key(i, d)));
  FILES[key(i, d)] = { name:rec.name, type:rec.type, size:rec.size, at:rec.at };
}
async function getFile(i, d){
  const s = await tx('readonly');
  return req(s.get(key(i, d)));
}
async function delFile(i, d){
  const s = await tx('readwrite');
  await req(s.delete(key(i, d)));
  delete FILES[key(i, d)];
}
const hasFile  = (i, d) => !!FILES[key(i, d)];
const fileInfo = (i, d) => FILES[key(i, d)];
const fileCount = () => Object.keys(FILES).length;

const kb = n => n < 1024*1024
  ? Math.max(1, Math.round(n/1024)) + ' KB'
  : (n/1048576).toFixed(1) + ' MB';

/* אוסף את הקבצים של סעיף (או של הכל) ומגיש אותם לשיתוף */
async function collect(itemId){
  const out = [];
  for(const k of Object.keys(FILES)){
    if(itemId && k.indexOf(itemId + '::') !== 0) continue;
    const [i, d] = k.split('::');
    const rec = await getFile(i, d);
    if(!rec) continue;
    const item = CATALOG.filter(x => x.id === i)[0];
    const doc  = item && item.docs.filter(x => x.id === d)[0];
    const ext  = (rec.name.match(/\.[a-z0-9]+$/i) || [''])[0]
              || (rec.type === 'application/pdf' ? '.pdf' : '.jpg');
    const nice = ((item ? item.title : i) + ' — ' + (doc ? doc.label : d))
                   .replace(/[\/:*?"<>|]/g, '-').slice(0, 70) + ext;
    out.push(new File([rec.blob], nice, { type: rec.type || 'application/octet-stream' }));
  }
  return out;
}

async function shareFiles(itemId, title){
  const files = await collect(itemId);
  if(!files.length) return toast('אין עדיין מסמכים לשלוח');
  if(navigator.canShare && navigator.canShare({ files })){
    try{
      await navigator.share({ files, title, text: title });
      return;
    }catch(e){ if(e && e.name === 'AbortError') return; }
  }
  files.forEach(f=>{
    const a = document.createElement('a');
    a.href = URL.createObjectURL(f); a.download = f.name; a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href), 4000);
  });
  toast('הדפדפן לא תומך בשיתוף — הקבצים ירדו למכשיר');
}
