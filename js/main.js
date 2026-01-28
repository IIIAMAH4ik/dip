// main.js — page router and page-specific behavior
import { fetchJSON } from './api.js';
import { renderCourseCard, chatWidget } from './ui.js';
import { storage } from './storage.js';

function qs(name){
  return new URLSearchParams(location.search).get(name);
}

document.addEventListener('DOMContentLoaded', async ()=>{
  const page = document.body.dataset.page;
  try{
    if(page==='courses') await initCourses();
    if(page==='course') await initCourse();
    if(page==='lesson') await initLesson();
    if(page==='profile') await initProfile();
    if(page==='auth') initAuth();
    if(document.getElementById('openChat')){
      document.getElementById('openChat').addEventListener('click', (e)=>{
        const btn=e.currentTarget; const expanded = btn.getAttribute('aria-expanded') === 'true';
        if(expanded){ chatWidget.close(); btn.setAttribute('aria-expanded','false'); } else { chatWidget.openWidget(); btn.setAttribute('aria-expanded','true'); }
      });
    }
  }catch(err){ console.error(err); }
});

async function initCourses(){
  const list = document.getElementById('coursesList');
  try{
    const data = await fetchJSON('/data/courses.json');
    const categories = new Set(data.map(c=>c.category));
    const filter = document.getElementById('categoryFilter');
    categories.forEach(cat=>{ const o=document.createElement('option'); o.value=cat; o.textContent=cat; filter.appendChild(o); });

    const render = (items)=>{
      list.innerHTML='';
      if(!items.length){ list.innerHTML='<div class="empty-state">No courses found.</div>'; return }
      items.forEach(c=>list.appendChild(renderCourseCard(c)));
    };

    render(data);
    document.getElementById('search').addEventListener('input', (e)=>{
      const q=e.target.value.toLowerCase(); const cat=filter.value;
      render(data.filter(c=>c.title.toLowerCase().includes(q) && (cat?c.category===cat:true)));
    });
    filter.addEventListener('change', ()=>{ document.getElementById('search').dispatchEvent(new Event('input')); });
  }catch(err){ list.innerHTML = `<div class="empty-state">Failed to load courses.</div>` }
}

async function initCourse(){
  const id = qs('id'); const out = document.getElementById('courseOverview');
  if(!id) { out.innerHTML = '<div class="empty-state">No course specified.</div>'; return }
  try{
    const courses = await fetchJSON('/data/courses.json');
    const lessons = await fetchJSON('/data/lessons.json');
    const course = courses.find(c=>String(c.id)===String(id));
    if(!course) { out.innerHTML = '<div class="empty-state">Course not found.</div>'; return }
    const courseLessons = lessons.filter(l=>String(l.courseId)===String(id));
    out.innerHTML = `
      <section class="card">
        <h1>${escapeHtml(course.title)}</h1>
        <p>${escapeHtml(course.description)}</p>
        <h3>Syllabus</h3>
        <ol id="syllabus"></ol>
      </section>
    `;
    const list = out.querySelector('#syllabus');
    courseLessons.forEach(l=>{
      const li=document.createElement('li');
      li.innerHTML = `<a href="/pages/lesson.html?id=${encodeURIComponent(l.id)}">${escapeHtml(l.title)}</a>`;
      list.appendChild(li);
    });
  }catch(err){ out.innerHTML = '<div class="empty-state">Failed to load course.</div>' }
}

async function initLesson(){
  const id = qs('id'); const out = document.getElementById('lessonContent'); const quizArea = document.getElementById('quizArea');
  if(!id){ out.innerHTML = '<div class="empty-state">No lesson specified.</div>'; return }
  try{
    const lessons = await fetchJSON('/data/lessons.json');
    const lesson = lessons.find(l=>String(l.id)===String(id));
    if(!lesson){ out.innerHTML = '<div class="empty-state">Lesson not found.</div>'; return }
    // Expose lesson context for AI
    window.__lessonContext = { id: lesson.id, title: lesson.title, summary: lesson.summary };

    out.innerHTML = `
      <h1>${escapeHtml(lesson.title)}</h1>
      <p class="muted">${escapeHtml(lesson.summary || '')}</p>
      <div class="lesson-body">${lesson.content}</div>
    `;

    const mark = document.getElementById('markComplete');
    const updateMark = ()=>{ if(storage.isCompleted(id)){ mark.textContent='Completed'; mark.disabled=true; mark.classList.add('ghost'); } };
    mark.addEventListener('click', ()=>{ storage.markCompleted(id); updateMark(); });
    updateMark();

    // Quiz
    const quizzes = await fetchJSON('/data/quizzes.json');
    const q = quizzes.find(x=>String(x.lessonId)===String(id));
    if(q){ renderQuiz(q, quizArea); } else { quizArea.innerHTML=''; }
  }catch(err){ out.innerHTML = '<div class="empty-state">Failed to load lesson.</div>' }
}

