// ============================================
// OCR SCANNER & DISCORD MODAL FUNCTIONS
// ============================================

function toggleOcrZone() {
    const zone = document.getElementById('ocr-zone');
    const btn = document.getElementById('btn-toggle-ocr');
    if (zone.classList.contains('hidden')) {
        zone.classList.remove('hidden');
        zone.classList.add('flex');
        btn.classList.add('bg-teal-500/20', 'text-teal-400', 'border', 'border-teal-500/30');
    } else {
        zone.classList.remove('flex');
        zone.classList.add('hidden');
        btn.classList.remove('bg-teal-500/20', 'text-teal-400', 'border', 'border-teal-500/30');
    }
}

function loadTesseract(callback) {
    if (window.Tesseract) {
        callback();
        return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    script.onload = callback;
    script.onerror = () => {
        alert("Gagal memuat library Tesseract.js OCR dari CDN.");
    };
    document.head.appendChild(script);
}

function initOcrListeners() {
    const dropArea = document.getElementById('ocr-drop-area');
    const fileInput = document.getElementById('ocr-file-input');
    if (!dropArea || !fileInput) return;

    dropArea.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            processOcrImage(e.target.files[0]);
        }
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropArea.classList.add('border-teal-500', 'bg-teal-500/5');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropArea.classList.remove('border-teal-500', 'bg-teal-500/5');
        }, false);
    });

    dropArea.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            processOcrImage(files[0]);
        }
    });

    window.addEventListener('paste', (e) => {
        const zone = document.getElementById('ocr-zone');
        if (zone && !zone.classList.contains('hidden')) {
            const items = e.clipboardData.items;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    processOcrImage(blob);
                    break;
                }
            }
        }
    });
}

// Preprocess screenshot for better OCR results
// Optimized: scaled from 2.5 down to 2.0 to save memory and CPU cycles on thread processing
function preprocessImageForOcr(fileOrBlob, callback) {
    const img = new Image();
    const objectUrl = URL.createObjectURL(fileOrBlob);
    img.onload = function () {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const scale = 2.0; // Scale reduced from 2.5 to 2.0 for performance optimization
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
            // Grayscale, invert, and binarize (high contrast text)
            const gray = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
            const inv = 255 - gray;
            const bin = inv < 120 ? 0 : 255;
            d[i] = d[i + 1] = d[i + 2] = bin;
        }
        ctx.putImageData(imgData, 0, 0);
        URL.revokeObjectURL(objectUrl);
        canvas.toBlob(callback, 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); callback(fileOrBlob); };
    img.src = objectUrl;
}

function processOcrImage(fileOrBlob) {
    const statusText = document.getElementById('ocr-status-text');
    const progressPercent = document.getElementById('ocr-progress-percent');
    const progressBar = document.getElementById('ocr-progress-bar');
    const progressContainer = document.getElementById('ocr-progress-container');
    const dropArea = document.getElementById('ocr-drop-area');

    if (!statusText || !progressPercent || !progressBar || !progressContainer || !dropArea) return;

    progressContainer.classList.remove('hidden');
    progressContainer.classList.add('flex');
    statusText.textContent = "Memproses gambar...";
    progressPercent.textContent = "0%";
    progressBar.style.width = "0%";
    dropArea.style.pointerEvents = 'none';

    preprocessImageForOcr(fileOrBlob, function (processedBlob) {
        loadTesseract(() => {
            statusText.textContent = "Menginisialisasi scanner...";
            Tesseract.recognize(
                processedBlob,
                'eng',
                {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            const percent = Math.round(m.progress * 100);
                            statusText.textContent = "Membaca teks screenshot...";
                            progressPercent.textContent = `${percent}%`;
                            progressBar.style.width = `${percent}%`;
                        } else {
                            statusText.textContent = m.status === 'loading tesseract core' ? "Memuat Core..." : "Mempersiapkan engine...";
                        }
                    }
                }
            ).then(({ data }) => {
                statusText.textContent = "Pemindaian selesai! Memproses angka stok...";
                setTimeout(() => {
                    parseOcrText(data);
                    progressContainer.classList.remove('flex');
                    progressContainer.classList.add('hidden');
                    dropArea.style.pointerEvents = 'auto';
                }, 800);
            }).catch(err => {
                console.error("OCR Error:", err);
                statusText.textContent = "Terjadi kesalahan pemindaian.";
                progressPercent.textContent = "Error";
                progressBar.classList.add('bg-red-500');
                setTimeout(() => {
                    progressContainer.classList.remove('flex');
                    progressContainer.classList.add('hidden');
                    progressBar.classList.remove('bg-red-500');
                    dropArea.style.pointerEvents = 'auto';
                }, 3000);
            });
        });
    });
}

