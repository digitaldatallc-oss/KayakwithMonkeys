const header=document.querySelector('#site-header');
const menuButton=document.querySelector('.menu-toggle');
const nav=document.querySelector('#primary-nav');
const setHeader=()=>header?.classList.toggle('scrolled',window.scrollY>20);
setHeader();window.addEventListener('scroll',setHeader,{passive:true});
menuButton?.addEventListener('click',()=>{const open=nav.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Close navigation':'Open navigation')});
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menuButton?.setAttribute('aria-expanded','false')}));
document.querySelector('#year').textContent=new Date().getFullYear();