function renderQuiz(q, container){
  container.innerHTML = '';
  const wrap = document.createElement('div'); wrap.className='card';
  wrap.innerHTML = `<h3>Quiz: ${escapeHtml(q.title)}</h3><form id="quizForm"></form><div id="quizResult" aria-live="polite"></div>`;
  container.appendChild(wrap);
  const form = wrap.querySelector('#quizForm');
  q.questions.forEach((ques, i)=>{
    const div = document.createElement('div'); div.className='quiz-question';
    div.innerHTML = `<div>${escapeHtml(ques.q)}</div>`;
    const opts = document.createElement('div'); opts.className='quiz-options';
    ques.options.forEach((opt,j)=>{
      const id = `q${i}o${j}`;
      const label = document.createElement('label');
      label.innerHTML = `<input type="radio" name="q${i}" value="${escapeHtml(opt)}" id="${id}"> ${escapeHtml(opt)}`;
      opts.appendChild(label);
    });
    div.appendChild(opts); form.appendChild(div);
  });
  const submit = document.createElement('button'); submit.className='btn'; submit.textContent='Submit Quiz';
  form.appendChild(submit);
  form.addEventListener('submit',(ev)=>{
    ev.preventDefault(); const fm = new FormData(form); let score=0; q.questions.forEach((ques,i)=>{ const ans=fm.get('q'+i); if(ans===ques.answer) score++; });
    const res = wrap.querySelector('#quizResult'); res.innerHTML = `<div class="result">You scored ${score} / ${q.questions.length}</div>`;
    if(score===q.questions.length){ res.innerHTML += '<div class="muted">Great work!</div>' }
  });
}

async function initProfile(){
  try{
    const lessons = await fetchJSON('/data/lessons.json');
    const completed = storage.getCompleted();
    const container = document.getElementById('profileProgress');
    if(!completed.length){ container.innerHTML = '<div class="empty-state">You have not completed any lessons yet.</div>'; return }
    const list = document.createElement('div'); list.className='profile-list';
    lessons.filter(l=>completed.includes(String(l.id))).forEach(l=>{
      const el = document.createElement('div'); el.className='card'; el.innerHTML = `<strong>${escapeHtml(l.title)}</strong><div class="muted">${escapeHtml(l.summary||'')}</div>`; list.appendChild(el);
    });
    const pct = Math.round((list.children.length / lessons.length) * 100);
    container.innerHTML = `<div class="card"><h3>Overall Progress: ${pct}%</h3></div>`;
    container.appendChild(list);
  }catch(err){ document.getElementById('profileProgress').innerHTML='<div class="empty-state">Failed to load profile.</div>' }
}

function initAuth(){
  const form = document.getElementById('authForm'); const title = document.getElementById('authTitle'); const toggle = document.getElementById('toggleRegister'); const msg = document.getElementById('authMessage'); const submit = document.getElementById('submitBtn');
  let register=false;
  toggle.addEventListener('click', ()=>{ register=!register; title.textContent = register ? 'Register' : 'Login'; submit.textContent = register ? 'Register' : 'Login'; msg.textContent=''; });
  form.addEventListener('submit',(e)=>{ e.preventDefault(); const email=document.getElementById('email').value; const pass=document.getElementById('password').value; if(!email || pass.length<6){ msg.textContent='Please provide a valid email and password (min 6 chars).'; msg.className='muted'; return } storage.login(email); msg.textContent = register ? 'Registered (locally).' : 'Logged in (locally).'; msg.className='muted'; });
}

/* Small helpers */
function escapeHtml(s=''){ return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }
