import { makeReader, write, connectWallet, activeAccount, balanceOf, short, toGen, GEN, fmtErr }
  from "./shared/genlayer-lite.js";

const CONTRACT = "0x76cd3670fCcF415B78E8f43C580ef21A7dd419b4";
const EXPLORER = "https://explorer-studio.genlayer.com/address/0x76cd3670fCcF415B78E8f43C580ef21A7dd419b4";
const { read } = makeReader(CONTRACT);
const PENDING = 0, FUNDED = 1, REJECTED = 2;
const STLABEL = ["Pending", "Funded", "Rejected"];
const BADGE = ["b-pending", "b-funded", "b-rejected"];
let account = null, proposals = [], rubric = "", treasury = "0";
const $ = (id) => document.getElementById(id);
const esc = (s) => (s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

$("contractLink").href = "https://explorer-studio.genlayer.com/address/0x76cd3670fCcF415B78E8f43C580ef21A7dd419b4";
$("contractLink").textContent = "Contract " + short(CONTRACT) + " ->";
$("contractLink").target = "_blank";
$("contractLink").rel = "noopener";

function toast(msg, kind = "", title = "quorum") {
  const el = document.createElement("div"); el.className = "toast " + kind;
  el.innerHTML = `<span class="tt">${title}</span>`; el.appendChild(document.createTextNode(msg));
  $("log").appendChild(el); setTimeout(() => el.remove(), kind === "err" ? 15000 : 5000);
}

async function refreshWallet() {
  account = await activeAccount();
  const slot = $("walletslot");
  if (account) { let bal = 0n; try { bal = await balanceOf(account); } catch (_) {} slot.innerHTML = `<span class="mono" style="font-size:12.5px;color:var(--txt2)">${short(account)} / ${toGen(bal)} GEN</span>`; }
  else { slot.innerHTML = `<button class="btn ghost sm" id="connectBtn">Connect</button>`; $("connectBtn").onclick = doConnect; }
}
async function doConnect() { try { account = await connectWallet(); toast("Connected on studionet.", "ok"); await refreshWallet(); } catch (e) { toast(fmtErr(e), "err"); } }
async function ensureWallet() { if (!account) account = await connectWallet(); await refreshWallet(); }

async function load() {
  try {
    rubric = await read("get_rubric");
    treasury = await read("get_treasury");
    $("rubricText").textContent = rubric && rubric.trim() ? rubric : "No rubric set yet.";
    const tGen = toGen(treasury);
    $("stTreasury").textContent = tGen; $("winTreasury").textContent = tGen;
    const count = Number(await read("get_proposal_count"));
    const out = [];
    for (let i = 0; i < count; i++) out.push({ id: i, ...(await read("get_proposal", [i])) });
    proposals = out; renderList(); renderWindow();
    $("propCount").textContent = count + (count === 1 ? " proposal" : " proposals");
    $("stTotal").textContent = count;
    const funded = out.filter((p) => Number(p.status) === FUNDED).length;
    const rejected = out.filter((p) => Number(p.status) === REJECTED).length;
    const pending = out.filter((p) => Number(p.status) === PENDING).length;
    $("stFunded").textContent = funded;
    $("winFunded").textContent = funded; $("winPending").textContent = pending; $("winRejected").textContent = rejected;
  } catch (e) { $("propList").innerHTML = `<div class="pl-empty">Could not reach the chain. ${fmtErr(e)}</div>`; }
}

function renderWindow() {
  const el = $("winProp");
  const featured = proposals.find((p) => Number(p.status) === FUNDED) || proposals[proposals.length - 1];
  if (!featured) { el.innerHTML = `<div class="wp-empty">No proposals yet.</div>`; return; }
  const st = Number(featured.status);
  el.innerHTML = `<div class="wp-top"><span class="wp-badge ${BADGE[st]}">${STLABEL[st]}</span><span class="wp-amt">${toGen(featured.amount)} GEN</span></div>
    <div class="wp-title">${esc(featured.title)}</div>`;
}

function renderList() {
  const el = $("propList");
  if (!proposals.length) { el.innerHTML = `<div class="pl-empty">No proposals yet. Be the first to request a grant.</div>`; return; }
  el.innerHTML = "";
  [...proposals].reverse().forEach((p) => {
    const st = Number(p.status);
    const row = document.createElement("div"); row.className = "prop";
    row.innerHTML = `<div class="prop-l"><div class="prop-title">${esc(p.title)}</div><div class="prop-sum">${esc(p.summary)}</div></div>
      <div class="prop-r"><span class="prop-amt">${toGen(p.amount)} GEN</span><span class="badge ${BADGE[st]}">${STLABEL[st]}</span></div>
      ${(st !== PENDING && p.rationale) ? `<div class="prop-reason">${esc(p.rationale)}</div>` : ""}`;
    row.onclick = () => openDetail(p.id);
    el.appendChild(row);
  });
}

function openDrawer() { $("scrim").classList.add("on"); $("drawer").classList.add("on"); }
function closeDrawer() { $("scrim").classList.remove("on"); $("drawer").classList.remove("on"); }

function openNew() {
  $("drawerTitle").textContent = "New grant proposal";
  $("drawerBody").innerHTML = `
    <div class="doc">
      <input id="nTitle" class="doc-title" maxlength="90" placeholder="Proposal title" autocomplete="off" />
      <div class="rubric-mini" style="margin:4px 0 16px"><b>Funding rubric</b>${esc(rubric) || "No rubric set yet."}</div>
      <textarea id="nSummary" class="doc-body" placeholder="Write the plan. What you'll ship, why it grows the ecosystem, how it stays public and maintained \u2014 the rubric is judged against this."></textarea>
      <div class="doc-foot"><span class="amt-l">Requested</span><span class="amt"><input id="nAmount" type="number" min="0" step="0.5" value="5" /> GEN</span><button class="btn primary" id="createBtn">Submit request</button></div>
    </div>`;
  $("createBtn").onclick = doCreate; openDrawer();
}

function openDetail(id) {
  const p = proposals.find((x) => x.id === id); if (!p) return;
  const st = Number(p.status);
  $("drawerTitle").textContent = "Proposal #" + id;
  let verdict = "";
  if (st === FUNDED) verdict = `<div class="verdict-box vb-ok"><b>Funded.</b> ${p.rationale ? esc(p.rationale) : "Met the rubric - paid from the treasury."}</div>`;
  if (st === REJECTED) verdict = `<div class="verdict-box vb-no"><b>Rejected.</b> ${p.rationale ? esc(p.rationale) : "Did not meet the rubric."}</div>`;
  const actions = st === PENDING
    ? `<button class="btn primary block" id="evalBtn"><i class="ph-bold ph-scales"></i> Run AI evaluation</button><div class="hint" style="text-align:center;margin-top:8px">Validators read the plan against the rubric. Calls a real LLM; if approved the treasury pays out in the same transaction.</div>`
    : "";
  $("drawerBody").innerHTML = `
    <div class="d-title">${esc(p.title)}</div>
    <div class="d-amt">${toGen(p.amount)} GEN</div>
    ${verdict}
    <div class="kv"><span class="k">PLAN</span><span class="v">${esc(p.summary)}</span></div>
    <div class="kv"><span class="k">PROPOSER</span><span class="v mono">${short(p.proposer)}</span></div>
    <div class="kv"><span class="k">STATUS</span><span class="v">${STLABEL[st]}</span></div>
    <div style="margin-top:16px">${actions}</div>`;
  openDrawer();
  if (st === PENDING) $("evalBtn").onclick = () => doEvaluate(id);
}

async function doCreate() {
  const title = $("nTitle").value.trim(), summary = $("nSummary").value.trim(), amount = parseFloat($("nAmount").value);
  if (!title) return toast("Give the proposal a title.", "err");
  if (!summary) return toast("Describe the plan.", "err");
  if (!(amount > 0)) return toast("Amount must be above zero.", "err");
  const btn = $("createBtn"); btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> submitting';
  try { await ensureWallet(); await write(CONTRACT, "request_grant", [title, summary, GEN(amount)]); toast("Proposal submitted.", "ok"); closeDrawer(); await load(); }
  catch (e) { toast(fmtErr(e), "err"); btn.disabled = false; btn.innerHTML = "Submit request"; }
}
async function doEvaluate(id) {
  if (!confirm("Run AI evaluation? Validators read the plan against the rubric. Calls a real LLM; if approved, the treasury pays out.")) return;
  const btn = $("evalBtn"); btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> validators reviewing';
  try { await ensureWallet(); toast("Validators reading the plan...", "", "evaluate"); await write(CONTRACT, "evaluate", [id]); toast("Evaluated on-chain.", "ok"); closeDrawer(); await load(); }
  catch (e) { toast(fmtErr(e), "err"); if (btn) { btn.disabled = false; btn.textContent = "Run AI evaluation"; } }
}

function fund() {
  $("drawerTitle").textContent = "Fund the treasury";
  $("drawerBody").innerHTML = `
    <p>Top up the shared treasury. Anyone can contribute GEN; approved grants are paid out of this pool.</p>
    <label>Amount (GEN)</label><input id="fAmount" type="number" min="0" step="1" value="10" />
    <button class="btn primary block" id="fundBtn"><i class="ph-bold ph-hand-coins"></i> Fund treasury</button>`;
  $("fundBtn").onclick = doFund; openDrawer();
}
async function doFund() {
  const amount = parseFloat($("fAmount").value);
  if (!(amount > 0)) return toast("Amount must be above zero.", "err");
  const btn = $("fundBtn"); btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> funding';
  try { await ensureWallet(); await write(CONTRACT, "fund", [], GEN(amount)); toast("Treasury funded.", "ok"); closeDrawer(); await load(); }
  catch (e) { toast(fmtErr(e), "err"); btn.disabled = false; btn.innerHTML = "Fund treasury"; }
}

$("heroPostBtn").onclick = openNew;
$("ctaPostBtn").onclick = openNew;
$("navPostBtn").onclick = openNew;
$("refreshBtn").onclick = load;
$("closeDrawer").onclick = closeDrawer;
$("scrim").onclick = closeDrawer;
$("winTreasury").parentElement.parentElement.addEventListener("dblclick", fund); // hidden: dbl-click treasury to fund
const _cb = $("connectBtn"); if (_cb) _cb.onclick = doConnect;
if (window.ethereum) window.ethereum.on?.("accountsChanged", refreshWallet);

refreshWallet();
load();

// ====== Linear-style dark aurora (Three.js shader) ======
(function aurora() {
  const canvas = $("auroraCanvas"); if (!canvas || !window.THREE) return;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const uniforms = { t: { value: 0 } };
  const mat = new THREE.ShaderMaterial({
    uniforms, transparent: true,
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }`,
    fragmentShader: `
      precision highp float; varying vec2 vUv; uniform float t;
      float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123); }
      float noise(vec2 p){ vec2 i=floor(p),f=fract(p); vec2 u=f*f*(3.0-2.0*f);
        return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),u.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),u.x),u.y); }
      float fbm(vec2 p){ float v=0.0,a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.0; a*=0.5; } return v; }
      vec3 c1=vec3(0.043,0.047,0.090);
      vec3 c2=vec3(0.369,0.416,0.820);
      vec3 c3=vec3(0.486,0.529,1.0);
      vec3 c4=vec3(0.616,0.420,0.937);
      void main(){
        vec2 u=vUv; vec2 p=u*3.0; p.x*=1.6; float tt=t*0.08;
        vec2 q=vec2(fbm(p+vec2(0.0,tt)),fbm(p+vec2(5.2,1.3-tt)));
        vec2 r=vec2(fbm(p+4.0*q+vec2(1.7,9.2)+tt*0.5),fbm(p+4.0*q+vec2(8.3,2.8)-tt*0.5));
        float f=fbm(p+4.0*r);
        vec3 col=mix(c1,c2,clamp(f*f*2.0,0.0,1.0));
        col=mix(col,c3,clamp(length(q),0.0,1.0));
        col=mix(col,c4,clamp(r.x*0.9,0.0,1.0));
        float fall=smoothstep(1.05,0.05,u.y);
        float alpha=(0.10+0.55*f)*fall;
        gl_FragColor=vec4(col,clamp(alpha,0.0,0.62));
      }`,
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
  function resize() { const w = canvas.clientWidth, h = canvas.clientHeight || 500; renderer.setSize(w, h, false); }
  resize(); addEventListener("resize", resize);
  let running = true;
  const vis = new IntersectionObserver((es) => { running = es[0].isIntersecting; if (running) loop(); }, { threshold: 0 });
  vis.observe(canvas);
  function loop() { if (!running) return; requestAnimationFrame(loop); uniforms.t.value += 0.01; renderer.render(scene, camera); }
  loop();
})();