function parseOcrText(ocrData) {
    if (!ocrData) {
        alert("Tidak ada data hasil scan.");
        return;
    }

    const materialsList = [...rawMaterials, ...gems, ...ingots, ...base, ...resources]
        .map(name => ({ original: name, normalized: name.toLowerCase().replace("aluminium", "aluminum") }))
        .sort((a, b) => b.normalized.length - a.normalized.length);

    const foundStok = {};
    let matchCount = 0;

    function getXMid(words) {
        if (!words || words.length === 0) return 0;
        let minX = Infinity, maxX = -Infinity;
        words.forEach(w => {
            if (w.bbox.x0 < minX) minX = w.bbox.x0;
            if (w.bbox.x1 > maxX) maxX = w.bbox.x1;
        });
        return (minX + maxX) / 2;
    }

    // Primary: 2D search (robust against bad OCR line grouping in grid layouts)
    if (ocrData.lines && ocrData.lines.length > 0 && ocrData.words && ocrData.words.length > 0) {
        const allWords = ocrData.words;

        materialsList.forEach(mat => {
            let bestMatch = null;

            // 1. Locate name line
            for (let line of ocrData.lines) {
                const lineLower = line.text.toLowerCase().replace("aluminium", "aluminum");
                if (!lineLower.includes(mat.normalized)) continue;

                const wordsInLine = line.words;
                const matTokens = mat.normalized.split(/\s+/);

                for (let i = 0; i <= wordsInLine.length - matTokens.length; i++) {
                    let match = true;
                    for (let j = 0; j < matTokens.length; j++) {
                        const wt = wordsInLine[i + j].text.toLowerCase().replace("aluminium", "aluminum");
                        if (!wt.includes(matTokens[j])) { match = false; break; }
                    }
                    if (match) {
                        // Prevent partial matches (e.g., "Sapphire" inside "Uncut Sapphire")
                        if (i > 0) {
                            const wordBefore = wordsInLine[i - 1].text.toLowerCase().replace("aluminium", "aluminum");
                            const longerName = wordBefore + ' ' + mat.normalized;
                            const isSubMatch = materialsList.some(other =>
                                other.normalized !== mat.normalized && other.normalized === longerName
                            );
                            if (isSubMatch) continue;
                        }
                        // Ensure no longer variant exists in the same line
                        const fullLineLower = lineLower;
                        const longerVariantExists = materialsList.some(other =>
                            other.normalized !== mat.normalized &&
                            other.normalized.includes(mat.normalized) &&
                            other.normalized !== mat.normalized &&
                            fullLineLower.includes(other.normalized)
                        );
                        if (longerVariantExists) continue;
                        const matchedWords = wordsInLine.slice(i, i + matTokens.length);
                        bestMatch = { xMid: getXMid(matchedWords), yTop: line.bbox.y0 };
                        break;
                    }
                }
                if (bestMatch) break;
            }

            if (!bestMatch) return;

            // 2. Scan for quantity text vertically above the material name
            let bestWord = null;
            let minScore = Infinity;

            allWords.forEach(w => {
                const t = w.text.trim();
                if (!/^\d/.test(t)) return;                          // must start with a digit
                if (/[0-9]+(?:\.\d+)?(?:g|kg|kb|mb|lb)$/i.test(t)) return; // skip weight strings

                const wMid = (w.bbox.x0 + w.bbox.x1) / 2;
                const wBottom = w.bbox.y1;
                const vDist = bestMatch.yTop - wBottom;
                const hDist = Math.abs(wMid - bestMatch.xMid);

                if (vDist > 80 && vDist < 250 && hDist < 160) {
                    const score = hDist + vDist * 0.5;
                    if (score < minScore) { minScore = score; bestWord = w; }
                }
            });

            if (bestWord) {
                const qty = parseInt(bestWord.text.match(/\d+/)[0]);
                foundStok[mat.original] = qty;
                matchCount++;
            }
        });
    }

    // Fallback to line-by-line parsing if 2D search failed
    if (matchCount === 0) {
        const lines = typeof ocrData === 'string'
            ? ocrData.split('\n').map(text => ({ text, words: [] }))
            : (ocrData.lines || []);

        lines.forEach(line => {
            const lineLower = line.text.toLowerCase().replace("aluminium", "aluminum");
            for (let mat of materialsList) {
                if (lineLower.includes(mat.normalized)) {
                    const numbers = line.text.match(/\d+/g);
                    if (numbers && numbers.length > 0) {
                        const qty = parseInt(numbers[numbers.length - 1]);
                        if (foundStok[mat.original] === undefined) {
                            foundStok[mat.original] = qty;
                            matchCount++;
                            break;
                        }
                    }
                }
            }
        });
    }

    if (matchCount === 0) {
        alert("Pemindaian selesai, tetapi tidak ada nama material yang cocok ditemukan.\n\nPastikan screenshot menampilkan nama barang dengan jelas.");
        return;
    }

    let updateSummary = [];
    Object.entries(foundStok).forEach(([mat, qty]) => {
        const input = document.getElementById(`input-${mat.replace(/ /g, '_')}`);
        if (input) {
            input.value = qty;
            updateSummary.push(`${mat}: ${qty}`);
        }
    });

    saveInventoryToStorage();
    updateTotalStok();
    hitungOptimasi();

    alert(`Sukses memindai ${matchCount} jenis material dari screenshot:\n\n` + updateSummary.join('\n'));
}

