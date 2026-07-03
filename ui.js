// ============================================
// UI ACTIONS, PROFILES & RENDER UTILITIES
// ============================================

// Debounce helper
function debounce(fn, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

function formatDuration(sec) {
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function toggleTimeLimit() {
    isTimeLimitActive = !isTimeLimitActive;
    const inputs = document.getElementById('time-limit-inputs');
    const btn = document.getElementById('btn-toggle-time');
    if (isTimeLimitActive) {
        inputs.classList.remove('hidden');
        inputs.classList.add('flex');
        btn.classList.add('bg-teal-500/20', 'text-teal-400', 'border', 'border-teal-500/30');
    } else {
        inputs.classList.remove('flex');
        inputs.classList.add('hidden');
        btn.classList.remove('bg-teal-500/20', 'text-teal-400', 'border', 'border-teal-500/30');
        document.getElementById('limit-h').value = '';
        document.getElementById('limit-m').value = '';
        document.getElementById('limit-s').value = '';
        hitungOptimasi();
    }
}

function getTimeLimitSeconds() {
    if (!isTimeLimitActive) return Infinity;
    const h = parseInt(document.getElementById('limit-h').value) || 0;
    const m = parseInt(document.getElementById('limit-m').value) || 0;
    const s = parseInt(document.getElementById('limit-s').value) || 0;
    const total = (h * 3600) + (m * 60) + s;
    return total > 0 ? total : Infinity;
}

function addTimeLimitListeners() {
    ['limit-h', 'limit-m', 'limit-s'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', () => {
            if (isTimeLimitActive) hitungOptimasi();
        });
    });
}

function toggleIndividualSort() {
    sortModeIndividual = (sortModeIndividual === 'profit') ? 'time' : 'profit';
    const btn = document.getElementById('btn-sort-individual');
    if (btn) {
        btn.textContent = sortModeIndividual === 'profit' ? 'Sort: Profit' : 'Sort: Efisiensi';
    }
    hitungOptimasi();
}

function toggleComboSort() {
    sortModeCombo = (sortModeCombo === 'profit') ? 'time' : 'profit';
    const btn = document.getElementById('btn-sort-combo');
    if (btn) {
        btn.textContent = sortModeCombo === 'profit' ? 'Sort: Profit' : 'Sort: Efisiensi';
    }
    hitungOptimasi();
}

function toggleIndividualCollapse() {
    isIndividualCollapsed = !isIndividualCollapsed;
    const panel = document.getElementById('panel-individual');
    const body = document.getElementById('hasil-individual');
    const chevron = document.getElementById('chevron-individual');
    const sortBtn = document.getElementById('btn-sort-individual');

    if (isIndividualCollapsed) {
        panel.style.flex = 'none';
        body.classList.add('hidden');
        sortBtn.classList.add('hidden');
        chevron.classList.add('rotate-180');
    } else {
        panel.style.flex = '1';
        panel.style.minHeight = '0';
        body.classList.remove('hidden');
        sortBtn.classList.remove('hidden');
        chevron.classList.remove('rotate-180');
    }
}

function toggleComboCollapse() {
    isComboCollapsed = !isComboCollapsed;
    const panel = document.getElementById('panel-combo');
    const body = document.getElementById('hasil-combo');
    const chevron = document.getElementById('chevron-combo');
    const sortBtn = document.getElementById('btn-sort-combo');

    if (isComboCollapsed) {
        panel.style.flex = 'none';
        body.classList.add('hidden');
        sortBtn.classList.add('hidden');
        chevron.classList.add('rotate-180');
    } else {
        panel.style.flex = '1';
        panel.style.minHeight = '0';
        body.classList.remove('hidden');
        sortBtn.classList.remove('hidden');
        chevron.classList.remove('rotate-180');
    }
}

// Get user inventory input values
function getStokUser() {
    const stok = {};
    [...rawMaterials, ...gems, ...ingots, ...base, ...resources].forEach(mat => {
        const input = document.getElementById(`input-${mat.replace(/ /g, '_')}`);
        if (input) stok[mat] = parseInt(input.value) || 0;
    });
    return stok;
}

// ============================================
// PROFIL STOK (SAVE STATE INVENTORY) & LOCAL STORAGE
// ============================================
function saveInventoryToStorage() {
    const inventory = getStokUser();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));

    if (profiles && activeProfileName) {
        profiles[activeProfileName] = inventory;
        localStorage.setItem('ime_tambang_profiles', JSON.stringify(profiles));
    }
}

function initProfiles() {
    try {
        const storedProfiles = localStorage.getItem('ime_tambang_profiles');
        const storedActive = localStorage.getItem('ime_tambang_active_profile');

        if (storedProfiles) {
            profiles = JSON.parse(storedProfiles);
        } else {
            // Migrasi stok lama jika ada
            const oldStock = localStorage.getItem(STORAGE_KEY);
            if (oldStock) {
                profiles["Default"] = JSON.parse(oldStock);
            } else {
                profiles["Default"] = {};
            }
            localStorage.setItem('ime_tambang_profiles', JSON.stringify(profiles));
        }

        if (storedActive && profiles[storedActive]) {
            activeProfileName = storedActive;
        } else {
            activeProfileName = "Default";
            localStorage.setItem('ime_tambang_active_profile', activeProfileName);
        }

        updateProfileDropdown();
        applyProfileData(activeProfileName);
        updateTotalStok();
        hitungOptimasi();
    } catch (e) {
        console.error("Gagal menginisialisasi profil stok:", e);
        // Failback
        profiles = { "Default": {} };
        activeProfileName = "Default";
        updateProfileDropdown();
        applyProfileData(activeProfileName);
        updateTotalStok();
    }
}

