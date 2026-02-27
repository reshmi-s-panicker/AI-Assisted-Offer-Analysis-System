function updatePreview(){
  const g=id=>document.getElementById(id)?.value||'';
  document.getElementById('pv_name').textContent       =g('r_name')        ||'Your Name';
  document.getElementById('pv_title').textContent      =g('r_title')       ||'Job Title / Role';
  document.getElementById('pv_email').textContent      =g('r_email')       ||'email@domain.com';
  document.getElementById('pv_phone').textContent      =g('r_phone')       ||'+91 XXXXXXXXXX';
  document.getElementById('pv_location').textContent   =g('r_location')    ||'Location';
  document.getElementById('pv_link').textContent       =g('r_link')        ||'linkedin.com/in/you';
  document.getElementById('pv_summary').textContent    =g('r_summary')     ||'Your summary will appear here...';
  document.getElementById('pv_company').textContent    =g('r_company')     ||'Company Name';
  document.getElementById('pv_role').textContent       =g('r_role')        ||'Role / Designation';
  document.getElementById('pv_duration').textContent   =g('r_duration')    ||'Duration';
  document.getElementById('pv_degree').textContent     =g('r_degree')      ||'Degree';
  document.getElementById('pv_institution').textContent=g('r_institution') ||'Institution';
  document.getElementById('pv_year').textContent       =g('r_year')        ||'Year';
  document.getElementById('pv_cgpa').textContent       =g('r_cgpa')        ||'CGPA';
  const ach=g('r_achievements').split('\n').filter(l=>l.trim());
  document.getElementById('pv_achievements').innerHTML=ach.map(l=>`<li>${l}</li>`).join('')||'<li style="color:var(--muted)">Achievements will appear here...</li>';
  const skills=g('r_skills').split(',').map(s=>s.trim()).filter(Boolean);
  document.getElementById('pv_skills').innerHTML=skills.map(s=>`<span class="tag tag-cyan" style="font-size:.62rem">${s}</span>`).join('')||'<span style="font-size:.68rem;color:var(--muted)">Skills will appear here...</span>';
  const certs=g('r_certs').split('\n').filter(l=>l.trim());
  document.getElementById('pv_certs').innerHTML=certs.map(c=>`<li>${c}</li>`).join('')||'<li style="color:var(--muted)">Certifications will appear here...</li>';
}

function exportResume(){
  const g=id=>document.getElementById(id)?.value||'';
  const text=`${g('r_name').toUpperCase()}\n${g('r_title')} | ${g('r_email')} | ${g('r_phone')} | ${g('r_location')}\n${g('r_link')}\n\nSUMMARY\n${g('r_summary')}\n\nEXPERIENCE\n${g('r_role')} — ${g('r_company')} (${g('r_duration')})\n${g('r_achievements').split('\n').map(l=>'• '+l).join('\n')}\n\nEDUCATION\n${g('r_degree')} — ${g('r_institution')} (${g('r_year')}) | ${g('r_cgpa')}\n\nSKILLS\n${g('r_skills')}\n\nCERTIFICATIONS\n${g('r_certs')}`.trim();
  const blob