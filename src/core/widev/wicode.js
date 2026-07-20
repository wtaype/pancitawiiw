// src/lib/widev/wicode.js
// wiCode v1.1 - Formateador de bloques de código pre/code con botón flotante interactivo de copiado rápido

export const wiCode = (sel) => {
  if (typeof document === 'undefined') return;

  document.querySelectorAll(sel).forEach(el => {
    // Evitar duplicaciones de envoltura
    if (el.parentElement && el.parentElement.classList.contains('wiCode-box')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'wiCode-box';
    
    // Estilos del contenedor del código
    Object.assign(wrapper.style, {
      position: 'relative',
      background: 'var(--bg4, #1e1e2e)',
      border: '1px solid var(--brd, rgba(255,255,255,0.1))',
      borderRadius: '0.8vh',
      padding: '2vh',
      margin: '2vh 0',
      overflowX: 'auto',
      fontFamily: 'monospace'
    });

    el.parentNode?.insertBefore(wrapper, el);
    wrapper.appendChild(el);

    // Botón flotante para copiar el texto
    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'wiCode-copy-btn';
    copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
    copyBtn.setAttribute('title', 'Copiar código');
    
    Object.assign(copyBtn.style, {
      position: 'absolute',
      top: '1vh',
      right: '1vh',
      background: 'rgba(255, 255, 255, 0.08)',
      border: 'none',
      borderRadius: '0.6vh',
      color: 'rgba(255, 255, 255, 0.6)',
      padding: '0.6vh 1vh',
      cursor: 'pointer',
      fontSize: 'var(--fz_s3, 12px)',
      transition: 'all 0.2s ease',
      zIndex: '5'
    });

    copyBtn.addEventListener('mouseenter', () => {
      copyBtn.style.background = 'rgba(255, 255, 255, 0.15)';
      copyBtn.style.color = '#fff';
    });

    copyBtn.addEventListener('mouseleave', () => {
      copyBtn.style.background = 'rgba(255, 255, 255, 0.08)';
      copyBtn.style.color = 'rgba(255, 255, 255, 0.6)';
    });

    copyBtn.addEventListener('click', () => {
      const text = el.textContent || '';
      navigator.clipboard.writeText(text).then(() => {
        copyBtn.innerHTML = '<i class="fa-solid fa-check" style="color: #10b981;"></i>';
        setTimeout(() => {
          copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
        }, 1500);
      }).catch(() => {});
    });

    wrapper.appendChild(copyBtn);
  });
};