function saveCurrentProfile() {
    if (!activeProfileName) return;
    profiles[activeProfileName] = getStokUser();
    localStorage.setItem('ime_tambang_profiles', JSON.stringify(profiles));
}

function applyProfileData(profileName) {
    const data = profiles[profileName] || {};
    [...rawMaterials, ...gems, ...ingots, ...base, ...resources].forEach(mat => {
        const val = data[mat] !== undefined ? data[mat] : 0;
        const input = document.getElementById(`input-${mat.replace(/ /g, '_')}`);
        if (input) input.value = val;
    });
    updateTotalStok();
}

function updateProfileDropdown() {
    const select = document.getElementById('profile-select');
    if (!select) return;

    select.innerHTML = Object.keys(profiles).map(name =>
        `<option value="${name}" ${name === activeProfileName ? 'selected' : ''}>${name}</option>`
    ).join('');
}

function saveCurrentProfile() {
    if (!activeProfileName) return;
    profiles[activeProfileName] = getStokUser();
    localStorage.setItem('ime_tambang_profiles', JSON.stringify(profiles));

    // Beri efek visual sukses pada tombol save
    const btn = document.getElementById('btn-save-profile');
    if (btn) {
        btn.classList.add('border-emerald-500/50', 'text-emerald-400', 'bg-emerald-500/10');
        btn.classList.remove('hover:border-teal-500/30', 'text-txt-muted');
        setTimeout(() => {
            btn.classList.remove('border-emerald-500/50', 'text-emerald-400', 'bg-emerald-500/10');
            btn.classList.add('hover:border-teal-500/30', 'text-txt-muted');
        }, 800);
    }
}

function switchProfile(newProfileName) {
    if (newProfileName === activeProfileName) return;
    saveCurrentProfile();

    activeProfileName = newProfileName;
    localStorage.setItem('ime_tambang_active_profile', activeProfileName);

    updateProfileDropdown();
    applyProfileData(activeProfileName);
    hitungOptimasi();
}

function enterCreateProfileMode() {
    document.getElementById('profile-view-mode').classList.add('hidden');
    document.getElementById('profile-create-mode').classList.remove('hidden');
    document.getElementById('profile-create-mode').classList.add('flex');
    const input = document.getElementById('profile-new-name');
    if (input) {
        input.value = '';
        input.focus();
    }
}

// Batal
function exitCreateProfileMode() {
    document.getElementById('profile-create-mode').classList.remove('flex');
    document.getElementById('profile-create-mode').classList.add('hidden');
    document.getElementById('profile-view-mode').classList.remove('hidden');
}

function confirmCreateProfile() {
    const input = document.getElementById('profile-new-name');
    if (!input) return;
    const newName = input.value.trim();
    if (!newName) {
        alert("Nama profil tidak boleh kosong!");
        return;
    }
    if (profiles[newName]) {
        alert("Nama profil sudah ada!");
        return;
    }

    saveCurrentProfile();

    profiles[newName] = getStokUser();
    localStorage.setItem('ime_tambang_profiles', JSON.stringify(profiles));

    activeProfileName = newName;
    localStorage.setItem('ime_tambang_active_profile', activeProfileName);

    updateProfileDropdown();
    exitCreateProfileMode();
    hitungOptimasi();
}

function deleteActiveProfile() {
    if (activeProfileName === 'Default') return;
    if (!confirm(`Apakah Anda yakin ingin menghapus profil "${activeProfileName}"?`)) return;

    delete profiles[activeProfileName];
    localStorage.setItem('ime_tambang_profiles', JSON.stringify(profiles));

    activeProfileName = 'Default';
    localStorage.setItem('ime_tambang_active_profile', activeProfileName);

    updateProfileDropdown();
    applyProfileData(activeProfileName);
    hitungOptimasi();
}

// ============================================
// EXPORT TEKS & GAMBAR (EXPORT UTILITIES)
// ============================================
function copyIndividualText() {
    if (!currentIndividualResult || currentIndividualResult.length === 0) {
        alert("Tidak ada hasil optimasi individual untuk disalin.");
        return;
    }

    const timeLimit = getTimeLimitSeconds();
    const limitStr = timeLimit === Infinity ? "Tanpa Batas" : formatDuration(timeLimit);

    let text = `--- HASIL OPTIMASI INDIVIDU (Ime Tambang) ---\n`;
    text += `Limit Waktu: ${limitStr}\n`;
    text += `Sortir Berdasarkan: ${sortModeIndividual === 'profit' ? 'Profit' : 'Efisiensi Waktu'}\n\n`;

    const topItems = currentIndividualResult.slice(0, 10);
    topItems.forEach((item, index) => {
        const profitText = item.profitSatuan >= 0 ? `+$${item.profitSatuan.toLocaleString('id-ID')}` : `-$${Math.abs(item.profitSatuan).toLocaleString('id-ID')}`;
        const totalProfit = item.profitSatuan * item.maxBisa;
        const totalProfitText = totalProfit >= 0 ? `+$${totalProfit.toLocaleString('id-ID')}` : `-$${Math.abs(totalProfit).toLocaleString('id-ID')}`;
        const rateText = item.profitPerDetik >= 0 ? `+$${item.profitPerDetik.toFixed(2)}/s` : `-$${Math.abs(item.profitPerDetik).toFixed(2)}/s`;

        text += `${index + 1}. ${item.nama} (Kategori: ${item.category})\n`;
        text += `   * Bisa Crafting: ${item.maxBisa.toLocaleString('id-ID')} pcs\n`;
        text += `   * Profit/Pcs: ${profitText} | Total: ${totalProfitText}\n`;
        text += `   * Durasi Proses: ${item.processing_time} detik (Akumulasi Raw: ${item.processing_time_raw} detik)\n`;
        text += `   * Rate Efisiensi: ${rateText}\n\n`;
    });

    navigator.clipboard.writeText(text).then(() => {
        alert("Ringkasan hasil optimasi individual berhasil disalin ke clipboard!");
    }).catch(err => {
        console.error("Gagal menyalin teks:", err);
        alert("Gagal menyalin teks ke clipboard.");
    });
}

