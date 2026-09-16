
async function initDaapvRole() {
  try {
    const token=localStorage.getItem('daapv_session'); if(!token) return;
    const r=await fetch('/api/auth/me',{headers:{Authorization:'Bearer '+token}});
    const me=await r.json().catch(()=>({})); if(!r.ok || !me.role) return;
    localStorage.setItem('daapv_role',me.role);
    const roleEls=document.querySelectorAll('#systemRole,.role-badge');
    roleEls.forEach(e=>e.textContent=me.role);
    if(me.role==='OWNER') {
      if(!document.getElementById('daapvOwnerBtn')){
        const b=document.createElement('button'); b.id='daapvOwnerBtn'; b.className='daapv-owner-btn'; b.textContent='👑 Owner Panel';
        b.onclick=loadDaapvOwnerPanel; document.body.appendChild(b);
      }
    }
  } catch(e){}
}
async function loadDaapvOwnerPanel(){
  let p=document.getElementById('daapvOwnerPanel');
  if(!p){
    p=document.createElement('div'); p.id='daapvOwnerPanel';
    p.innerHTML=`<div class="daapv-owner-card"><div class="daapv-owner-head"><h2>👑 Daapv Owner</h2><button type="button" id="daapvOwnerClose">Tutup</button></div><div id="daapvOwnerOrders">Memuat...</div></div>`;
    document.body.appendChild(p);
    const closeBtn=document.getElementById('daapvOwnerClose'); if(closeBtn) closeBtn.onclick=()=>{p.style.display='none';};
  }
  p.style.display='block';
  const box=document.getElementById('daapvOwnerOrders');
  try{
    const token=localStorage.getItem('daapv_session');
    const r=await fetch('/api/owner/orders',{headers:{Authorization:'Bearer '+token}});
    const d=await r.json(); if(!r.ok) throw new Error(d.message);
    box.innerHTML=d.orders.length?d.orders.map(o=>`<div class="daapv-order"><b>${o.username}</b> • ${o.email}<br>Order: <code>${o.id}</code><br>Status: <b>${o.status}</b><br>Dibuat: ${new Date(o.created_at).toLocaleString('id-ID')}<div class="daapv-order-actions">${o.status!=='PAYMENT_APPROVED'?`<button class="daapv-approve" onclick="daapvApprove('${o.id}')">Setujui</button><button class="daapv-reject" onclick="daapvReject('${o.id}')">Tolak</button>`:''}</div></div>`).join(''):'Belum ada order.';
  }catch(e){box.textContent='❌ '+e.message;}
}
async function daapvOwnerAction(id,status){
 const token=localStorage.getItem('daapv_session');
 const r=await fetch('/api/owner/orders',{method:'PATCH',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({orderId:id,status})});
 const d=await r.json(); if(!r.ok) throw new Error(d.message||'Gagal');
 await loadDaapvOwnerPanel();
}
async function daapvApprove(id){try{await daapvOwnerAction(id,'PAYMENT_APPROVED');}catch(e){alert(e.message)}}
async function daapvReject(id){try{await daapvOwnerAction(id,'REJECTED');}catch(e){alert(e.message)}}
document.addEventListener('DOMContentLoaded',()=>setTimeout(initDaapvRole,500));
