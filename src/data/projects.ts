export interface Project { id:string; title:string; description:string; tech:string[]; status:string; image?:string; featured?:boolean }
export const projects: Project[] = [
  { id:'panel', title:'ZeroDash Mainframe', description:'Panel manajemen server berbasis Pyrodactyl — kustom frontend, nginx + php8.4-fpm.', tech:['Linux','Nginx','PHP 8.4','Pyrodactyl'], status:'production', featured:true },
  { id:'portfolio', title:'ZeroTzy.ID Portfolio', description:'Portfolio personal — React + TypeScript, deploy Docker port 3456.', tech:['React','TypeScript','Vite','Docker'], status:'production', featured:true },
  { id:'monitor', title:'VPS Monitor', description:'Monitoring harian VPS: CPU, RAM, disk, nginx, SSL.', tech:['Bash','Cron','WhatsApp'], status:'production', featured:true },
  { id:'local-ai', title:'Local AI Experiments', description:'Eksperimen LLM lokal untuk aplikasi privacy-first.', tech:['Python','Ollama','Llama.cpp'], status:'in-progress', featured:false },
]
