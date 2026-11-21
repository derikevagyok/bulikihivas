// ===== Résztvevők és feladatok =====
(function () {
  const PEOPLE = {
    bugi: "Bugi", dana: "Dana", bence: "Bence", orsi: "Orsi", gergo: "Gergő",
    dominik: "Dominik", oliver: "Olivér", zsani: "Zsani", kira: "Kira",
    barni: "Barni", deri: "Deri"
  };
  const BIRTHDAY = "bugi";

  // cap = hány ember kaphatja, who = kik kaphatják
  const TASKS = [
    { id: 1, cap: 2, title: "Itass le valakit!",
      text: "Válassz ki valakit, és éjfélig itasd le. Légy kreatív!",
      who: ["gergo","dominik","oliver","dana","bugi","zsani","kira","deri","orsi"] },
    { id: 2, cap: 2, title: "Táncpárbaj! 💃",
      text: "Hívj ki valakit egy táncpárbajra (Just Dance). A többiek szavaznak a győztesről – a vesztes iszik.",
      who: ["gergo","dominik","dana","bugi","zsani","kira","deri"] },
    { id: 3, cap: 1, title: "Sörpong a szülinapossal 🍺",
      text: "Hívd ki a szülinapost sörpongra, és válassz valakit magad mellé. A vesztes iszik. (Ha a szülinapos nem akar játszani, válassz valaki mást.)",
      who: ["gergo","dominik","oliver","dana","zsani","kira","deri"] },
    { id: 4, cap: 2, title: "Csíped a szülinapost? 📎",
      text: "Két ember vesz részt, és a cél, hogy minél több csipeszt tegyetek a szülinaposra. De ha észreveszi a csipeszeket és LEVESZI, mindketten isztok. A feladatot utána újrakezdhetitek.",
      who: ["bence","gergo","dominik","oliver","dana","zsani","kira"] },
    { id: 5, cap: 1, title: "Beszélj dalcímekkel 🎶",
      text: "A mondataidba illessz bele általad ismert dalcímeket (pl. „ez a feladat nem is olyan egyszerű” – Dzsúdló: Egyszerű). Számold! Ha éjfélig nem éred el a 19 mondatot, iszol – legyél akármilyen állapotban.",
      who: ["bence","gergo","dominik","oliver","dana","bugi","zsani","kira","deri","barni"] },
    { id: 6, cap: 1, title: "Halli Galli kihívás 🔔",
      text: "Hívj ki valakit Halli Gallira (kétszemélyes társasjáték – ha nem tudod a szabályokat, kérdezd meg a házigazdát). Ahány visszautasítást kapsz, annyiszor iszol. A játék végén a vesztes iszik.",
      who: ["bence","gergo","dominik","dana","bugi","zsani","kira","deri","barni"] },
    { id: 7, cap: 1, title: "Viccmester 😂",
      text: "Süss el minél több viccet az est folyamán. Ha éjfélig nem sikerül mindenkit megnevettetned, iszol. Sokat.",
      who: ["bence","gergo","dominik","oliver","dana","bugi","zsani","kira","deri","barni"] },
    { id: 8, cap: 1, title: "„Jóbarátok vagyunk” 🤝",
      text: "Mondasd ki legalább 6 emberrel ezt a mondatot: „Jóbarátok vagyunk”. Ha nem sikerül éjfélig, iszol.",
      who: ["bence","gergo","dominik","oliver","dana","bugi","zsani","kira","deri"] }
  ];
  const FIXED = { orsi: 1 }; // Orsi fixen az "Itass le valakit"-et kapja

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  // Véletlen, de a kitételeknek megfelelő kiosztás. Visszaad: { nevKulcs: feladatId }
  function deal() {
    const cap = {}; TASKS.forEach(t => cap[t.id] = t.cap);
    const res = {};
    for (const p in FIXED) { res[p] = FIXED[p]; cap[FIXED[p]]--; }
    const opts = p => TASKS.filter(t => t.who.includes(p)).map(t => t.id);
    const people = shuffle(Object.keys(PEOPLE).filter(p => !(p in res)));
    people.sort((a, b) => opts(a).length - opts(b).length); // legszűkebb előre
    const order = {}; people.forEach(p => order[p] = shuffle(opts(p)));
    const ok = (function bt(i) {
      if (i === people.length) return true;
      const p = people[i];
      for (const t of order[p]) {
        if (cap[t] > 0) { cap[t]--; res[p] = t; if (bt(i + 1)) return true; cap[t]++; delete res[p]; }
      }
      return false;
    })(0);
    if (!ok) throw new Error("Nem lehet a kitételeknek megfelelően kiosztani a feladatokat.");
    return res;
  }

  const norm = s => (s || "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, "");

  // ===== Adatbázis: Firebase, vagy DEMO módban localStorage =====
  const cfg = window.FIREBASE_CONFIG || {};
  const DEMO = !cfg.databaseURL;
  let DB;

  if (!DEMO) {
    firebase.initializeApp(cfg);
    const root = firebase.database().ref("buli");
    DB = {
      get: async p => (await root.child(p).get()).val(),
      set: (p, v) => root.child(p).set(v),
      remove: p => root.child(p).remove(),
      txn: async (p, fn) => { const r = await root.child(p).transaction(fn); return { committed: r.committed, value: r.snapshot.val() }; },
      on: (p, cb) => root.child(p).on("value", s => cb(s.val()))
    };
  } else {
    const KEY = "buli-demo-db";
    const listeners = [];
    const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
    const parts = p => p.split("/").filter(Boolean);
    const read = (tree, p) => parts(p).reduce((o, k) => (o == null ? null : (o[k] === undefined ? null : o[k])), tree);
    const write = (p, v) => {
      const tree = load(); const ks = parts(p); let o = tree;
      for (let i = 0; i < ks.length - 1; i++) { if (typeof o[ks[i]] !== "object" || !o[ks[i]]) o[ks[i]] = {}; o = o[ks[i]]; }
      if (v === null || v === undefined) delete o[ks[ks.length - 1]]; else o[ks[ks.length - 1]] = v;
      try { localStorage.setItem(KEY, JSON.stringify(tree)); } catch (e) {}
      fire();
    };
    const fire = () => { const t = load(); listeners.forEach(l => l.cb(read(t, l.p))); };
    window.addEventListener("storage", e => { if (e.key === KEY) fire(); });
    DB = {
      get: async p => read(load(), p),
      set: async (p, v) => write(p, v),
      remove: async p => write(p, null),
      txn: async (p, fn) => { const cur = read(load(), p); const nv = fn(cur); if (nv === undefined) return { committed: false, value: cur }; write(p, nv); return { committed: true, value: nv }; },
      on: (p, cb) => { listeners.push({ p, cb }); cb(read(load(), p)); }
    };
  }

  // Ha még nincs kiosztás, az első belépő létrehozza (tranzakcióval, hogy ne legyen ütközés)
  async function ensureAssignment() {
    const r = await DB.txn("assignment", cur => cur || deal());
    return r.value;
  }

  // Eszköz-azonosító (ezzel kötjük a nevet egy telefonhoz)
  function deviceId() {
    try {
      let id = localStorage.getItem("buli-device");
      if (!id) { id = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem("buli-device", id); }
      return id;
    } catch (e) { return "nostorage-" + Math.random().toString(36).slice(2); }
  }

  window.BULI = { PEOPLE, BIRTHDAY, TASKS, FIXED, deal, norm, DB, DEMO, ensureAssignment, deviceId };
})();
