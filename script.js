let notesData = JSON.parse(localStorage.getItem('stickyNotes')) || [];
        let deletedNotes = JSON.parse(localStorage.getItem('deletedNotes')) || [];
        let currentEditableElement = null;

        // DOM Elements
        const noteInput = document.getElementById('note-input');
        const addBtn = document.getElementById('add-btn');
        const notesContainer = document.getElementById('notes-container');
        const noteCount = document.getElementById('note-count');
        const historyBtn = document.getElementById('history-btn');
        const historyModal = document.getElementById('history-modal');
        const colorModal = document.getElementById('color-modal');
        const clearHistoryBtn = document.getElementById('clear-history');
        const historyList = document.getElementById('history-list');
        const loadingOverlay = document.querySelector('.loading-overlay');

        // Initialize app when DOM is loaded
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🚀 App initializing...');
            
            setTimeout(() => {
                if (typeof gsap !== 'undefined') {
                    gsap.to('.loading-overlay', {
                        duration: 1,
                        opacity: 0,
                        y: -50,
                        ease: "power2.inOut",
                        onComplete: () => {
                            loadingOverlay.style.display = 'none';
                            initializeApp();
                        }
                    });
                } else {
                    loadingOverlay.style.display = 'none';
                    initializeApp();
                }
            }, 2000);
        });

        function initializeApp() {
            console.log('✅ App initialized successfully');
            loadNotes();
            updateNoteCount();
            initializeEventListeners();
            
            // Entrance animations
            if (typeof gsap !== 'undefined') {
                const tl = gsap.timeline();
                tl.from('.header', { duration: 1.2, y: -100, opacity: 0, ease: "elastic.out(1, 0.8)" })
                  .from('.input-section', { duration: 1, y: 100, opacity: 0, ease: "back.out(1.7)" }, "-=0.8")
                  .from('.sticky-note', { duration: 0.8, scale: 0, rotation: 180, opacity: 0, ease: "elastic.out(1, 0.8)", stagger: { amount: 1.5, grid: "auto", from: "center" } }, "-=0.5");
            }
        }

        function initializeEventListeners() {
            console.log('🔧 Setting up event listeners...');
            
            addBtn.addEventListener('click', addNote);
            noteInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    addNote();
                }
            });
            
            noteInput.addEventListener('focus', () => {
                if (typeof gsap !== 'undefined') gsap.to(noteInput, { duration: 0.3, scale: 1.02 });
            });
            
            noteInput.addEventListener('blur', () => {
                if (typeof gsap !== 'undefined') gsap.to(noteInput, { duration: 0.3, scale: 1 });
            });
            
            historyBtn.addEventListener('click', () => showModal(historyModal));
            clearHistoryBtn.addEventListener('click', clearHistory);
            
            // Modal close buttons
            document.querySelectorAll('.close-modal').forEach(btn => {
                btn.addEventListener('click', (e) => hideModal(e.target.closest('.modal')));
            });
            
            // Click outside modal to close
            window.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal')) hideModal(e.target);
            });
            
            // Color picker options
            document.querySelectorAll('.color-option').forEach(option => {
                option.addEventListener('click', (e) => {
                    const color = e.target.dataset.color;
                    applyTextColor(color);
                    hideModal(colorModal);
                });
            });
            
            console.log('✅ Event listeners set up successfully');
        }

        function addNote() {
            const noteText = noteInput.value.trim();
            
            if (!noteText) {
                showToast('Please enter some text for your note! 📝');
                if (typeof gsap !== 'undefined') {
                    gsap.to(noteInput, { 
                        duration: 0.1, 
                        x: -10, 
                        yoyo: true, 
                        repeat: 5,
                        ease: "power2.inOut",
                        onComplete: () => gsap.set(noteInput, { x: 0 })
                    });
                }
                return;
            }
            
            const noteData = {
                id: Date.now(),
                content: noteText,
                timestamp: new Date().toLocaleString(),
                htmlContent: noteText
            };
            
            notesData.push(noteData);
            saveNotes();
            createNoteElement(noteData);
            
            noteInput.value = '';
            if (typeof gsap !== 'undefined') {
                gsap.to(noteInput, { 
                    duration: 0.3, 
                    scale: 0.95, 
                    onComplete: () => gsap.to(noteInput, { duration: 0.3, scale: 1 })
                });
            }
            
            updateNoteCount();
            showToast('Note created successfully! 🎉');
        }

        function createNoteElement(noteData) {
            const noteElement = document.createElement('div');
            noteElement.className = 'sticky-note';
            noteElement.dataset.id = noteData.id;
            
            const uniqueClass = `note-${noteData.id}`;
            noteElement.classList.add(uniqueClass);
            
            noteElement.innerHTML = `
                <div class="note-content" contenteditable="true" data-placeholder="Click to edit your note...">${noteData.htmlContent || noteData.content}</div>
                <div class="note-toolbar">
                    <div class="format-tools">
                        <button class="format-btn bold-btn" title="Bold" data-format="bold">
                            <i class="fas fa-bold"></i>
                        </button>
                        <button class="format-btn color-btn" title="Text Color" data-format="color">
                            <i class="fas fa-palette"></i>
                        </button>
                        <button class="format-btn highlight-btn" title="Highlight" data-format="highlight">
                            <i class="fas fa-highlighter"></i>
                        </button>
                    </div>
                    <button class="delete-btn" title="Delete Note">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="timestamp">Created: ${noteData.timestamp}</div>
            `;
            
            addNoteEventListeners(noteElement, noteData);
            
            // Remove empty state if exists
            const emptyState = notesContainer.querySelector('.empty-state');
            if (emptyState) {
                if (typeof gsap !== 'undefined') {
                    gsap.to(emptyState, {
                        duration: 0.5,
                        opacity: 0,
                        scale: 0.8,
                        onComplete: () => emptyState.remove()
                    });
                } else {
                    emptyState.remove();
                }
            }
            
            notesContainer.insertBefore(noteElement, notesContainer.firstChild);
            
            // Entrance animation
            if (typeof gsap !== 'undefined') {
                gsap.fromTo(`.${uniqueClass}`, 
                    { scale: 0, rotation: -360, opacity: 0, y: -100 },
                    { duration: 1.2, scale: 1, rotation: 0, opacity: 1, y: 0, ease: "elastic.out(1, 0.8)" }
                );
                
                gsap.to('.sticky-note:not(.' + uniqueClass + ')', {
                    duration: 0.6, scale: 0.98, yoyo: true, repeat: 1, stagger: 0.1, ease: "power2.inOut"
                });
            }
        }

        function addNoteEventListeners(noteElement, noteData) {
            const noteContent = noteElement.querySelector('.note-content');
            const deleteBtn = noteElement.querySelector('.delete-btn');
            const formatBtns = noteElement.querySelectorAll('.format-btn');
            
            // Auto-save content changes
            noteContent.addEventListener('input', () => {
                noteData.htmlContent = noteContent.innerHTML;
                noteData.content = noteContent.textContent || noteContent.innerText;
                saveNotes();
            });
            
            // Set current editable element when focused
            noteContent.addEventListener('focus', () => {
                currentEditableElement = noteContent;
                console.log('📝 Note focused, ready for formatting');
                
                if (typeof gsap !== 'undefined') {
                    gsap.to(noteElement, { 
                        duration: 0.4, 
                        scale: 1.05, 
                        boxShadow: "0 25px 50px rgba(0,0,0,0.3)",
                        z: 100
                    });
                }
            });
            
            noteContent.addEventListener('blur', () => {
                if (typeof gsap !== 'undefined') {
                    gsap.to(noteElement, { 
                        duration: 0.4, 
                        scale: 1, 
                        boxShadow: "0 8px 25px rgba(0,0,0,0.15)"
                    });
                }
            });
            
            // Delete button
            deleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                deleteNote(noteElement, noteData);
            });
            
            // Format buttons - THE KEY FIX IS HERE!
            formatBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Make sure we focus the note content first
                    noteContent.focus();
                    currentEditableElement = noteContent;
                    
                    // Button animation
                    if (typeof gsap !== 'undefined') {
                        gsap.to(btn, {
                            duration: 0.2,
                            scale: 0.8,
                            onComplete: () => gsap.to(btn, { duration: 0.2, scale: 1 })
                        });
                    }
                    
                    const format = btn.dataset.format;
                    handleFormatting(format, btn, noteContent, noteData);
                });
                
                // Hover effects
                btn.addEventListener('mouseenter', () => {
                    if (typeof gsap !== 'undefined') gsap.to(btn, { duration: 0.2, scale: 1.1 });
                });
                
                btn.addEventListener('mouseleave', () => {
                    if (typeof gsap !== 'undefined') gsap.to(btn, { duration: 0.2, scale: 1 });
                });
            });
            
            // Note hover effects
            noteElement.addEventListener('mouseenter', () => {
                if (!noteElement.querySelector('.note-content:focus') && typeof gsap !== 'undefined') {
                    gsap.to(noteElement, { duration: 0.3, y: -10, scale: 1.02 });
                }
            });
            
            noteElement.addEventListener('mouseleave', () => {
                if (!noteElement.querySelector('.note-content:focus') && typeof gsap !== 'undefined') {
                    gsap.to(noteElement, { duration: 0.3, y: 0, scale: 1 });
                }
            });
        }

        // THE MAIN FIX: PROPER TEXT FORMATTING USING execCommand
        function handleFormatting(format, btn, noteContent, noteData) {
            // Make sure the element is focused
            noteContent.focus();
            
            const selection = window.getSelection();
            const selectedText = selection.toString();
            
            console.log(`🎨 Applying ${format} formatting. Selected text: "${selectedText}"`);
            
            if (!selectedText && format !== 'color') {
                showToast(`Please select text to apply ${format} formatting! 📍`);
                return;
            }
            
            let success = false;
            
            switch(format) {
                case 'bold':
                    if (selectedText) {
                        success = document.execCommand('bold', false, null);
                        if (success) {
                            btn.classList.toggle('active');
                            showToast('Text made bold! 💪');
                        }
                    }
                    break;
                    
                case 'color':
                    if (selectedText) {
                        showModal(colorModal);
                        return; // Don't save yet, wait for color selection
                    } else {
                        showToast('Please select text to change color! 🎨');
                        return;
                    }
                    break;
                    
                case 'highlight':
                    if (selectedText) {
                        success = document.execCommand('hiliteColor', false, '#ffff00');
                        if (success) {
                            btn.classList.toggle('active');
                            showToast('Text highlighted! ✨');
                        }
                    }
                    break;
            }
            
            if (success || format === 'highlight') {
                // Save the updated content
                setTimeout(() => {
                    noteData.htmlContent = noteContent.innerHTML;
                    noteData.content = noteContent.textContent || noteContent.innerText;
                    saveNotes();
                    console.log('💾 Formatting applied and saved!');
                }, 100);
            } else if (format !== 'color') {
                showToast('Could not apply formatting. Try selecting text again.');
            }
        }

        // Apply text color using execCommand
        function applyTextColor(color) {
            if (currentEditableElement) {
                currentEditableElement.focus();
                
                const selection = window.getSelection();
                const selectedText = selection.toString();
                
                if (selectedText) {
                    const success = document.execCommand('foreColor', false, color);
                    
                    if (success) {
                        showToast(`Color applied! 🎨`);
                        
                        // Save changes
                        setTimeout(() => {
                            const noteElement = currentEditableElement.closest('.sticky-note');
                            const noteData = notesData.find(note => note.id == noteElement.dataset.id);
                            
                            if (noteData) {
                                noteData.htmlContent = currentEditableElement.innerHTML;
                                noteData.content = currentEditableElement.textContent || currentEditableElement.innerText;
                                saveNotes();
                                console.log('🎨 Color applied and saved!');
                            }
                        }, 100);
                    } else {
                        showToast('Could not apply color. Try again.');
                    }
                } else {
                    showToast('Please select text first! 📝');
                }
            } else {
                showToast('Please focus on a note first! 📝');
            }
        }

        function deleteNote(noteElement, noteData) {
            deletedNotes.unshift({
                ...noteData,
                deletedAt: new Date().toLocaleString()
            });
            
            notesData = notesData.filter(note => note.id !== noteData.id);
            saveNotes();
            localStorage.setItem('deletedNotes', JSON.stringify(deletedNotes));
            
            if (typeof gsap !== 'undefined') {
                const tl = gsap.timeline();
                tl.to(noteElement, { duration: 0.3, scale: 1.1, ease: "back.out(1.7)" })
                  .to(noteElement, {
                      duration: 0.8, scale: 0, rotation: 360, opacity: 0, y: -100, ease: "back.in(1.7)",
                      onComplete: () => {
                          noteElement.remove();
                          updateNoteCount();
                          showEmptyStateIfNeeded();
                      }
                  });
            } else {
                noteElement.remove();
                updateNoteCount();
                showEmptyStateIfNeeded();
            }
            
            showToast('Note deleted! Check history to recover. 🗑️');
        }

        function loadNotes() {
            if (notesData.length === 0) {
                setTimeout(showEmptyState, 500);
                return;
            }
            
            notesData.forEach((noteData, index) => {
                setTimeout(() => createNoteElement(noteData), index * 100);
            });
        }

        function saveNotes() {
            localStorage.setItem('stickyNotes', JSON.stringify(notesData));
        }

        function updateNoteCount() {
            const count = notesData.length;
            const newText = `${count} Note${count !== 1 ? 's' : ''}`;
            
            if (typeof gsap !== 'undefined') {
                gsap.to(noteCount, {
                    duration: 0.3, scale: 1.2, color: '#FFE066',
                    onComplete: () => {
                        noteCount.textContent = newText;
                        gsap.to(noteCount, { duration: 0.3, scale: 1, color: 'white' });
                    }
                });
            } else {
                noteCount.textContent = newText;
            }
        }

        function showEmptyState() {
            if (notesData.length === 0 && !notesContainer.querySelector('.empty-state')) {
                const emptyState = document.createElement('div');
                emptyState.className = 'empty-state';
                emptyState.innerHTML = `<h2>📝 No Notes Yet!</h2><p>Create your first sticky note above to get started</p>`;
                notesContainer.appendChild(emptyState);
                
                if (typeof gsap !== 'undefined') {
                    gsap.from(emptyState, { duration: 1.2, opacity: 0, y: 100, scale: 0.8, ease: "elastic.out(1, 0.8)" });
                }
            }
        }

        function showEmptyStateIfNeeded() {
            if (notesData.length === 0) {
                setTimeout(showEmptyState, 800);
            }
        }

        function showModal(modal) {
            if (modal === historyModal) displayHistory();
            
            modal.style.display = 'block';
            
            if (typeof gsap !== 'undefined') {
                gsap.fromTo(modal, { opacity: 0 }, { duration: 0.3, opacity: 1 });
                gsap.fromTo(modal.querySelector('.modal-content'),
                    { scale: 0.7, opacity: 0, y: 50 },
                    { duration: 0.5, scale: 1, opacity: 1, y: 0, ease: "elastic.out(1, 0.8)" }
                );
            }
        }

        function hideModal(modal) {
            if (typeof gsap !== 'undefined') {
                gsap.to(modal.querySelector('.modal-content'), {
                    duration: 0.3, scale: 0.7, opacity: 0, y: -50, ease: "back.in(1.7)",
                    onComplete: () => {
                        gsap.to(modal, {
                            duration: 0.2, opacity: 0,
                            onComplete: () => modal.style.display = 'none'
                        });
                    }
                });
            } else {
                modal.style.display = 'none';
            }
        }

        function displayHistory() {
            if (deletedNotes.length === 0) {
                historyList.innerHTML = '<p style="text-align:center; color:#666; padding: 20px;">No deleted notes found</p>';
                return;
            }
            
            historyList.innerHTML = deletedNotes.map(note => `
                <div class="history-item">
                    <div class="history-content">${note.content}</div>
                    <div class="history-timestamp">Created: ${note.timestamp} | Deleted: ${note.deletedAt}</div>
                </div>
            `).join('');
            
            if (typeof gsap !== 'undefined') {
                gsap.from('.history-item', { duration: 0.5, x: -50, opacity: 0, stagger: 0.1, ease: "back.out(1.7)" });
            }
        }

        function clearHistory() {
            if (typeof gsap !== 'undefined') {
                gsap.to('.history-item', {
                    duration: 0.4, x: 100, opacity: 0, stagger: 0.05,
                    onComplete: () => {
                        deletedNotes = [];
                        localStorage.removeItem('deletedNotes');
                        hideModal(historyModal);
                        showToast('History cleared successfully! 🧹');
                    }
                });
            } else {
                deletedNotes = [];
                localStorage.removeItem('deletedNotes');
                hideModal(historyModal);
                showToast('History cleared successfully! 🧹');
            }
        }

        function showToast(message) {
            const toast = document.createElement('div');
            toast.className = 'toast';
            toast.textContent = message;
            document.body.appendChild(toast);
            
            if (typeof gsap !== 'undefined') {
                gsap.fromTo(toast,
                    { x: 400, opacity: 0, scale: 0.5 },
                    { 
                        duration: 0.6, x: 0, opacity: 1, scale: 1, ease: "elastic.out(1, 0.8)",
                        onComplete: () => {
                            setTimeout(() => {
                                gsap.to(toast, {
                                    duration: 0.4, x: 400, opacity: 0, scale: 0.8, ease: "back.in(1.7)",
                                    onComplete: () => toast.remove()
                                });
                            }, 3000);
                        }
                    }
                );
            } else {
                setTimeout(() => toast.remove(), 3000);
            }
        }