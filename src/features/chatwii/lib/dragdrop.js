// src/features/chatwii/lib/dragdrop.js
// Lógica modular para capturar archivos arrastrados (Drag & Drop) desde Windows Explorer

export function inicializarDragDrop(dropZone, onImageLoaded) {
  if (!dropZone) return;

  // Crear el overlay de arrastre si no existe
  let overlay = dropZone.querySelector('.cr_chat_drag_overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'cr_chat_drag_overlay';
    overlay.innerHTML = `
      <div class="cr_drag_message">
        <i class="fas fa-cloud-upload-alt"></i>
        <span>Suelta tus imágenes aquí</span>
      </div>
    `;
    dropZone.appendChild(overlay);
  }

  let dragCounter = 0;

  dropZone.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter++;
    overlay.classList.add('active');
  });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!overlay.classList.contains('active')) {
      overlay.classList.add('active');
    }
  });

  dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter === 0) {
      overlay.classList.remove('active');
    }
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dragCounter = 0;
    overlay.classList.remove('active');

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) return;

    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        onImageLoaded({
          base64: event.target.result,
          mime: file.type
        });
      };
      reader.readAsDataURL(file);
    });
  });
}
