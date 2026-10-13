/* FractionWorld AR – visual reference-inspired anatomy-style interface; procedural pizza 3D. No separate GLB required.
   Current AR card image indices: 0 pizza, 1 senilai, 2 perbandingan, 3 penjumlahan.
   Designed for MindAR 1.2.5 / A-Frame 1.5.0 / Three.js included with A-Frame. */
(function () {
  'use strict';
  const T = AFRAME.THREE;
  const PI2 = Math.PI * 2;
  const palette = { crust: 0xd9883d, cheese: 0xffce57, sauce: 0xbd452b, pepperoni: 0xb73327 };

  function mat(hex, roughness = 0.87) {
    return new T.MeshStandardMaterial({ color: hex, roughness, metalness: 0, side: T.DoubleSide });
  }
  function wedge(radius, first, last, arcSteps = 32) {
    const s = new T.Shape();
    s.moveTo(0, 0);
    s.lineTo(radius * Math.cos(first), radius * Math.sin(first));
    s.absarc(0, 0, radius, first, last, false);
    s.lineTo(0, 0);
    return s;
  }
  function sph(rad, color, x, y, z, scaleX = 1, scaleY = 1, scaleZ = 1) {
    const m = new T.Mesh(new T.SphereGeometry(rad, 9, 7), mat(color));
    m.position.set(x, y, z); m.scale.set(scaleX, scaleY, scaleZ); return m;
  }
  function toppingDisk(radius, color, thickness, x, y, z) {
    const m = new T.Mesh(new T.CylinderGeometry(radius, radius, thickness, 16, 1), mat(color));
    m.rotation.x = Math.PI / 2; m.position.set(x, y, z); return m;
  }
  function rimTube(radius, first, last, z, tubeRadius, color) {
    const points = [];
    const count = Math.max(6, Math.ceil((last - first) * 13));
    for (let k = 0; k <= count; k++) {
      const a = first + (last - first) * k / count;
      points.push(new T.Vector3(radius * Math.cos(a), radius * Math.sin(a), z + 0.004 * Math.sin(k * 2.3)));
    }
    const curve = new T.CatmullRomCurve3(points);
    return new T.Mesh(new T.TubeGeometry(curve, count + 3, tubeRadius, 7, false), mat(color));
  }
  const lerp = (a, b, t) => a + (b - a) * t;
  function disposeNode(node) {
    node.traverse(n => {
      if (n.geometry) n.geometry.dispose();
      if (n.material) (Array.isArray(n.material) ? n.material : [n.material]).forEach(m => m.dispose());
    });
  }
  AFRAME.registerComponent('pizza-lab', {
    init() {
      this.root = new T.Group(); this.el.object3D.add(this.root);
      this.count = 4; this.selected = new Set(); this.separated = false;
      this.slices = []; this.age = 0; this.baseRadius = 0.42;
      this.build(4);
    },
    remove() { this.clear(); this.el.object3D.remove(this.root); },
    clear() { while (this.root.children.length) { const c = this.root.children[0]; this.root.remove(c); disposeNode(c); } this.slices = []; },
    build(n) {
      this.count = n; this.selected = new Set(); this.separated = false; this.clear(); this.age = 0;
      const R = this.baseRadius, start = -Math.PI / 2;
      // Floating serving plate: thin rings and a soft shadow reveal the object's depth.
      const plate = new T.Mesh(new T.CylinderGeometry(R + .052, R + .052, .018, 48), mat(0xfffaf0));
      plate.rotation.x = Math.PI / 2; plate.position.z = -0.035; this.root.add(plate);
      const line = new T.Mesh(new T.TorusGeometry(R + .043, .009, 6, 56), mat(0xf2ad6f));
      line.position.z = -.022; this.root.add(line);
      const shadow = new T.Mesh(new T.CircleGeometry(R + .038, 48), new T.MeshBasicMaterial({color:0x713921,transparent:true,opacity:0.17,depthWrite:false}));
      shadow.position.z = -.015; this.root.add(shadow);

      for (let i = 0; i < n; i++) {
        const a0 = start + i * PI2 / n + 0.008;
        const a1 = start + (i + 1) * PI2 / n - 0.008;
        const mid = (a0 + a1) / 2;
        const g = new T.Group(); g.userData.pizzaIndex = i;
        // Golden baked dough with real depth and bevelled sides.
        const geom = new T.ExtrudeGeometry(wedge(R, a0, a1), {depth:.057, bevelEnabled:true, bevelThickness:.012, bevelSize:.008, bevelSegments:2, curveSegments:20, steps:1});
        const bread = new T.Mesh(geom, [mat(0xeaa155), mat(0xc47832)]);
        g.add(bread);
        // Sauce visible as a border under molten cheese.
        const sauce = new T.Mesh(new T.ShapeGeometry(wedge(.395, a0+.018, a1-.018)), mat(palette.sauce));
        sauce.position.z = .072; g.add(sauce);
        const cheese = new T.Mesh(new T.ShapeGeometry(wedge(.380, a0+.027, a1-.027)), mat(palette.cheese));
        cheese.position.z = .075; g.add(cheese);
        // Puffy edge only along the curved crust, not along the wedge cut lines.
        g.add(rimTube(.403, a0, a1, .076, .020, 0xd88a42));
        g.add(rimTube(.416, a0, a1, .074, .010, 0xffd18a));

        const positions = n === 2 ? [.14, .25, .33] : n === 4 ? [.20, .30] : [.24];
        positions.forEach((rr, j) => {
          const margin = (a1 - a0) * (n === 2 ? .22 : .17);
          const angle = Math.max(a0+margin, Math.min(a1-margin, mid + (j%2 ? 1 : -1) * .14));
          const x = rr * Math.cos(angle), y = rr * Math.sin(angle);
          const pepperoni = toppingDisk(n === 8 ? .024 : .030, 0xb33229, .010, x, y, .087);
          g.add(pepperoni);
          g.add(sph(.007, 0xe58f55, x - .01, y + .006, .096, 1.2, .9, .35));
          const basilR = Math.min(.32, rr + .045);
          const bx = basilR*Math.cos(mid+(j%2?.085:-.085)), by=basilR*Math.sin(mid+(j%2?.085:-.085));
          const basil = sph(.014, 0x39854c, bx, by, .083, .6, 1.4, .26);
          basil.rotation.z = mid; g.add(basil);
        });
        // Cheese freckles baked into surface add depth without texture downloads.
        for (let j = 0; j < 4; j++) {
          const radial = .08 + ((i * 5 + j * 7) % 19)/19 * .27;
          const ang = mid + ((j % 3) - 1) * (a1 - a0) * .15;
          g.add(sph(.007, j%2?0xf4a23c:0xffe394, radial*Math.cos(ang),radial*Math.sin(ang),.077,.8,1,.3));
        }
        g.position.z = .035;
        g.scale.setScalar(.26);
        this.root.add(g);
        this.slices.push({g, mid, born:i*.055});
      }
      this.root.rotation.x = -.32;
      this.root.rotation.y = .035;
    },
    setCount(n) { this.build(n); },
    toggle(i) { if (i<0 || i>=this.count) return; if (this.selected.has(i)) this.selected.delete(i); else this.selected.add(i); },
    setCountSelected(num) { this.selected.clear(); for(let i=0;i<Math.max(0,Math.min(this.count,num));i++) this.selected.add(i); },
    clearSelection() { this.selected.clear(); },
    toggleSplit() { this.separated = !this.separated; },
    tick(time, dt) {
      const tick = Math.min(.3, 1 - Math.exp(-Math.max(1,dt) / 110));
      this.age += Math.min(dt || 0, 50) / 1000;
      this.slices.forEach(({g,mid,born},i) => {
        const picked = this.selected.has(i);
        const dist = (this.separated ? .102 : 0) + (picked ? .034 : 0);
        const depth = picked ? .095 : .035;
        g.position.x = lerp(g.position.x, Math.cos(mid) * dist, tick);
        g.position.y = lerp(g.position.y, Math.sin(mid) * dist, tick);
        g.position.z = lerp(g.position.z, depth + .004*Math.sin(this.age*2+i*.6), tick);
        const pop = Math.min(1, Math.max(.26, (this.age-born) * 3.5));
        const scale = 0.26 + (Math.min(1, pop) - .26) * (1 - Math.exp(-Math.max(0,this.age-born)*5));
        g.scale.setScalar(lerp(g.scale.x, scale, Math.max(.06,tick)));
        g.rotation.z = lerp(g.rotation.z, picked ? Math.sin(mid)*.028 : 0, tick);
      });
    }
  });

  const demo = document.body.dataset.mode === 'demo';
  const $ = id => document.getElementById(id);
  const scene = $('arScene');
  const TOPICS = [
    {name:'Mengenal Pecahan',den:4,num:1,heading:'Satu pizza, banyak bagian!',intro:'Saat satu pizza dipotong sama besar menjadi empat, tiap potong mewakili satu per empat.',detail:'PEMBILANG = bagian yang dipilih. PENYEBUT = jumlah seluruh bagian sama besar.',example:'Lia makan 2 dari 4 potong pizza. Berarti Lia makan 2/4 atau setengah pizza.',exampleN:4,exampleK:2},
    {name:'Pecahan Senilai',den:4,num:2,heading:'Beda potongan, sama banyak!',intro:'Dua per empat pizza sama dengan satu per dua pizza. Bentuk bagiannya boleh berbeda, tetapi jumlah pizzanya sama.',detail:'2/4 = 1/2 = 4/8. Pembilang dan penyebut dikalikan atau dibagi bilangan sama.',example:'Lihat 2/4, lalu tekan animasi untuk mengubahnya menjadi 4/8 tanpa mengubah banyak pizza.',exampleN:8,exampleK:4},
    {name:'Membandingkan Pecahan',den:4,num:3,heading:'Pecahan mana yang lebih besar?',intro:'Kita bisa membandingkan luas pizza yang diwakili pecahan berbeda.',detail:'3/4 lebih besar daripada 5/8 karena 3/4 = 6/8, sedangkan 6/8 > 5/8.',example:'Bandingkan 3/4 pizza dengan 5/8 pizza. Gunakan gambar pizza untuk melihat 3/4 lebih banyak.',exampleN:8,exampleK:5},
    {name:'Operasi Pecahan',den:4,num:1,heading:'Ayo jumlahkan pecahan!',intro:'Jika penyebut sama, jumlahkan pembilangnya. Potongan pizzanya tetap sebesar semula.',detail:'1/4 + 2/4 = 3/4. Penyebut tetap 4 karena ukuran setiap bagian tidak berubah.',example:'Adik makan 1/4 pizza dan kakak makan 2/4. Bersama-sama mereka makan 3/4 pizza.',exampleN:4,exampleK:3}
  ];
  const MISSIONS = [
    {name:'Pizza untuk dua saudara',story:'Dina memberikan 1/4 pizza kepada adik dan 2/4 pizza kepada kakak. Berapa total pizza yang diberikan Dina?',steps:[{n:4,k:1,task:'Tahap 1 — Pilih 1/4 pizza untuk adik.'},{n:4,k:3,task:'Tahap 2 — Tambahkan 2/4 untuk kakak. Sekarang ada berapa bagian terpilih?'}],options:['2/4','3/4','4/4'],answer:'3/4',explain:'1/4 + 2/4 = 3/4. Karena penyebutnya sama, pembilang 1 dan 2 dijumlahkan.'},
    {name:'Sisa pizza keluarga',story:'Satu pizza dibagi 8. Ibu memakan 3/8 dan Ayah memakan 2/8. Berapa pizza yang masih tersisa?',steps:[{n:8,k:3,task:'Tahap 1 — Tandai 3/8 pizza yang dimakan Ibu.'},{n:8,k:5,task:'Tahap 2 — Tambahkan 2/8 yang dimakan Ayah.'}],options:['3/8','5/8','2/8'],answer:'3/8',explain:'Yang dimakan 3/8 + 2/8 = 5/8. Sisa pizza 8/8 − 5/8 = 3/8.'},
    {name:'Pecahan yang senilai',story:'Fajar makan 1/2 pizza. Nisa membagi pizza yang sama besar menjadi 8 potong. Berapa potong yang harus dimakan Nisa agar sama banyak?',steps:[{n:4,k:2,task:'Tahap 1 — Tampilkan setengah pizza sebagai 2/4.'},{n:8,k:4,task:'Tahap 2 — Bagi menjadi 8 lalu pilih bagian yang nilainya tetap setengah.'}],options:['2/8','4/8','6/8'],answer:'4/8',explain:'Setengah dari 8 adalah 4. Jadi 1/2 = 2/4 = 4/8.'},
    {name:'Siapa makan lebih banyak?',story:'Raka makan 3/4 pizza. Bella makan 5/8 pizza dengan ukuran sama. Siapa yang makan lebih banyak?',steps:[{n:4,k:3,task:'Tahap 1 — Perhatikan besar 3/4 pizza milik Raka.'},{n:8,k:5,task:'Tahap 2 — Bandingkan dengan 5/8 pizza milik Bella.'}],options:['Raka','Bella','Sama banyak'],answer:'Raka',explain:'3/4 = 6/8, lebih besar daripada 5/8. Jadi Raka makan lebih banyak.'},
    {name:'Berbagi dengan adil',story:'Sisa 3/4 pizza akan dibagikan sama rata kepada 3 teman. Berapa bagian pizza yang didapat setiap teman?',steps:[{n:4,k:3,task:'Tandai dahulu 3/4 pizza yang akan dibagikan.'}],options:['1/4','2/4','3/4'],answer:'1/4',explain:'3/4 dibagi 3 menjadi 1/4 untuk setiap teman. Setiap anak mendapatkan satu dari empat bagian pizza utuh.'}
  ];
  const state = {card:0,tab:'intro',n:4,selected:new Set([0]),tracked:demo,sound:false,missionIndex:0,missionStep:0,answerMode:false,chosenAnswer:null,missionDone:false,exampleToggle:false};
  let toastTimeout, sourceCamera=null;
  const model = () => {
    const node=demo?document.querySelector('.pizza-model'):document.querySelector(`#target${state.card} .pizza-model`);
    return node?.components?.['pizza-lab'];
  };
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const fractions=()=>`${state.selected.size}/${state.n}`;
  function announce(msg){const e=$('toast');e.textContent=msg;e.classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>e.classList.remove('show'),2600)}
  function setPieces(n,k){state.n=n;state.selected=new Set(Array.from({length:clamp(k,0,n)},(_,i)=>i));const m=model();if(m){if(m.count!==n)m.setCount(n);m.selected=new Set(state.selected);}renderCounter();}
  function syncModel(){const m=model();if(m){if(m.count!==state.n)m.setCount(state.n);m.selected=new Set(state.selected);} renderCounter();}
  function renderCounter(){ $('hudFraction').textContent=fractions();$('hudDesc').textContent=`${state.selected.size} dari ${state.n} bagian`;document.querySelectorAll('[data-cut]').forEach(b=>b.classList.toggle('chosen',Number(b.dataset.cut)===state.n));$('missionCount').textContent=fractions();if(!demo){const t=document.querySelector(`#target${state.card} .ar-label-text`);if(t)t.setAttribute('value',fractions());}}
  function setPanel(tag,title,desc,detail){$('topicLabel').textContent=tag;$('panelTitle').textContent=title;$('panelText').textContent=desc;$('detail').textContent=detail;}
  function setTab(next){state.tab=next;document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===next));$('missionPanel').classList.toggle('hidden',next!=='challenge');$('cutDock').classList.toggle('hidden',next==='challenge');$('infoPanel').classList.toggle('hidden',next==='challenge');$('infoPanel').classList.remove('collapsed');$('collapse').textContent='−';
    const t=TOPICS[state.card];
    if(next==='intro'){setPieces(t.den,t.num);setPanel('MULAI · '+t.name,t.heading,t.intro,t.detail);$('animate').textContent='▶ Animasi pecahan';}
    if(next==='cut'){setPieces(4,1);setPanel('INTERAKSI 3D','Potong dan angkat pizzanya!','Pilih 2, 4, atau 8 bagian, kemudian ketuk potongan pizza untuk mengangkatnya.','Semakin besar penyebut, semakin kecil ukuran tiap potongan jika pizzanya sama besar.');$('animate').textContent='▶ Tunjukkan pembagian';}
    if(next==='learn'){setPieces(t.den,t.num);setPanel('MATERI KELAS 5',t.name,t.intro,t.detail);$('animate').textContent='▶ Contoh visual';}
    if(next==='example'){state.exampleToggle=false;setPieces(t.den,t.num);setPanel('CONTOH SEHARI-HARI','Belajar dari pizza',t.example,'Perhatikan perubahan potongan 3D. Tekan contoh visual untuk melihat hasilnya.');$('animate').textContent='▶ Jalankan contoh';}
    if(next==='challenge')startMission();
  }
  function switchCard(i){state.card=i;state.tracked=true;const t=TOPICS[i];$('scanHint').classList.add('hidden');$('status').textContent=`✓ Kartu ${i+1} terbaca · ${t.name}`;setTab('intro');}
  function selectSlice(i){if(state.tab==='challenge'&&state.answerMode)return;if(state.selected.has(i))state.selected.delete(i);else state.selected.add(i);syncModel()}
  function changePieces(delta){if(state.tab==='challenge'&&state.answerMode)return;const k=clamp(state.selected.size+delta,0,state.n);setPieces(state.n,k)}
  function animateMode(){const t=TOPICS[state.card];const m=model();if(state.tab==='cut'){
      setPieces(2,1); if(m)m.separated=true;
      setTimeout(()=>{if(state.tab==='cut'){setPieces(4,2);const a=model();if(a)a.separated=true;}},850);
      setTimeout(()=>{if(state.tab==='cut'){setPieces(8,4);const a=model();if(a)a.separated=true;announce('1/2 = 2/4 = 4/8 · Nilainya tetap sama!');}},1700);
    }else if(state.tab==='example'||state.tab==='learn'||state.tab==='intro'){
      state.exampleToggle=!state.exampleToggle;let n=t.den,k=t.num;
      if(state.card===0){n=4;k=state.exampleToggle?2:1;}
      if(state.card===1){n=state.exampleToggle?8:4;k=state.exampleToggle?4:2;}
      if(state.card===2){n=state.exampleToggle?8:4;k=state.exampleToggle?5:3;}
      if(state.card===3){n=4;k=state.exampleToggle?3:1;}
      setPieces(n,k);if(m)m.separated=true;
      const captions=['Sekarang lihat 2/4 pizza.','2/4 dan 4/8 nilainya sama.','3/4 lebih besar daripada 5/8.','1/4 + 2/4 = 3/4.'];
      announce(captions[state.card]);
    }
  }
  function currentMission(){return MISSIONS[state.missionIndex]}
  function renderMission(){const m=currentMission();$('missionNumber').textContent=`${state.missionIndex+1}/${MISSIONS.length}`;$('missionTitle').textContent=m.name;$('missionStory').textContent=m.story;
    $('missionCount').textContent=fractions();$('missionChoices').classList.toggle('hidden',!state.answerMode);$('missionCheck').classList.toggle('hidden',state.missionDone);$('missionNext').classList.toggle('hidden',!state.missionDone);
    $('missionFeedback').classList.toggle('hidden',!state.missionDone);
    $('missionInstruction').textContent=state.missionDone?'Penjelasan jawaban':state.answerMode?'Terakhir, pilih jawaban yang tepat dari soal cerita di atas.':m.steps[state.missionStep].task;
    if(state.answerMode){$('missionChoices').innerHTML=m.options.map(x=>`<button data-answer="${x}" class="${state.chosenAnswer===x?'picked':''}">${x}</button>`).join('');}
    if(state.missionDone){$('missionFeedback').textContent=`🌟 Hebat! ${m.explain}`;$('missionNext').textContent=state.missionIndex===MISSIONS.length-1?'Ulangi misi ↺':'Soal berikutnya →';}
  }
  function startMission(){state.missionStep=0;state.answerMode=false;state.chosenAnswer=null;state.missionDone=false;const s=currentMission().steps[0];setPieces(s.n,0);$('missionFeedback').classList.add('hidden');renderMission();}
  function checkMission(){if(state.missionDone)return;const m=currentMission();
    if(!state.answerMode){const s=m.steps[state.missionStep];if(state.n!==s.n||state.selected.size!==s.k){announce(`Coba pilih ${s.k} dari ${s.n} bagian terlebih dahulu.`);return;}
      state.missionStep++;
      if(state.missionStep<m.steps.length){const next=m.steps[state.missionStep];const current=state.selected.size;const previousN=state.n;setPieces(next.n,next.n===previousN?current:0);announce('Bagus! Lanjutkan langkah berikutnya.');}
      else {state.answerMode=true;announce('Bagus! Sekarang pilih jawaban.');}
    }else {if(!state.chosenAnswer){announce('Pilih salah satu jawaban dahulu.');return;}if(state.chosenAnswer!==m.answer){announce('Belum tepat. Coba perhatikan pizza dan ceritanya lagi.');return;}
      state.missionDone=true;announce('🌟 Benar! Kamu berhasil menyelesaikan misi!');}
    renderMission();
  }
  function missionHint(){const m=currentMission();announce(state.answerMode?`Ingat: ${m.explain}`:`Coba ikuti tahap ini: ${m.steps[state.missionStep].task}`)}
  function nextMission(){state.missionIndex=(state.missionIndex+1)%MISSIONS.length;startMission()}
  function sayText(){if(!('speechSynthesis'in window)){announce('Fitur suara tidak tersedia di browser ini.');return;}window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(state.tab==='challenge' ? `${$('missionTitle').textContent}. ${$('missionStory').textContent}. ${$('missionInstruction').textContent}` : `${$('panelTitle').textContent}. ${$('panelText').textContent}. ${$('detail').textContent}`);u.lang='id-ID';u.rate=.92;window.speechSynthesis.speak(u);announce('🔊 Membacakan penjelasan...')}
  function wirePicking(){if(!scene.canvas||!scene.camera)return;const ray=new T.Raycaster(),point=new T.Vector2();scene.canvas.addEventListener('pointerup',e=>{
    if(!state.tracked||state.tab==='challenge'&&state.answerMode)return;const m=model();if(!m)return;const r=scene.canvas.getBoundingClientRect();point.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height*2-1));scene.camera.updateMatrixWorld(true);ray.setFromCamera(point,scene.camera);
    const hits=ray.intersectObjects(m.slices.map(a=>a.g),true);for(const h of hits){let obj=h.object;while(obj&&obj.userData.pizzaIndex===undefined)obj=obj.parent;if(obj&&obj.userData.pizzaIndex!==undefined){selectSlice(obj.userData.pizzaIndex);break;}}
  },{passive:true});}
  function transparentCanvas(){if(scene.renderer){scene.renderer.setClearColor(0x000000,0);scene.renderer.setClearAlpha(0);}if(scene.object3D)scene.object3D.background=null;if(scene.canvas){scene.canvas.style.background='transparent';scene.canvas.style.pointerEvents='auto';}}
  function checkCamera(){if(demo)return;const v=[...document.querySelectorAll('video')].find(v=>v.srcObject&&v.srcObject.getVideoTracks().length>0);
    if(!v)return;sourceCamera=v;
    // Show MindAR's ORIGINAL camera video rather than a second cloned camera. Preserve
    // its tracking-dependent dimensions/position and only fix its stacking visibility.
    v.style.zIndex='1';v.style.opacity='1';v.style.visibility='visible';v.style.pointerEvents='none';
    if(v.videoWidth&&v.readyState>=2)document.body.classList.add('camera-ready');
  }
  function cameraDebug(){const v=sourceCamera,can=scene.renderer?.getContextAttributes?.();$('cameraDebug').textContent=`Kamera: ${v?'ditemukan':'belum ditemukan'}\nResolusi: ${v?.videoWidth||0} × ${v?.videoHeight||0}\nVideo state: ${v?.readyState??'?' }\nStream aktif: ${v?.srcObject?.active??false}\nVideo CSS opacity: ${v?.style.opacity||'?'}\nWebGL transparan: ${can?.alpha??'?'}\nKartu terbaca: ${state.tracked}\n\nJika kamera hitam, coba Safari langsung (bukan browser di dalam aplikasi), izinkan kamera dan refresh.`;}
  function wire(){document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.tab)));
    document.querySelectorAll('[data-cut]').forEach(b=>b.addEventListener('click',()=>{setPieces(Number(b.dataset.cut),0);const m=model();if(m)m.separated=true;}));
    $('minus').addEventListener('click',()=>changePieces(-1));$('plus').addEventListener('click',()=>changePieces(1));$('separate').addEventListener('click',()=>{const m=model();if(m){m.toggleSplit();$('separate').textContent=m.separated?'Satukan ↙':'Pisahkan ↗';}});
    $('animate').addEventListener('click',animateMode);$('readMore').addEventListener('click',sayText);$('speak').addEventListener('click',sayText);
    $('collapse').addEventListener('click',()=>{const collapsed=$('infoPanel').classList.toggle('collapsed');$('collapse').textContent=collapsed?'+':'−';});
    $('missionMinus').addEventListener('click',()=>changePieces(-1));$('missionPlus').addEventListener('click',()=>changePieces(1));$('missionHint').addEventListener('click',missionHint);$('missionCheck').addEventListener('click',checkMission);$('missionNext').addEventListener('click',nextMission);$('missionClose').addEventListener('click',()=>setTab('intro'));
    $('missionChoices').addEventListener('click',e=>{const b=e.target.closest('[data-answer]');if(!b)return;state.chosenAnswer=b.dataset.answer;renderMission();});
    $('cameraInfo').addEventListener('click',()=>{$('cameraDebug').classList.toggle('hidden');cameraDebug()});}
  function boot(){wire();setTab('intro');
    scene.addEventListener('loaded',()=>{transparentCanvas();wirePicking();syncModel()});if(scene.hasLoaded){transparentCanvas();wirePicking();syncModel()}
    if(demo){state.tracked=true;$('scanHint').classList.add('hidden');return;}
    for(let i=0;i<4;i++){const e=$(`target${i}`);e.addEventListener('targetFound',()=>{switchCard(i)});e.addEventListener('targetLost',()=>{if(state.card===i){state.tracked=false;$('status').textContent='◎ Arahkan kamera ke kartu';$('scanHint').classList.remove('hidden');}});}
    scene.addEventListener('arReady',()=>{$('status').textContent='◎ Kamera siap · scan kartu';transparentCanvas();checkCamera()});
    scene.addEventListener('arError',()=>{$('status').textContent='⚠️ Kamera gagal dibuka';announce('Pastikan HTTPS dan izin kamera Safari aktif.')});
    let attempts=0;const interval=setInterval(()=>{transparentCanvas();checkCamera();if(!$('cameraDebug').classList.contains('hidden'))cameraDebug();if(++attempts>180)clearInterval(interval)},700);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden){transparentCanvas();checkCamera()}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