function copyComboText() {
    if (!currentComboResult || !currentComboResult.strategies || currentComboResult.strategies.length === 0) {
        alert("Tidak ada hasil optimasi combo untuk disalin.");
        return;
    }

    const timeLimit = getTimeLimitSeconds();
    const limitStr = timeLimit === Infinity ? "Tanpa Batas" : formatDuration(timeLimit);

    let text = `--- STRATEGI COMBO CRAFTING (Ime Tambang) ---\n`;
    text += `Total Profit: +$${currentComboResult.summary.totalProfit.toLocaleString('id-ID')}\n`;
    text += `Total Durasi: ${formatDuration(currentComboResult.summary.totalDuration)}\n`;
    text += `Limit Waktu: ${limitStr}\n`;
    text += `Sortir Berdasarkan: ${sortModeCombo === 'profit' ? 'Profit' : 'Efisiensi Waktu'}\n\n`;

    text += `Daftar Rencana Produksi:\n`;
    currentComboResult.strategies.forEach((step, index) => {
        const rawTime = step.processing_time_raw || 0;
        const totalDur = rawTime * step.jumlah;
        const rate = rawTime > 0 ? (step.profitSatuan / rawTime) : 0;
        const rateText = rate >= 0 ? `+$${rate.toFixed(2)}/s` : `-$${Math.abs(rate).toFixed(2)}/s`;

        text += `${index + 1}. ${step.nama} x${step.jumlah}\n`;
        text += `   * Profit/Pcs: +$${step.profitSatuan.toLocaleString('id-ID')} | Total: +$${step.profitTotal.toLocaleString('id-ID')}\n`;
        text += `   * Waktu: ${totalDur}s | Rate: ${rateText}\n`;
    });

    navigator.clipboard.writeText(text).then(() => {
        alert("Strategi combo berhasil disalin ke clipboard!");
    }).catch(err => {
        console.error("Gagal menyalin teks:", err);
        alert("Gagal menyalin teks ke clipboard.");
    });
}

