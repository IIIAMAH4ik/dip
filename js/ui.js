// ui.js — small UI components: Chat widget and helpers
import { sendToAI } from './api.js';
import { storage } from './storage.js';

class ChatWidget{
  constructor(){
    this.open=false;
    this.container = null;
    this._init();
  }
  _init(){
    this.container = document.createElement('div');
    this.container.className='chat-widget';
    this.container.setAttribute('role','dialog');
    this.container.setAttribute('aria-label','AI Assistant');
    this.container.innerHTML = `
      <div class="chat-header"><strong>AI Assistant</strong><button aria-label="Close chat" class="closeChat">×</button></div>
      <div class="chat-messages" id="chatMessages"></div>
      <div class="chat-input">
        <input id="chatInput" aria-label="Message to assistant" placeholder="Ask the assistant...">
        <button id="sendChat">Send</button>
      </div>
    `;
    document.body.appendChild(this.container);
    this.messages = this.container.querySelector('#chatMessages');
    this.input = this.container.querySelector('#chatInput');
    this.container.querySelector('.closeChat').addEventListener('click',()=>this.close());
    this.container.querySelector('#sendChat').addEventListener('click',()=>this._send());
    this.input.addEventListener('keyup',(e)=>{ if(e.key==='Enter') this._send(); });
    this.container.style.display='none';
  }
  openWidget(){ this.container.style.display='flex'; this.open=true; this.input.focus(); }
  close(){ this.container.style.display='none'; this.open=false; }
  appendMessage(text, who='assistant'){
    const el = document.createElement('div'); el.className = 'chat-'+who; el.textContent = text; this.messages.appendChild(el); this.messages.scrollTop = this.messages.scrollHeight;
  }
  async _send(){
    const text = this.input.value.trim(); if(!text) return;
    this.appendMessage(text,'user'); this.input.value='';
    const typing = document.createElement('div'); typing.className='muted'; typing.textContent='Assistant is typing…'; this.messages.appendChild(typing);
    try{
      const lessonContext = window.__lessonContext || null;
      const res = await sendToAI({ lessonContext, message:text, mode:'assistant' });
      typing.remove();
      this.appendMessage(res.replyText || 'Sorry, no reply.');
    }catch(err){
      typing.textContent = 'Error contacting assistant';
    }
  }
}

export const chatWidget = new ChatWidget();

// Helper to render course card
export function renderCourseCard(course){
  const el = document.createElement('article'); el.className='card';
  el.innerHTML = `
    <h3>${escapeHtml(course.title)}</h3>
    <p>${escapeHtml(course.description)}</p>
    <p class="muted">Category: ${escapeHtml(course.category)}</p>
    <a class="btn" href="/pages/course.html?id=${encodeURIComponent(course.id)}">Open</a>
  `;
  return el;
}

function escapeHtml(s=''){ return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }
