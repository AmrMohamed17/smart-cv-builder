// static/js/editor.js

// This function now orchestrates everything.
function initializeDynamicEditor() {
    setupSectionControls();
    setupSortableSections();
    enhanceForm();
    handleFormSubmission();
    
    // Add event listeners to all existing "Add Item" buttons on load
    document.querySelectorAll('.btn-add-item').forEach(button => {
        button.addEventListener('click', addListItem);
    });
}

function setupSortableSections() {
    const container = document.getElementById('section-container');
    if (container) {
        new Sortable(container, {
            animation: 150,
            handle: '.drag-handle',
            ghostClass: 'sortable-ghost',
            onEnd: autoSave, // Auto-save when order changes
        });
    }
}

function setupSectionControls() {
    // Add new section
    const addBtn = document.getElementById('btn-add-section');
    addBtn.addEventListener('click', () => {
        const select = document.getElementById('add-section-select');
        const sectionType = select.value;
        const template = document.getElementById(`${sectionType}-template`);
        
        if (template) {
            const container = document.getElementById('section-container');
            const tempDiv = document.createElement('div');
            
            // THE FIX IS HERE: Create a unique ID for the new section's list
            const newId = Date.now();
            // Replace the placeholder in the template's HTML
            let templateHtml = template.innerHTML.replace(/{{- new_id -}}/g, newId);
            
            // Also give the custom section a unique index
            templateHtml = templateHtml.replace(/__INDEX__/g, newId);

            tempDiv.innerHTML = templateHtml;
            
            // Add event listeners to the new section's controls
            const newSection = tempDiv.firstElementChild;
            newSection.querySelectorAll('.btn-add-item').forEach(button => {
                 button.addEventListener('click', addListItem);
            });
            newSection.querySelectorAll('input, textarea').forEach(input => {
                input.addEventListener('input', autoSave);
            });

            container.appendChild(newSection);
            // Add the first item automatically if it's a list-based section
            const newAddButton = newSection.querySelector('.btn-add-item');
            if(newAddButton && sectionType !== 'custom') {
                newAddButton.click();
            }

            autoSave();
        }
    });

    // Remove section or item (using event delegation)
    document.body.addEventListener('click', event => {
        const removeSectionBtn = event.target.closest('.btn-remove-section');
        if (removeSectionBtn) {
            if (confirm('Are you sure you want to remove this entire section?')) {
                removeSectionBtn.closest('.form-section').remove();
                autoSave();
            }
        }

        const removeItemBtn = event.target.closest('.btn-remove-item');
        if (removeItemBtn) {
            removeItemBtn.closest('.item-container').remove();
            autoSave();
        }
    });
}

function addListItem(event) {
    const button = event.currentTarget;
    const targetList = document.getElementById(button.dataset.target);
    const template = document.getElementById(button.dataset.template);
    if (!targetList || !template) {
        console.error("Target list or template not found for", button);
        return;
    };

    // Use a unique index based on time to avoid collisions
    const newIndex = Date.now();
    let cloneHtml = template.innerHTML.replace(/__INDEX__/g, newIndex);
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = cloneHtml;
    
    tempDiv.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('input', autoSave);
    });

    targetList.appendChild(tempDiv.firstElementChild);
    autoSave();
}

function getSectionListData(sectionElement, itemSelector, namePrefix) {
    const items = sectionElement.querySelectorAll(itemSelector);
    const data = [];
    items.forEach((item) => {
        const itemData = {};
        const inputs = item.querySelectorAll('input, textarea');
        inputs.forEach((input) => {
            const nameMatch = input.name.match(new RegExp(`^${namePrefix}\\[.*\\]\\[(\\w+)\\]$`));
            if (nameMatch) {
                const key = nameMatch[1];
                itemData[key] = input.value;
            }
        });
        if (Object.values(itemData).some(val => val && val.trim() !== '')) {
            data.push(itemData);
        }
    });
    return data;
}

function handleFormSubmission() {
    const form = document.getElementById('resumeForm');
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        
        const submitBtn = form.querySelector('.save-btn');
        submitBtn.classList.add('loading');
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparing...';
        submitBtn.disabled = true;

        // Collect basic info
        const resumeData = {
            name: form.querySelector('[name="name"]').value,
            email: form.querySelector('[name="email"]').value,
            phone: form.querySelector('[name="phone"]').value,
            location: form.querySelector('[name="location"]').value,
            linkedin: form.querySelector('[name="linkedin"]').value,
            github: form.querySelector('[name="github"]').value,
            website: form.querySelector('[name="website"]').value, 
            sections: []
        };

        // Collect ordered sections
        document.querySelectorAll('#section-container .form-section').forEach(sectionEl => {
            const type = sectionEl.dataset.sectionType;
            let sectionData = { type: type };

            switch (type) {
                case 'summary':
                    sectionData.content = sectionEl.querySelector('textarea').value;
                    break;
                case 'experience':
                    sectionData.entries = getSectionListData(sectionEl, '.experience-item', 'experience');
                    break;
                case 'projects':
                    sectionData.entries = getSectionListData(sectionEl, '.project-item', 'projects');
                    break;
                case 'skills':
                    sectionData.entries = getSectionListData(sectionEl, '.skill-item', 'skills');
                    break;
                case 'certificates':
                    sectionData.entries = getSectionListData(sectionEl, '.certificate-item', 'certificates');
                    break;
                case 'education':
                    sectionData.entries = getSectionListData(sectionEl, '.education-item', 'education');
                    break;
                case 'custom':
                    sectionData.title = sectionEl.querySelector('.custom-title-input').value;
                    sectionData.content = sectionEl.querySelector('.custom-content-textarea').value;
                    break;
            }
            if ((sectionData.entries && sectionData.entries.length > 0) || (sectionData.content && sectionData.content.trim() !== '') || (sectionData.title && sectionData.title.trim() !== '')) {
                resumeData.sections.push(sectionData);
            }
        });

        console.log("Submitting dynamic data:", resumeData);
        
        const previewWindow = window.open('', '_blank');
        fetch('/cv_preview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(resumeData)
        })
        .then(response => response.text())
        .then(html => {
            previewWindow.document.open();
            previewWindow.document.write(html);
            previewWindow.document.close();
            return fetch('/cv_export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(resumeData),
            });
        })
        .then(response => response.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'resume.pdf';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            submitBtn.classList.remove('loading');
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Exported Successfully';
            setTimeout(() => {
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Save & Export Resume';
                submitBtn.disabled = false;
            }, 2000);
            localStorage.removeItem('resumeAutoSave');
        })
        .catch(error => {
            console.error('Error:', error);
            submitBtn.classList.remove('loading');
            submitBtn.innerHTML = '<i class="fas fa-times"></i> Export Failed';
            submitBtn.disabled = false;
        });
    });
}

function autoSave() {
    console.log("Auto-saving triggered by section reorder or content change.");
}

function enhanceForm() {
    const form = document.getElementById('resumeForm');
    form.addEventListener('input', (e) => {
        if (e.target.matches('input, textarea')) {
            autoSave();
        }
    });
}

// Initialize the editor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeDynamicEditor();
});