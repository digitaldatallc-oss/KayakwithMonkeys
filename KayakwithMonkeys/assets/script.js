const header=document.querySelector('#site-header');
const menuButton=document.querySelector('.menu-toggle');
const nav=document.querySelector('#primary-nav');
const setHeader=()=>header?.classList.toggle('scrolled',window.scrollY>20);
setHeader();window.addEventListener('scroll',setHeader,{passive:true});
menuButton?.addEventListener('click',()=>{const open=nav.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Close navigation':'Open navigation')});
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menuButton?.setAttribute('aria-expanded','false')}));
document.querySelector('#year').textContent=new Date().getFullYear();


const heroVideo=document.querySelector('#hero-video');
const heroVideoToggle=document.querySelector('#hero-video-toggle');
heroVideoToggle?.addEventListener('click',()=>{
  if(!heroVideo)return;
  const paused=heroVideo.paused;
  if(paused){
    heroVideo.play().catch(()=>{});
    heroVideoToggle.classList.remove('is-paused');
    heroVideoToggle.setAttribute('aria-label','Pause background video');
    heroVideoToggle.setAttribute('aria-pressed','false');
    const text=heroVideoToggle.querySelector('.video-toggle-text');
    if(text)text.textContent='Pause video';
  }else{
    heroVideo.pause();
    heroVideoToggle.classList.add('is-paused');
    heroVideoToggle.setAttribute('aria-label','Play background video');
    heroVideoToggle.setAttribute('aria-pressed','true');
    const text=heroVideoToggle.querySelector('.video-toggle-text');
    if(text)text.textContent='Play video';
  }
});
