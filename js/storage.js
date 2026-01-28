// storage.js — localStorage helpers for progress and simple auth
const KEY_COMPLETED = 'ai_learning.completedLessons';
const KEY_USER = 'ai_learning.user';

export const storage = {
  getCompleted(){
    try{ return JSON.parse(localStorage.getItem(KEY_COMPLETED) || '[]'); }catch(e){return []}
  },
  markCompleted(lessonId){
    const arr = new Set(this.getCompleted()); arr.add(String(lessonId));
    localStorage.setItem(KEY_COMPLETED, JSON.stringify([...arr]));
  },
  isCompleted(lessonId){
    return this.getCompleted().includes(String(lessonId));
  },
  clearCompleted(){ localStorage.removeItem(KEY_COMPLETED); },

  // Very small client-only auth simulation
  login(email){
    localStorage.setItem(KEY_USER, JSON.stringify({ email }));
  },
  logout(){ localStorage.removeItem(KEY_USER); },
  currentUser(){
    try{return JSON.parse(localStorage.getItem(KEY_USER));}catch(e){return null}
  }
}