function loadHtml2Canvas(callback) {
    if (window.html2canvas) {
        callback();
        return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    script.onload = callback;
    script.onerror = () => {
        alert("Gagal memuat library html2canvas dari CDN. Harap periksa koneksi internet Anda.");
    };
    document.head.appendChild(script);
}

function exportPanelPNG(panelId, filename) {
    const originalPanel = document.getElementById(panelId);
    if (!originalPanel) {
        alert("Panel tidak ditemukan!");
        return;
    }

    loadHtml2Canvas(() => {
        const clone = originalPanel.cloneNode(true);

        clone.style.position = 'absolute';
        clone.style.top = '-9999px';
        clone.style.left = '-9999px';
        clone.style.height = 'auto';
        clone.style.maxHeight = 'none';
        clone.style.width = originalPanel.offsetWidth + 'px';
        clone.style.overflow = 'visible';

        const listBodyId = panelId === 'panel-individual' ? 'hasil-individual' : 'hasil-combo';
        const listBody = clone.querySelector(`#${listBodyId}`);
        if (listBody) {
            listBody.style.maxHeight = 'none';
            listBody.style.overflowY = 'visible';
            listBody.style.height = 'auto';
        }

        const chevron = clone.querySelector(panelId === 'panel-individual' ? '#chevron-individual' : '#chevron-combo');
        if (chevron) chevron.style.display = 'none';

        document.body.appendChild(clone);

        html2canvas(clone, {
            backgroundColor: '#0d111d',
            scale: 2,
            logging: false,
            useCORS: true
        }).then(canvas => {
            document.body.removeChild(clone);

            try {
                const link = document.createElement('a');
                link.download = filename;
                link.href = canvas.toDataURL('image/png');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (e) {
                console.error("Gagal mengunduh gambar:", e);
                alert("Gagal mengunduh gambar.");
            }
        }).catch(err => {
            console.error("Gagal melakukan capture canvas:", err);
            document.body.removeChild(clone);
            alert("Gagal memproses gambar.");
        });
    });
}

function exportIndividualPNG() {
    exportPanelPNG('panel-individual', 'optimasi_individual.png');
}

function exportComboPNG() {
    exportPanelPNG('panel-combo', 'optimasi_combo.png');
}

// ============================================
// NAVIGATION
// ============================================
function switchCalculatorTab(tab) {
    activeCalculatorTab = tab;
    const subnavInv = document.getElementById('subnav-inventory');
    const subnavRes = document.getElementById('subnav-results');
    if (!subnavInv || !subnavRes) return;
    
    if (tab === 'inventory') {
        subnavInv.className = 'flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all bg-teal-500/20 text-teal-400 border border-teal-500/30';
        subnavRes.className = 'flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all text-txt-muted hover:text-txt-secondary';
    } else {
        subnavRes.className = 'flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all bg-teal-500/20 text-teal-400 border border-teal-500/30';
        subnavInv.className = 'flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all text-txt-muted hover:text-txt-secondary';
    }
    updateCalculatorPanels();
}

function updateCalculatorPanels() {
    const inventoryPanel = document.getElementById('panel-inventory');
    const resultsPanel = document.getElementById('panel-results');
    const subnav = document.getElementById('calculator-subnav');
    if (!inventoryPanel || !resultsPanel) return;

    const calcBtn = document.getElementById('nav-calculator');
    const isCalcTab = calcBtn && calcBtn.classList.contains('bg-teal-500/20');

    if (!isCalcTab) {
        subnav?.classList.add('hidden');
        subnav?.classList.remove('flex');
        return;
    }

    if (window.innerWidth < 1024) { // 1024px represents lg breakpoint in Tailwind
        subnav?.classList.remove('hidden');
        subnav?.classList.add('flex');
        if (activeCalculatorTab === 'inventory') {
            inventoryPanel.classList.remove('hidden');
            inventoryPanel.classList.add('flex');
            resultsPanel.classList.add('hidden');
            resultsPanel.classList.remove('flex');
        } else {
            inventoryPanel.classList.add('hidden');
            inventoryPanel.classList.remove('flex');
            resultsPanel.classList.remove('hidden');
            resultsPanel.classList.add('flex');
        }
    } else {
        subnav?.classList.add('hidden');
        subnav?.classList.remove('flex');
        inventoryPanel.classList.remove('hidden');
        inventoryPanel.classList.add('flex');
        resultsPanel.classList.remove('hidden');
        resultsPanel.classList.add('flex');
    }
}

function switchNav(tab) {
    const calcBtn = document.getElementById('nav-calculator');
    const infoBtn = document.getElementById('nav-iteminfo');
    const inventoryPanel = document.getElementById('panel-inventory');
    const resultsPanel = document.getElementById('panel-results');
    const infoPanel = document.getElementById('panel-iteminfo');
    const statsBar = document.getElementById('stats-bar');
    const calcControls = document.getElementById('calc-controls');
    const subnav = document.getElementById('calculator-subnav');

    if (tab === 'calculator') {
        calcBtn.className = 'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all bg-teal-500/20 text-teal-400 border border-teal-500/30';
        infoBtn.className = 'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all text-txt-muted hover:text-txt-secondary hover:bg-elevated';
        infoPanel?.classList.add('hidden');
        statsBar?.classList.remove('hidden');
        calcControls?.classList.remove('hidden');
        calcControls?.classList.add('flex');
        
        updateCalculatorPanels();
    } else {
        infoBtn.className = 'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all bg-purple-500/20 text-purple-400 border border-purple-500/30';
        calcBtn.className = 'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all text-txt-muted hover:text-txt-secondary hover:bg-elevated';
        inventoryPanel?.classList.add('hidden');
        resultsPanel?.classList.add('hidden');
        infoPanel?.classList.remove('hidden');
        statsBar?.classList.add('hidden');
        calcControls?.classList.remove('flex');
        calcControls?.classList.add('hidden');
        subnav?.classList.add('hidden');
        subnav?.classList.remove('flex');

        if (database) {
            renderItemInfo();
        } else {
            document.getElementById('iteminfo-container').innerHTML = '<div class="flex items-center justify-center h-full text-txt-muted p-8">Memuat database...</div>';
        }
    }
}

// ============================================
// RESULTS RENDERING
// ============================================
function renderIndividualResults(results) {
    currentIndividualResult = results;
    const container = document.getElementById('hasil-individual');

    document.getElementById('result-count-individual').textContent = `${results.length} items`;

    const profitable = results.filter(r => r.profitSatuan > 0).length;
    const loss = results.filter(r => r.profitSatuan < 0).length;
    const breakEven = results.filter(r => r.profitSatuan === 0).length;

    const parts = [`
        <div class="mb-3 flex gap-2 text-[10.5px]">
            <span class="px-2 py-1 rounded bg-emerald-950/50 text-emerald-400">${profitable} Profit</span>
            <span class="px-2 py-1 rounded bg-slate-800 text-txt-muted">${breakEven} Break-even</span>
            <span class="px-2 py-1 rounded bg-red-950/50 text-red-400">${loss} Rugi</span>
        </div>
        <div class="space-y-1.5">`
    ];

    results.forEach((item, i) => {
        const colors = CAT_COLORS[item.category] || CAT_COLORS["Ingots"];
        const isProfitable = item.profitSatuan > 0;
        const isLoss = item.profitSatuan < 0;
        const borderColor = isLoss ? 'border-red-900/30' : isProfitable ? (i === 0 ? 'border-teal-500/40' : 'border-border') : 'border-slate-700/50';
        const profitColor = isLoss ? 'text-red-400' : isProfitable ? 'text-emerald-400' : 'text-txt-muted';

        const ingredientsHtml = Object.entries(item.ingredients).map(([bahan, qty]) => {
            const isRaw = rawMaterials.includes(bahan);
            return `<span class="inline-flex items-center gap-0.5 ${isRaw ? 'text-orange-400' : 'text-emerald-400'}">${qty}x ${bahan}</span>`;
        }).join('<span class="text-txt-muted mx-1">+</span>');

        const rateColor = item.profitPerDetik >= 0 ? 'text-teal-400' : 'text-red-400';
        const rateSign = item.profitPerDetik >= 0 ? '+' : '';

        parts.push(`
            <div class="bg-elevated border ${borderColor} rounded-lg p-2.5">
                <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                        <span class="text-[10.5px] font-mono text-txt-muted w-6">${i + 1}.</span>
                        <span class="text-[10.5px] px-2 py-0.5 rounded-full font-semibold ${colors.bg} ${colors.text}">${item.category}</span>
                        ${i === 0 && isProfitable ? '<span class="text-[9.5px] px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 font-bold">BEST</span>' : ''}
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-[10.5px] text-txt-muted">Sell: $${item.sellPrice}</span>
                        <span class="font-mono font-semibold text-[12.5px] ${profitColor}">${isProfitable ? '+' : ''}$${item.profitSatuan.toFixed(1)}</span>
                    </div>
                </div>
                <div class="mt-1.5 text-xs text-txt-primary font-semibold">${item.nama}</div>
                <div class="mt-1.5 flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[10.5px]">
                    <span class="text-txt-muted">Bahan:</span>
                    ${ingredientsHtml}
                </div>
                <div class="mt-1.5 flex items-center justify-between text-[10.5px]">
                    <span class="${item.bahanKekurangan ? 'text-red-400' : 'text-txt-muted'}">
                        ${item.bahanKekurangan ? `Butuh: ${item.bahanKekurangan}` : `Max: ${item.maxBisa === 9999 ? 'unlimited' : item.maxBisa} pcs`}
                    </span>
                    ${item.processing_steps > 0 ? `
                    <span class="text-txt-muted font-mono flex items-center gap-1.5">
                        <span>Proses: ${item.processing_steps}x</span>
                        <span>|</span>
                        <span>Rate: <span class="${rateColor} font-bold">${rateSign}$${item.profitPerDetik.toFixed(2)}/s</span></span>
                    </span>
                    ` : ''}
                </div>
            </div>
        `);
    });

    parts.push('</div>');
    container.innerHTML = parts.join('');
}

function renderComboResults(result) {
    currentComboResult = result;
    completedComboItems.clear();

    const container = document.getElementById('hasil-combo');
    const { summary, strategies } = result;

    const totalPenjualan = summary.totalProfit + summary.totalHargaMentah;
    document.getElementById('stat-penjualan').textContent = `$${totalPenjualan.toLocaleString()}`;
    document.getElementById('stat-profit').textContent = `$${summary.totalProfit.toLocaleString()}`;
    document.getElementById('stat-modal').textContent = `$${summary.totalHargaMentah.toLocaleString()}`;
    document.getElementById('stat-used').textContent = `${summary.percentageUsed}%`;
    document.getElementById('stat-production').textContent = `${summary.totalProduksi}`;
    document.getElementById('stat-strategies').textContent = strategies.length;
    document.getElementById('result-count').innerHTML = `${strategies.length} strategies <span class="text-teal-400 font-mono font-bold ml-1.5">(${formatDuration(summary.totalDuration)})</span>`;

    if (strategies.length === 0) {
        container.innerHTML = `
            <div class="h-full flex flex-col items-center justify-center text-center">
                <div class="w-12 h-12 rounded-xl bg-red-950/30 flex items-center justify-center mb-2">
                    <svg class="w-6 h-6 text-red-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                </div>
                <h3 class="text-sm font-medium text-txt-secondary mb-1">Tidak Ada Strategi</h3>
                <p class="text-[10px] text-txt-muted">Stok tidak mencukupi.</p>
            </div>
        `;
        return;
    }

    const parts = ['<div class="space-y-2">'];

    strategies.forEach((item, i) => {
        const colors = CAT_COLORS[item.category] || CAT_COLORS["Ingots"];
        const isProfitable = item.profitSatuan > 0;
        const isLoss = item.profitSatuan < 0;
        const isFirst = i === 0 && isProfitable;
        const borderColor = isLoss ? 'border-red-900/40' : isFirst ? 'border-teal-500/40' : 'border-border';
        const profitColor = isLoss ? 'text-red-400' : 'text-emerald-400';
        const statusBadge = isLoss
            ? '<span class="text-[9.5px] px-2 py-0.5 rounded-full font-bold bg-red-950 text-red-300">RUGI</span>'
            : isFirst
                ? '<span class="text-[9.5px] px-2 py-0.5 rounded-full font-bold bg-teal-950 text-teal-300">BEST</span>'
                : '';

        parts.push(`
            <div class="bg-elevated border ${borderColor} rounded-lg p-3 cursor-pointer hover:border-purple-500/40 transition-all" data-combo-index="${i}" id="combo-item-${i}">
                <div class="flex items-start justify-between gap-2">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-1.5 mb-0.5">
                            <span class="text-[10.5px] font-mono ${isProfitable ? 'text-emerald-400' : 'text-red-400'}">#${i + 1}</span>
                            <span class="text-[10.5px] px-2 py-0.5 rounded-full font-semibold ${colors.bg} ${colors.text}">${item.category}</span>
                            ${statusBadge}
                            <span class="text-[10.5px] px-1.5 py-0.5 rounded-full bg-purple-950/50 text-purple-300" id="combo-status-${i}"></span>
                        </div>
                        <h4 class="text-[13px] font-semibold text-txt-primary mt-1">${item.nama}</h4>
                    </div>
                    <div class="text-right shrink-0">
                        <p class="text-[10.5px] text-txt-muted">Total Profit</p>
                        <p class="font-bold font-mono text-base ${profitColor}">${isProfitable ? '+' : ''}$${item.profitTotal.toLocaleString()}</p>
                    </div>
                </div>
                <div class="mt-2 flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[11px]">
                    <span class="text-txt-muted">Bahan:</span>
                    ${item.rincian}
                </div>
                <div class="mt-2.5 pt-2.5 border-t border-border/50 grid grid-cols-5 gap-1 text-xs font-mono leading-tight">
                    <div class="flex flex-col">
                        <span class="text-txt-muted text-[10px]">Jumlah</span>
                        <span class="text-cyan-400 font-semibold mt-0.5">${item.jumlah} pcs</span>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-txt-muted text-[10px]">Harga</span>
                        <span class="text-gold-400 font-semibold mt-0.5">$${item.sellPrice || 0}</span>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-txt-muted text-[10px]">P/Pcs</span>
                        <span class="text-emerald-400 font-semibold mt-0.5">${item.profitSatuan >= 0 ? '+' : ''}$${item.profitSatuan.toFixed(0)}</span>
                    </div>
                    <div class="flex flex-col font-semibold">
                        <span class="text-txt-muted text-[10px]">Waktu</span>
                        <span class="text-teal-400 mt-0.5">${formatDuration(item.processing_time_raw * item.jumlah)}</span>
                    </div>
                    <div class="flex flex-col font-semibold">
                        <span class="text-txt-muted text-[10px]">Rate</span>
                        <span class="text-teal-300 mt-0.5">${item.profitSatuan >= 0 ? '+$' : '-$'}${Math.abs(item.profitSatuan / item.processing_time_raw).toFixed(2)}/s</span>
                    </div>
                </div>
            </div>
        `);
    });

    parts.push('</div>');
    container.innerHTML = parts.join('');
}

// ============================================
// COMBO ITEM TRACKING
// ============================================
function confirmAllPending() {
    if (pendingComboItems.size === 0) return;

    pendingComboItems.forEach(index => {
        const item = currentComboResult.strategies[index];
        if (!item) return;
        completedComboItems.add(index);
        for (let [bahan, qty] of Object.entries(item.ingredients)) {
            const input = document.getElementById('input-' + bahan.replace(/ /g, '_'));
            if (input) input.value = Math.max(0, (parseInt(input.value) || 0) - qty * item.jumlah);
        }
    });

    saveInventoryToStorage();

    pendingComboItems.forEach(index => {
        const card = document.getElementById('combo-item-' + index);
        const badge = document.getElementById('combo-status-' + index);
        if (card) { card.classList.add('opacity-50', 'line-through'); card.classList.remove('border-yellow-500/40', 'hover:border-purple-500/40'); }
        if (badge) badge.textContent = '✓ DONE';
    });

    pendingComboItems.clear();
    hideConfirmButtons();
    recalculateIndividual();
}

function cancelAllPending() {
    pendingComboItems.forEach(index => {
        const card = document.getElementById('combo-item-' + index);
        if (card) card.classList.remove('border-yellow-500/40');
    });
    pendingComboItems.clear();
    hideConfirmButtons();
}

function showConfirmButtons() {
    let btns = document.getElementById('confirm-combo-btns');
    if (!btns) {
        btns = document.createElement('div');
        btns.id = 'confirm-combo-btns';
        btns.className = 'flex gap-2';
        const resultCount = document.getElementById('result-count');
        if (resultCount?.parentNode) resultCount.parentNode.insertBefore(btns, resultCount.nextSibling);
    }
    btns.innerHTML = `
        <button onclick="confirmAllPending()" class="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-bold rounded flex items-center gap-1">
            <span>✓</span> Confirm
        </button>
        <button onclick="cancelAllPending()" class="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white text-[9px] font-bold rounded flex items-center gap-1">
            <span>✗</span> Cancel
        </button>
    `;
}

function hideConfirmButtons() {
    document.getElementById('confirm-combo-btns')?.remove();
}

function completeComboItem(index) {
    if (!currentComboResult) return;
    const item = currentComboResult.strategies[index];
    if (!item) return;

    if (completedComboItems.has(index)) {
        completedComboItems.delete(index);
        for (let [bahan, qty] of Object.entries(item.ingredients)) {
            const input = document.getElementById('input-' + bahan.replace(/ /g, '_'));
            if (input) input.value = (parseInt(input.value) || 0) + qty * item.jumlah;
        }
        const card = document.getElementById('combo-item-' + index);
        const badge = document.getElementById('combo-status-' + index);
        if (card) { card.classList.remove('opacity-50', 'line-through'); card.classList.add('hover:border-purple-500/40'); }
        if (badge) badge.textContent = '';
        saveInventoryToStorage();
        recalculateIndividual();
        return;
    }

    const card = document.getElementById('combo-item-' + index);
    if (pendingComboItems.has(index)) {
        pendingComboItems.delete(index);
        card?.classList.remove('border-yellow-500/40');
    } else {
        pendingComboItems.add(index);
        card?.classList.add('border-yellow-500/40');
    }
    pendingComboItems.size > 0 ? showConfirmButtons() : hideConfirmButtons();
}

function recalculateIndividual() {
    renderIndividualResults(hitungIndividualRankings(getStokUser()));
}

// ============================================
// ITEM INFO
// ============================================
const debouncedRenderItemInfo = debounce(() => renderItemInfo(), 200);

function renderItemInfo() {
    const container = document.getElementById('iteminfo-container');
    if (!database) return;

    const items = database.items.map(s => {
        const ingredients = [];
        for (let [bahan, qty] of Object.entries(s.ingredients)) {
            ingredients.push({ nama: bahan, qty });
        }
        const totalCost = getRawMaterialCost(s.name);
        const hasIngredients = ingredients.length > 0;
        const profit = hasIngredients ? s.sell_price - totalCost : 0;
        const margin = hasIngredients && totalCost > 0 ? (profit / totalCost * 100) : 0;
        return { ...s, totalCost, profit, margin, ingredients };
    });

    let filtered = [...items];
    if (itemInfoFilter.category !== 'semua') filtered = filtered.filter(i => i.category === itemInfoFilter.category);
    if (itemInfoFilter.search) {
        const q = itemInfoFilter.search.toLowerCase();
        filtered = filtered.filter(i => i.name.toLowerCase().includes(q));
    }
    filtered.sort((a, b) => {
        if (itemInfoFilter.sort === 'margin-desc') return b.margin - a.margin;
        if (itemInfoFilter.sort === 'margin-asc') return a.margin - b.margin;
        if (itemInfoFilter.sort === 'price-desc') return b.sell_price - a.sell_price;
        if (itemInfoFilter.sort === 'price-asc') return a.sell_price - b.price-asc;
        if (itemInfoFilter.sort === 'profit-desc') return b.profit - a.profit;
        return a.profit - b.profit;
    });

    const profitable = items.filter(i => i.profit > 0).length;

    // Derive CSS string from global CAT_COLORS for Item Info card badges
    const catCss = Object.fromEntries(
        Object.entries(CAT_COLORS).map(([k, v]) => [k, `${v.bg} ${v.text}`])
    );

    const catButtons = ['semua', 'Raw', 'Ingots', 'Gems', 'Base', 'Earrings', 'Rings', 'Necklaces', 'Scraps'].map(cat => {
        const active = itemInfoFilter.category === cat;
        return `<button onclick="itemInfoFilter.category='${cat}';renderItemInfo()"
            class="px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${active ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'bg-elevated text-txt-muted border border-transparent hover:text-txt-secondary'}">${cat.charAt(0).toUpperCase() + cat.slice(1)}</button>`;
    }).join('');

    const itemCards = filtered.map(item => {
        const colors = catCss[item.category] || catCss["Ingots"];
        const isP = item.profit > 0;
        const reqHtml = item.ingredients.map(ing => {
            const isR = rawMaterials.includes(ing.nama);
            return `<span class="text-[10.5px] px-2 py-0.5 rounded ${isR ? 'bg-orange-950/50 text-orange-400' : 'bg-slate-800 text-txt-secondary'}">${ing.qty}x ${ing.nama}</span>`;
        }).join('');

        // Show processing info if the item is processed (steps > 0)
        const processingHtml = item.processing_steps > 0 ? `
            <div class="flex justify-between text-[10.5px] mb-2 font-mono text-txt-secondary border-b border-border/30 pb-1.5">
                <span>Proses: <span class="text-teal-400">${item.processing_steps}x</span></span>
                <span>Durasi: <span class="text-teal-400">${item.processing_time}s</span>${item.processing_steps > 1 ? ` <span class="text-txt-muted">(Raw: ${item.processing_time_raw}s)</span>` : ''}</span>
            </div>
        ` : '';

        const isRaw = item.category === 'Raw';
        const priceDisplay = isRaw ? '-' : `$${item.sell_price}`;
        const profitDisplay = isRaw ? '-' : `${isP ? '+' : ''}$${item.profit.toFixed(0)}`;
        const profitColor = isRaw ? 'text-txt-muted' : (isP ? 'text-emerald-400' : 'text-red-400');
        const totalDisplay = isRaw ? '-' : `$${item.totalCost}`;
        const marginDisplay = isRaw ? '-' : `${item.margin.toFixed(1)}%`;
        const marginColor = isRaw ? 'text-txt-muted' : (isP ? 'text-emerald-400' : 'text-red-400');

        return `<div class="bg-elevated border border-border rounded-xl p-3.5 hover:border-teal-500/30">
            <div class="flex justify-between mb-2">
                <div>
                    <span class="text-[10.5px] px-2 py-0.5 rounded font-semibold ${colors}">${item.category}</span>
                    <h3 class="text-[13px] font-bold text-txt-primary mt-1.5">${item.name}</h3>
                </div>
                <div class="text-right">
                    <p class="text-xl font-bold font-mono text-txt-primary">${priceDisplay}</p>
                    <p class="text-[13px] font-bold font-mono ${profitColor}">${profitDisplay}</p>
                </div>
            </div>
            <div class="h-1.5 bg-void rounded-full mb-3 overflow-hidden"><div class="h-full ${isRaw ? 'bg-void' : (isP ? 'bg-emerald-500' : 'bg-red-500')} rounded-full" style="width:${isRaw ? 0 : Math.min(Math.abs(item.margin), 200) / 3}%"></div></div>
            ${processingHtml}
            <p class="text-[10.5px] text-txt-muted uppercase mb-1">Requirements</p>
            <div class="flex flex-wrap gap-1.5 mb-2">${reqHtml}</div>
            <div class="flex justify-between pt-2.5 border-t border-border/50 text-[10.5px]">
                <span><span class="text-txt-muted">Total: </span><span class="text-orange-400 font-mono">${totalDisplay}</span></span>
                <span><span class="text-txt-muted">Margin: </span><span class="${marginColor} font-mono font-semibold">${marginDisplay}</span></span>
            </div>
        </div>`;
    }).join('');

    container.innerHTML = `<div class="bg-surface border border-border rounded-xl flex flex-col h-full overflow-hidden">
        <div class="px-4 py-3 border-b border-border bg-elevated/50">
            <h2 class="text-base font-bold text-txt-primary mb-3">Item Info &amp; Harga</h2>
            <div class="flex flex-wrap gap-2 mb-3">
                <div class="flex-1 min-w-[150px]">
                    <input type="text" id="item-search" placeholder="Q Cari item..." value="${itemInfoFilter.search}"
                        class="w-full bg-void border border-border rounded-lg px-3 py-1.5 text-[13px] text-txt-primary placeholder-txt-muted focus:outline-none focus:border-teal-500"
                        oninput="itemInfoFilter.search=this.value;debouncedRenderItemInfo()">
                </div>
                <select id="item-sort" onchange="itemInfoFilter.sort=this.value;renderItemInfo()"
                    class="bg-void border border-border rounded-lg px-3 py-1.5 text-[13px] text-txt-primary cursor-pointer">
                    <option value="margin-desc" ${itemInfoFilter.sort === 'margin-desc' ? 'selected' : ''}>Margin: Tinggi - Rendah</option>
                    <option value="margin-asc"  ${itemInfoFilter.sort === 'margin-asc' ? 'selected' : ''}>Margin: Rendah - Tinggi</option>
                    <option value="profit-desc" ${itemInfoFilter.sort === 'profit-desc' ? 'selected' : ''}>Profit: Tinggi - Rendah</option>
                    <option value="profit-asc"  ${itemInfoFilter.sort === 'profit-asc' ? 'selected' : ''}>Profit: Rendah - Tinggi</option>
                    <option value="price-desc"  ${itemInfoFilter.sort === 'price-desc' ? 'selected' : ''}>Harga: Tinggi - Rendah</option>
                    <option value="price-asc"   ${itemInfoFilter.sort === 'price-asc' ? 'selected' : ''}>Harga: Rendah - Tinggi</option>
                </select>
            </div>
            <div class="flex gap-1.5 flex-wrap">${catButtons}</div>
        </div>
        <div class="px-4 py-2 border-b border-border bg-elevated/30 flex gap-3 text-xs">
            <span class="text-txt-primary"><b>${items.length}</b> TOTAL</span>
            <span class="text-emerald-400"><b>${profitable}</b> PROFIT</span>
        </div>
        <div class="flex-1 overflow-y-auto p-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">${itemCards}</div>
        </div>
    </div>`;
}

// Clear all inputs
function clearAllInventory() {
    if (!confirm("Apakah Anda yakin ingin mengosongkan seluruh stok input?")) return;
    [...rawMaterials, ...gems, ...ingots, ...base, ...resources].forEach(mat => {
        const el = document.getElementById(`input-${mat.replace(/ /g, '_')}`);
        if (el) el.value = 0;
    });
    saveInventoryToStorage();
    updateTotalStok();
    hitungOptimasi();
}

// Update stock total display text
function updateTotalStok() {
    let totalStok = 0;
    [...rawMaterials, ...resources].forEach(mat => {
        const el = document.getElementById(`input-${mat.replace(/ /g, '_')}`);
        totalStok += el ? (parseInt(el.value) || 0) : 0;
    });
    document.getElementById('total-stok').textContent = `${totalStok} items`;
}

function addInputListeners() {
    [...rawMaterials, ...resources].forEach(mat => {
        const input = document.getElementById(`input-${mat.replace(/ /g, '_')}`);
        if (input) {
            input.addEventListener('input', () => {
                saveInventoryToStorage();
                updateTotalStok();
            });
        }
    });
}

// Render item grid components
function renderMaterialGrid(containerId, materials, colorClass, getPriceFn) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = materials.map(mat => {
        const priceDisplay = getPriceFn ? getPriceFn(mat) : '-';
        return `
            <div class="bg-elevated border border-border rounded-lg p-2 sm:p-2.5 lg:p-3 flex flex-col items-center">
                <input
                    type="number"
                    id="input-${mat.replace(/ /g, '_')}"
                    value="0"
                    min="0"
                    class="w-full bg-void border border-border rounded px-1.5 py-1 text-center font-mono font-semibold text-xs sm:text-sm ${colorClass} focus:outline-none"
                    onfocus="if(this.value==='0'){this.value=''}" onblur="if(this.value===''){this.value='0'}"
                >
                <span class="text-[10px] sm:text-[11px] lg:text-xs text-txt-muted mt-1 text-center leading-tight">${mat}</span>
                <span class="text-[9px] sm:text-[10px] lg:text-xs text-gold-400 font-mono">${priceDisplay}</span>
            </div>
        `;
    }).join('');
}

function renderAllGrids() {
    renderMaterialGrid('input-grid', rawMaterials, 'text-teal-400', mat => {
        const p = database.raw_sell_prices[mat];
        return mat === 'Coal' ? `$${p}` : '-';
    });
    renderMaterialGrid('input-grid-gems', gems, 'text-pink-400', mat => {
        const item = itemMap[mat];  // O(1) lookup
        return item ? `$${item.sell_price}` : '-';
    });
    renderMaterialGrid('input-grid-ingots', ingots, 'text-cyan-400', mat => {
        const item = itemMap[mat];  // O(1) lookup
        return item ? `$${item.sell_price}` : '-';
    });
    renderMaterialGrid('input-grid-base', base, 'text-yellow-400', null);
    renderMaterialGrid('input-grid-resources', resources, 'text-teal-400', mat => {
        const p = database.raw_sell_prices[mat];
        return p !== undefined ? `$${p}` : '-';
    });
}

window.addEventListener('resize', debounce(() => updateCalculatorPanels(), 100));
