/* ═══════════════════════════════════════════════════════════════════════════
   RENOPERFECT - JavaScript
   ═══════════════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', function() {
  
  // ── Mobile Menu Toggle ───────────────────────────────────────────────────
  const burger = document.getElementById('navBurger');
  const navLinks = document.getElementById('navLinks');
  
  if (burger && navLinks) {
    burger.addEventListener('click', function() {
      burger.classList.toggle('active');
      navLinks.classList.toggle('active');
      burger.setAttribute('aria-expanded', navLinks.classList.contains('active'));
    });
    
    // Close menu when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        burger.classList.remove('active');
        navLinks.classList.remove('active');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }
  
  // ── Scroll Effects ───────────────────────────────────────────────────────
  const nav = document.getElementById('nav');
  let lastScroll = 0;
  
  window.addEventListener('scroll', function() {
    const currentScroll = window.pageYOffset;
    
    // Add scrolled class
    if (currentScroll > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
  });
  
  // ── Form Handling ────────────────────────────────────────────────────────
  const form = document.getElementById('contactformulier');
  const succes = document.getElementById('form-succes');
  const fout = document.getElementById('form-fout');
  
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      // Hide previous messages
      succes.classList.remove('show');
      fout.classList.remove('show');
      
      // Get submit button and disable it
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verzenden...';
      submitBtn.disabled = true;
      
      try {
        const response = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (response.ok) {
          succes.classList.add('show');
          form.reset();
          // Scroll to success message
          succes.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          throw new Error('Form submission failed');
        }
      } catch (error) {
        fout.classList.add('show');
        fout.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    });
  }
  
  // ── Smooth Scroll for Anchor Links ───────────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
  
  // ── Reveal on Scroll Animation ───────────────────────────────────────────
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  // Observe elements with reveal class
  document.querySelectorAll('.dienst-card, .project-card, .testimonial, .premie-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
  
  // Add visible styles
  const style = document.createElement('style');
  style.textContent = `
    .dienst-card.visible, .project-card.visible, .testimonial.visible, .premie-item.visible {
      opacity: 1 !important;
      transform: translateY(0) !important;
    }
  `;
  document.head.appendChild(style);
  
  // Staggered animation delay
  document.querySelectorAll('.diensten-grid .dienst-card').forEach((card, index) => {
    card.style.transitionDelay = `${index * 0.1}s`;
  });
  
  document.querySelectorAll('.projecten-grid .project-card').forEach((card, index) => {
    card.style.transitionDelay = `${index * 0.1}s`;
  });
  
  document.querySelectorAll('.premies-grid .premie-item').forEach((item, index) => {
    card.style.transitionDelay = `${index * 0.1}s`;
  });
  
  // ── Update Year in Footer ────────────────────────────────────────────────
  const yearElements = document.querySelectorAll('.js-jaar');
  const currentYear = new Date().getFullYear();
  yearElements.forEach(el => {
    el.textContent = currentYear;
  });
  
});
