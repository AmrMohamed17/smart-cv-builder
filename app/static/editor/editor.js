// static/js/editor.js

document.addEventListener('DOMContentLoaded', () => {
    initializeDynamicEditor();
});

function initializeDynamicEditor() {
    setupLayoutEditor();
    setupDynamicItemControls();
    handleFormSubmission();
}

// --- 1. LAYOUT EDITOR LOGIC ---

function setupLayoutEditor() {
    const fab = document.getElementById('fab-open-layout-editor');
    const modal = document.getElementById('layout-editor-modal');
    const closeBtn = document.getElementById('btn-close-modal');
    const addSectionBtn = document.getElementById('btn-add-section');

    if (!fab || !modal || !closeBtn || !addSectionBtn) return;

    fab.addEventListener('click', () => {
        populateLayoutList();
        modal.classList.remove('hidden');
    });

    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    });
    
    addSectionBtn.addEventListener('click', addSectionFromModal);
}

function populateLayoutList() {
    const layoutContainer = document.getElementById('layout-list-container');
    if (!layoutContainer) return;
    layoutContainer.innerHTML = ''; // Clear current list

    document.querySelectorAll('#section-container > .form-section').forEach(sectionEl => {
        const id = sectionEl.dataset.sectionId || (sectionEl.dataset.sectionId = `section-${Date.now()}`);
        let title;
        if (sectionEl.dataset.sectionType === 'custom') {
            title = sectionEl.querySelector('.custom-title-input')?.value || 'Custom Section';
        } else {
            title = sectionEl.querySelector('.section-header-title').textContent.trim();
        }
        
        const itemHTML = `
            <div class="layout-item" data-target-id="${id}">
                <i class="fas fa-grip-vertical layout-item-handle"></i>
                <span class="flex-grow font-semibold text-gray-700">${title}</span>
                <button type="button" class="btn-remove-section-from-modal text-gray-400 hover:text-red-500" title="Remove Section"><i class="fas fa-trash"></i></button>
            </div>
        `;
        layoutContainer.insertAdjacentHTML('beforeend', itemHTML);
    });
    
    new Sortable(layoutContainer, {
        animation: 150,
        handle: '.layout-item-handle',
        onEnd: syncMainLayoutFromModal
    });
}

function syncMainLayoutFromModal() {
    const mainContainer = document.getElementById('section-container');
    document.querySelectorAll('#layout-list-container .layout-item').forEach(item => {
        const targetId = item.dataset.targetId;
        const targetSection = document.querySelector(`.form-section[data-section-id="${targetId}"]`);
        if(targetSection) mainContainer.appendChild(targetSection);
    });
}

function addSectionFromModal() {
    const select = document.getElementById('add-section-select');
    const sectionType = select.value;
    const template = document.querySelector(`template#${sectionType}-template`);
    if (!template) return;

    const mainContainer = document.getElementById('section-container');
    const tempDiv = document.createElement('div');
    const newId = Date.now();
    
    let templateHtml = template.innerHTML
        .replace(/{{- new_id -}}/g, newId)
        .replace(/__INDEX__/g, newId);
    
    tempDiv.innerHTML = templateHtml;
    const newSection = tempDiv.firstElementChild;
    newSection.dataset.sectionId = `section-${newId}`;
    mainContainer.appendChild(newSection);
    
    const addFirstItemBtn = newSection.querySelector('.btn-add-item');
    if (addFirstItemBtn) addFirstItemBtn.click();

    populateLayoutList();
}


// --- 2. DYNAMIC ITEM & REMOVAL LOGIC ---

