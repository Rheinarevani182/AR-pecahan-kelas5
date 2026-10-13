/* Pizza Lab AR – procedural 3D and learning interaction. No separate GLB required.
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
  const modelEl = $('pizzaModel');
  const game = { mode:'explore', count:4, selected:new Set(), level:0, won:false, sound:false, tracked:demo, lastIndex:0 };
  const tasks = [{n:2,k:1},{n:4,k:3},{n:8,k:5}];
  const model = () => modelEl?.components?.['pizza-lab'];
  let toastTimer, audioCtx;
  function chirp(win) {
    if (!game.sound) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
      osc.type = 'sine'; osc.frequency.setValueAtTime(win?680:440,audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(win?1000:350,audioCtx.currentTime+.13);
      gain.gain.setValueAtTime(.06,audioCtx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+.18);
      osc.connect(gain).connect(audioCtx.destination);osc.start();osc.stop(audioCtx.currentTime+.2);
    } catch(_) {}
  }
  function toast(message) {
    const t=$('toast'); t.textContent=message;t.classList.add('show'); clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>t.classList.remove('show'),2350);
  }
  function celebrate() {
    const box=$('celebration'); box.innerHTML='';
    for(let i=0;i<22;i++) {
      const e=document.createElement('span');e.className='confetti';
      e.style.setProperty('--c',['#ff8e42','#ffdb63','#8c6cfa','#62d7b8'][i%4]);
      e.style.setProperty('--tx',((i*107)%400-200)+'px');
      e.style.setProperty('--ty',(-100-(i*71)%220)+'px');
      e.style.setProperty('--rot',(i*89)+'deg');box.appendChild(e);
    }
    setTimeout(()=>{box.innerHTML=''},1550);
  }
  function renderUI() {
    $('fractionText').textContent=game.selected.size+'/'+game.count;
    const challenge = game.mode==='challenge';
    $('exploreSection').classList.toggle('hidden',challenge);
    $('challengeSection').classList.toggle('hidden',!challenge);
    $('modeTitle').textContent=challenge?'Misi Pizza!':'Bikin Pecahanmu!';
    document.querySelectorAll('[data-cut]').forEach(b=>b.classList.toggle('selected',Number(b.dataset.cut)===game.count));
    document.querySelectorAll('[data-mode-select]').forEach(b=>b.classList.toggle('selected',b.dataset.modeSelect===game.mode));
    const p=model(); if(p) $('spread').textContent = p.separated ? '↙ Satukan' : '↗ Pisahkan';
    $('explain').textContent = `Kamu memilih ${game.selected.size} dari ${game.count} bagian. Ketuk potongan pizza untuk mengubah pilihan.`;
    const task=tasks[Math.min(game.level,tasks.length-1)];
    $('challengePrompt').textContent=game.won?(game.level>=tasks.length?'Semua misi selesai! ✨':'Mantap! Lanjut tantangan berikutnya!'):`Pilih ${task.k} dari ${task.n} potongan pizza!`;
    $('starProgress').textContent=Array.from({length:3},(_,i)=>i<game.level?'★':'☆').join(' ');
    $('checkAnswer').classList.toggle('hidden',game.won);
    $('nextChallenge').classList.toggle('hidden',!game.won);
    $('nextChallenge').textContent=game.level>=tasks.length-1?'Main lagi ↺':'Misi berikutnya →';
  }
  function syncSlices() {
    const m=model(); if(m){if(m.count!==game.count)m.setCount(game.count);m.selected=new Set(game.selected);}
    renderUI();
  }
  function setCount(n){game.count=n;game.selected.clear();game.won=false;syncSlices();chirp(false)}
  function changeCountSelected(delta){
    const target=Math.max(0,Math.min(game.count,game.selected.size+delta));
    game.selected.clear();for(let i=0;i<target;i++)game.selected.add(i);
    syncSlices();chirp(false);
  }
  function toggleSlice(i) {if(game.won)return;game.selected.has(i)?game.selected.delete(i):game.selected.add(i);syncSlices();chirp(false)}
  function resetSelection(){game.selected.clear();syncSlices()}
  function newTask(){ const t=tasks[game.level];game.count=t.n;game.selected.clear();game.won=false;syncSlices();toast('Tantangan baru! Ketuk pizzanya 🍕');}
  function chooseMode(next){game.mode=next;game.level=0;game.won=false;game.selected.clear();if(next==='challenge')newTask();else{game.count=4;syncSlices();}}
  function checkAnswer(){
    const t=tasks[game.level];
    if(game.selected.size===t.k){game.won=true;game.level++;chirp(true);celebrate();toast('Hebat! Jawabanmu tepat! ⭐');}
    else{chirp(false);toast(`Belum tepat. Pilih ${t.k} potongan yaa!`);}
    renderUI();
  }
  function nextTask(){if(game.level>=tasks.length) game.level=0;newTask()}
  function wireButtons(){
    document.querySelectorAll('[data-cut]').forEach(b=>b.addEventListener('click',()=>setCount(Number(b.dataset.cut))));
    document.querySelectorAll('[data-mode-select]').forEach(b=>b.addEventListener('click',()=>chooseMode(b.dataset.modeSelect)));
    $('plus').addEventListener('click',()=>changeCountSelected(1));
    $('minus').addEventListener('click',()=>changeCountSelected(-1));
    $('spread').addEventListener('click',()=>{const m=model();if(m){m.toggleSplit();renderUI();chirp(false)}});
    $('resetAll').addEventListener('click',()=>{chooseMode('explore');setCount(4);toast('Mulai lagi yuk! 🍕')});
    $('clearSelection').addEventListener('click',resetSelection);
    $('addChallenge').addEventListener('click',()=>changeCountSelected(1));
    $('checkAnswer').addEventListener('click',checkAnswer);
    $('nextChallenge').addEventListener('click',nextTask);
    $('soundButton').addEventListener('click',()=>{game.sound=!game.sound;$('soundButton').textContent=game.sound?'🔊':'🔇';$('soundButton').title=game.sound?'Matikan suara':'Nyalakan suara';chirp(true)});
  }
  // Real 3D hit test: tap a mesh directly, including its toppings.
  function wire3DPicking(){
    const canvas=scene.canvas;
    if(!canvas)return;
    const ray=new T.Raycaster(),coords=new T.Vector2();
    canvas.addEventListener('pointerup',evt=>{
      if(!game.tracked || game.won || !model() || !scene.camera)return;
      const rect=canvas.getBoundingClientRect();
      coords.x=((evt.clientX-rect.left)/rect.width)*2-1;
      coords.y=-((evt.clientY-rect.top)/rect.height)*2+1;
      scene.camera.updateMatrixWorld(true);ray.setFromCamera(coords,scene.camera);
      const hits=ray.intersectObjects(model().slices.map(x=>x.g),true);
      for(const hit of hits){let item=hit.object;
        while(item && item.userData.pizzaIndex===undefined)item=item.parent;
        if(item && typeof item.userData.pizzaIndex==='number'){toggleSlice(item.userData.pizzaIndex);break;}
      }
    },{passive:true});
  }
  // Transparent WebGL must be layered OVER, not INSTEAD OF, the live camera feed.
  function transparentRenderer(){
    if(scene.renderer){scene.renderer.setClearColor(0x000000,0);scene.renderer.setClearAlpha(0);}
    if(scene.object3D)scene.object3D.background=null;
    if(scene.canvas) {scene.canvas.style.backgroundColor='transparent';scene.canvas.style.pointerEvents='auto';}
  }
  function badge(message,found,error){
    $('scanStatus').textContent=message;
    $('scanBadge').classList.toggle('is-found',Boolean(found));
    $('scanBadge').classList.toggle('is-error',Boolean(error));
  }
  let sourceCamera=null, cameraStatus='Menunggu kamera', cloneStatus='Belum tersambung';
  function inspectCamera(){
    if(demo)return;
    // MindAR camera is the element with a real MediaStream; exclude our clone.
    const source=[...document.querySelectorAll('video')].find(v=>v!==$('cameraBackdrop') && v.srcObject && v.srcObject.getVideoTracks && v.srcObject.getVideoTracks().length);
    if(!source) {cameraStatus='Stream kamera belum ditemukan';return;}
    sourceCamera=source;
    const v=$('cameraBackdrop');
    if(v.srcObject!==source.srcObject){
      v.srcObject=source.srcObject;v.muted=true;v.setAttribute('playsinline','');
      const onPicture=()=>{
        if(v.videoWidth && v.readyState>=2){document.body.classList.add('camera-ready');cloneStatus=`Gambar ${v.videoWidth}x${v.videoHeight}`;
          // Do not set display:none on MindAR video: that video is still used by tracking.
          sourceCamera.style.pointerEvents='none';
          sourceCamera.style.opacity='0';
        }
      };
      v.addEventListener('loadeddata',onPicture);
      v.addEventListener('playing',onPicture);
      v.play().then(onPicture).catch(e=>{cloneStatus='Preview belum dimainkan: '+e.name;});
    }
    if(v.videoWidth && v.readyState>=2) {document.body.classList.add('camera-ready');cloneStatus=`Gambar ${v.videoWidth}x${v.videoHeight}`;}
    const live=source.srcObject.getVideoTracks().some(t=>t.readyState==='live');
    cameraStatus=`Sumber: ${source.videoWidth||'?'}x${source.videoHeight||'?'}; track ${live?'live':'tidak aktif'}`;
    if(!game.tracked && live)badge('Kamera aktif • scan kartu pizza',false,false);
  }
  function debugCamera(){
    const v=$('cameraBackdrop');const source=sourceCamera;
    $('cameraDebug').textContent = `INFO KAMERA\n${cameraStatus}\nPreview: ${cloneStatus}\nvideo.readyState: ${v.readyState}\nSumber kamera: ${Boolean(source)}\nStream aktif: ${Boolean(source&&source.srcObject&&source.srcObject.active)}\nWebGL alpha: ${Boolean(scene.renderer&&scene.renderer.getContextAttributes().alpha)}\nTarget terdeteksi: ${game.tracked}\n\nJika preview masih gelap, kirim screenshot panel ini.`;
  }
  function setupAR(){
    const targets=[0,1,2,3].map(i=>document.querySelectorAll('[mindar-image-target]')[i]);
    targets.forEach((el,i)=>{
      el.addEventListener('targetFound',()=>{
        game.tracked=i===0;
        $('scanGuide').classList.add('hidden');
        badge(i===0?'Kartu pizza terdeteksi ✓':`Kartu ${i+1} terdeteksi ✓`,true,false);
        if(i!==0)toast(`Kartu ${i+1} masih prototype materi. Coba kartu pizza!`);
      });
      el.addEventListener('targetLost',()=>{
        game.tracked=false;$('scanGuide').classList.remove('hidden');
        badge('Arahkan kamera ke kartu pizza',false,false);
      });
    });
    scene.addEventListener('arReady',()=>{transparentRenderer();inspectCamera();badge('Kamera siap • scan kartu pizza',false,false)});
    scene.addEventListener('arError',()=>{badge('AR gagal · cek izin kamera',false,true);toast('Periksa izin kamera Safari dan HTTPS');});
    let attempts=0;
    const interval=setInterval(()=>{
      transparentRenderer();inspectCamera();
      if($('cameraDebug')&&!$('cameraDebug').classList.contains('hidden'))debugCamera();
      if(++attempts>75)clearInterval(interval);
    },650);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden) {inspectCamera();transparentRenderer();}});
    $('debugToggle').addEventListener('click',()=>{$('cameraDebug').classList.toggle('hidden');debugCamera()});
  }
  function boot(){
    wireButtons();renderUI();
    scene.addEventListener('loaded',()=>{transparentRenderer();wire3DPicking();syncSlices();});
    if(scene.hasLoaded){transparentRenderer();wire3DPicking();syncSlices();}
    if(!demo)setupAR(); else {$('scanGuide').classList.add('hidden');game.tracked=true;}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot); else boot();
})();
