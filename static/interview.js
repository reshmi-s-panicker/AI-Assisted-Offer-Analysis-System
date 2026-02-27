function toggleQ(el){
  const wasOpen=el.classList.contains('open');
  document.querySelectorAll('.q-item.open').forEach(q=>q.classList.remove('open'));
  if(!wasOpen) el.classList.add('open');
}

const CHECKLIST_ITEMS=[
  'Research the company — products, funding, recent news',
  'Re-read the job description, note key requirements',
  'Prepare 3 STAR stories for behavioral questions',
  'Review your resume top to bottom — know every line',
  'Prepare 3–5 thoughtful questions to ask the interviewer',
  "Test your video/audio setup if it's a virtual interview",
  'Plan your route / login link — be 10 min early',
  'Sleep 7–8 hours and eat a good meal before',
];

document.addEventListener('DOMContentLoaded',()=>{
  const container=document.getElementById('checklist');
  CHECKLIST_ITEMS.forEach((item,i)=>{
    const div=document.createElement('div');
    div.style.cssText='display:flex;align-items:flex-start;gap:10px;padding:10px 14px;background:var(--card);border:1px solid var(--border);border-radius:3px;cursor:pointer;transition:all .2s;font-size:.72rem;';
    div.innerHTML=`<span id="chk-${i}" style="width:14px;height:14px;border:1px solid var(--border);border-radius:2px;flex-shrink:0;margin-top:1px;display:flex;align-items:center;justify-content:center;font-size:.6rem;transition:all .2s;"></span><span>${item}</span>`;
    div.onclick=()=>{
      const chk=document.getElementById('chk-'+i);
      const checked=chk.textContent==='✓';
      chk.textContent=checked?'':'✓';
      chk.style.background=checked?'transparent':'var(--accent3)';
      chk.style.borderColor=checked?'var(--border)':'var(--accent3)';
      chk.style.color=checked?'':'var(--bg)';
      div.style.opacity=checked?'1':'.6';
    };
    container.appendChild(div);
  });
});