function setupDynamicItemControls() {
    let deleteTimeout = null;

    document.body.addEventListener('click', e => {
        const button = e.target.closest('button');
        if (!button) return;

        if (button.matches('.btn-add-item')) {
            const listContainer = button.parentElement.querySelector('.list-container');
            const template = document.getElementById(button.dataset.template);
            if (listContainer && template) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = template.innerHTML.replace(/__INDEX__/g, Date.now());
                listContainer.appendChild(tempDiv.firstElementChild);
            }
        }
        
        if (button.matches('.btn-add-responsibility')) {
            const list = button.previousElementSibling;
            const itemHTML = `
                <div class="responsibility-item flex items-center gap-2">
                    <input type="text" class="form-input flex-grow responsibility-input" placeholder="• New achievement...">
                    <button type="button" class="btn-remove-item text-red-500" title="Remove Responsibility"><i class="fas fa-trash"></i></button>
                </div>
            `;
            list.insertAdjacentHTML('beforeend', itemHTML);
            list.lastElementChild.querySelector('input').focus();
        }

        if (button.matches('.btn-remove-item')) {
            const elementToRemove = button.closest('.item-container, .responsibility-item');
            showUndoToast(elementToRemove, "Entry removed.");
        }

        if (button.matches('.btn-remove-section-from-modal')) {
            const layoutItem = button.closest('.layout-item');
            const targetId = layoutItem.dataset.targetId;
            const targetSection = document.querySelector(`.form-section[data-section-id="${targetId}"]`);
            showUndoToast(targetSection, "Section removed.", () => {
                layoutItem.remove(); // Also remove the item from the modal list
            });
        }
    });

    function showUndoToast(element, message, onConfirm) {
        if (!element) return;

        element.style.display = 'none';
        document.querySelector('.toast-notification')?.remove();

        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerHTML = `
            <span>${message}</span>
            <button class="undo-btn">Undo</button>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);

        const undoBtn = toast.querySelector('.undo-btn');
        undoBtn.addEventListener('click', () => {
            clearTimeout(deleteTimeout);
            element.style.display = '';
            toast.remove();
        });

        deleteTimeout = setTimeout(() => {
            if (document.body.contains(element)) element.remove();
            if (onConfirm) onConfirm();
            toast.remove();
        }, 5000);
    }
}


function getSectionData(sectionEl) {
    const type = sectionEl.dataset.sectionType;
    let data = { type };

    if (type === 'summary') {
        data.content = sectionEl.querySelector('textarea')?.value || '';
    } else if (type === 'custom') {
        data.title = sectionEl.querySelector('.custom-title-input')?.value || '';
        data.entries = [];
        sectionEl.querySelectorAll('.item-container').forEach(itemEl => {
            const entry = {};
            itemEl.querySelectorAll('input[name], textarea[name]').forEach(input => {
                const key = (input.name.match(/\[(\w+)\]$/) || [])[1];
                if (key) entry[key] = input.value;
            });
            if (Object.values(entry).some(v => v && v.trim() !== '')) {
                data.entries.push(entry);
            }
        });
    } else {
        data.entries = [];
        sectionEl.querySelectorAll('.item-container').forEach(itemEl => {
            const entry = {};
            // Get all simple named inputs and textareas
            itemEl.querySelectorAll('input[name], textarea[name]').forEach(input => {
                const key = (input.name.match(/\[(\w+)\]$/) || [])[1];
                if (key) entry[key] = input.value;
            });

            // THE FIX IS HERE: This now correctly finds all responsibility lists
            // (for experience, projects, education, etc.) and assigns the points to the correct field.
            itemEl.querySelectorAll('.responsibility-list').forEach(list => {
                const fieldName = list.dataset.fieldName || 'responsibilities'; // Default to 'responsibilities'
                const points = Array.from(list.querySelectorAll('.responsibility-input'))
                    .map(input => input.value.trim())
                    .filter(val => val);
                
                if (points.length > 0) {
                     entry[fieldName] = points.join('\n');
                }
            });
            
            if (Object.values(entry).some(v => v && v.trim() !== '')) {
                data.entries.push(entry);
            }
        });
    }
    return data;
}


function handleFormSubmission() {
    const form = document.getElementById('resumeForm');
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        
        const submitBtn = form.querySelector('.save-btn');
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparing...';

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

        document.querySelectorAll('#section-container > .form-section').forEach(sectionEl => {
            const sectionData = getSectionData(sectionEl);
            if ( (sectionData.entries && sectionData.entries.length > 0) || (sectionData.content && sectionData.content.trim() !== '') || (sectionData.title && sectionData.entries.length > 0) ) {
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
        .then(response => {
             if (!response.ok) throw new Error(`PDF export failed with status: ${response.status}`);
             return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'resume.pdf';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Exported Successfully';
            setTimeout(() => {
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Save & Export Resume';
            }, 2500);
        })
        .catch(error => {
            console.error('Error:', error);
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-times"></i> Export Failed';
            alert(`An error occurred during export: ${error.message}\n\nPlease check the console for more details.`);
             setTimeout(() => {
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Save & Export Resume';
            }, 3000);
        });
    });
}