// api.js — AI API stub and data helpers
// sendToAI({ lessonContext, message, mode }) -> Promise<{ replyText }>
export async function sendToAI({ lessonContext, message, mode = 'assistant' } = {}){
  // TODO: replace mock with real AI API fetch() call.
  // Example replacement:
  // return fetch('/api/ai', { method:'POST', body: JSON.stringify({ lessonContext, message, mode }) }).then(r=>r.json())

  // Mock response: simulate network + typing delay
  const canned = [
    `I can help explain that topic. Try summarizing what you already know.`,
    `Here's a short example you can try in your notes.`,
    `Good question — the key idea is to break it into smaller steps.`
  ];
  return new Promise((resolve) => {
    setTimeout(() => {
      const replyText = canned[Math.floor(Math.random()*canned.length)] + ' (mock reply)';
      resolve({ replyText });
    }, 900 + Math.random()*900);
  });
}

// Data fetch helpers
export async function fetchJSON(path){
  const res = await fetch(path);
  if(!res.ok) throw new Error('Failed to load '+path);
  return res.json();
}
