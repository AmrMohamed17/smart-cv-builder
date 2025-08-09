// File input handling
document.querySelectorAll('input[type="file"]').forEach(input => {
  const display = document.querySelector(`[data-input="${input.id}"]`);
  
  // Make the entire display area clickable
  display.addEventListener('click', function() {
      input.click();
  });
  
  input.addEventListener('change', function() {
      if (this.files.length > 0) {
          const fileName = this.files[0].name;
          display.classList.add('file-selected');
          display.querySelector('.file-text').textContent = fileName;
          display.querySelector('.file-subtext').textContent = 'File selected successfully';
          display.querySelector('.file-icon').className = 'fas fa-check-circle file-icon';
      }
  });

  // Drag and drop functionality
  display.addEventListener('dragover', function(e) {
      e.preventDefault();
      this.classList.add('drag-over');
  });

  display.addEventListener('dragleave', function(e) {
      e.preventDefault();
      this.classList.remove('drag-over');
  });

  display.addEventListener('drop', function(e) {
      e.preventDefault();
      this.classList.remove('drag-over');
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
          input.files = files;
          input.dispatchEvent(new Event('change'));
      }
  });
});

// GitHub username validation
const githubInput = document.getElementById('github');
githubInput.addEventListener('input', function() {
  const value = this.value;
  if (value && !/^[a-zA-Z0-9-]+$/.test(value)) {
      this.setCustomValidity('Username can only contain letters, numbers, and hyphens');
  } else {
      this.setCustomValidity('');
  }
});

// Form submission with progress indication
document.getElementById('uploadForm').addEventListener('submit', function(e) {
  const submitBtn = document.getElementById('submitBtn');
  const progressBar = document.getElementById('progressBar');
  const progressFill = document.getElementById('progressFill');
  
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  submitBtn.disabled = true;
  progressBar.classList.add('active');
  
  // Simulate progress (since we can't track actual upload progress in this context)
  let progress = 0;
  const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress > 90) progress = 90;
      progressFill.style.width = progress + '%';
      
      if (progress >= 90) {
          clearInterval(interval);
      }
  }, 200);
});

// Add smooth scroll behavior and entrance animations
window.addEventListener('load', function() {
  document.querySelector('.container').style.animation = 'slideIn 0.6s ease-out';
});

// Add subtle mouse movement effects
document.addEventListener('mousemove', function(e) {
  const container = document.querySelector('.container');
  const rect = container.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  
  const rotateX = (y - centerY) / centerY * 2;
  const rotateY = (centerX - x) / centerX * 2;
  
  container.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
});

document.addEventListener('mouseleave', function() {
  document.querySelector('.container').style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
});