// ============================================
// DISCORD PROFIL MODAL HANDLERS
// ============================================
function openDiscordModal(e) {
    if (e) e.preventDefault();
    const modal = document.getElementById('discord-modal');
    const card = document.getElementById('discord-card');
    if (modal && card) {
        modal.classList.remove('hidden');
        // Trigger reflow
        void modal.offsetWidth;
        modal.classList.remove('bg-transparent');
        modal.classList.add('bg-black/60');

        card.classList.remove('scale-95', 'opacity-0');
        card.classList.add('scale-100', 'opacity-100');

        // Fetch dynamic status from Lanyard API
        fetchDiscordPresence();
    }
}

async function fetchDiscordPresence() {
    const userId = '463409500133523486';
    try {
        const response = await fetch(`https://api.lanyard.rest/v1/users/${userId}`);
        if (!response.ok) return; // Fallback to static if 404/not in server
        const json = await response.json();
        if (json.success && json.data) {
            const data = json.data;
            const user = data.discord_user;

            // Update global name and username
            const nameEl = document.querySelector('#discord-card h3');
            const tagEl = document.querySelector('#discord-card p');
            if (nameEl) nameEl.textContent = user.global_name || user.username;
            if (tagEl) tagEl.textContent = `@${user.username}`;

            // Update avatar
            const avatarContainer = document.getElementById('discord-avatar-container');
            if (avatarContainer && user.avatar) {
                const avatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${user.avatar.startsWith('a_') ? 'gif' : 'png'}?size=128`;
                avatarContainer.innerHTML = `<img src="${avatarUrl}" class="w-16 h-16 rounded-full" alt="Avatar">`;
            }

            // Update status badge
            const statusBadge = document.querySelector('#discord-card [title="Online"], #discord-card [title="Offline"], #discord-card [title="Idle"], #discord-card [title="Do Not Disturb"]');
            if (statusBadge) {
                const statusColors = {
                    'online': 'bg-[#23a55a]',
                    'idle': 'bg-[#f0b232]',
                    'dnd': 'bg-[#f23f43]',
                    'offline': 'bg-[#80848e]'
                };
                statusBadge.className = `w-3.5 h-3.5 ${statusColors[data.discord_status] || 'bg-[#80848e]'} rounded-full border-[3px] border-[#1e1f22] absolute bottom-0.5 right-0.5`;

                const statusNames = {
                    'online': 'Online',
                    'idle': 'Idle',
                    'dnd': 'Do Not Disturb',
                    'offline': 'Offline'
                };
                statusBadge.title = statusNames[data.discord_status] || 'Offline';
            }

            // Update custom status/activity if present
            const aboutMeContainer = document.querySelector('#discord-card .space-y-2');
            if (aboutMeContainer && data.activities && data.activities.length > 0) {
                const customStatus = data.activities.find(act => act.type === 4); // custom status
                const gameActivity = data.activities.find(act => act.type === 0); // playing game

                let activityHtml = '';
                if (customStatus && customStatus.state) {
                    activityHtml += `
                        <div>
                            <p class="text-[10px] font-bold text-[#b5bac1] uppercase tracking-wider text-left">Status</p>
                            <p class="text-xs text-[#dbdee1] mt-0.5 text-left">${customStatus.emoji ? customStatus.emoji.name + ' ' : ''}${customStatus.state}</p>
                        </div>
                    `;
                }
                if (gameActivity) {
                    activityHtml += `
                        <div>
                            <p class="text-[10px] font-bold text-[#b5bac1] uppercase tracking-wider text-left">Playing</p>
                            <p class="text-xs text-[#dbdee1] mt-0.5 text-left font-semibold">${gameActivity.name}</p>
                            ${gameActivity.details ? `<p class="text-[11px] text-[#949ba4] text-left">${gameActivity.details}</p>` : ''}
                            ${gameActivity.state ? `<p class="text-[11px] text-[#949ba4] text-left">${gameActivity.state}</p>` : ''}
                        </div>
                    `;
                }

                if (activityHtml) {
                    let activityWrapper = document.getElementById('discord-live-activity');
                    if (!activityWrapper) {
                        activityWrapper = document.createElement('div');
                        activityWrapper.id = 'discord-live-activity';
                        activityWrapper.className = 'space-y-2 pt-2 border-t border-white/5';
                        aboutMeContainer.appendChild(activityWrapper);
                    }
                    activityWrapper.innerHTML = activityHtml;
                }
            } else {
                // Remove activity block if offline/no activity
                const oldAct = document.getElementById('discord-live-activity');
                if (oldAct) oldAct.remove();
            }
        }
    } catch (err) {
        console.error('Failed to fetch Discord presence: ', err);
    }
}

function closeDiscordModal() {
    const modal = document.getElementById('discord-modal');
    const card = document.getElementById('discord-card');
    if (modal && card) {
        card.classList.remove('scale-100', 'opacity-100');
        card.classList.add('scale-95', 'opacity-0');

        modal.classList.remove('bg-black/60');
        modal.classList.add('bg-transparent');

        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }
}

function copyDiscordUsername() {
    navigator.clipboard.writeText('jogurii').then(() => {
        alert("Username Discord 'jogurii' berhasil disalin ke clipboard!");
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}
