// ============================================
// OPTIMIZATION ALGORITHMS & MATHS
// ============================================

// Alias mapping: some materials can be substituted with another (can be dynamically overridden by database config)
let materialAliases = {
    'Uncut Ruby': 'Ruby',
    'Uncut Emerald': 'Emerald',
    'Uncut Sapphire': 'Sapphire',
    'Uncut Diamond': 'Diamond',
    'Ruby': 'Uncut Ruby',
    'Emerald': 'Uncut Emerald',
    'Sapphire': 'Uncut Sapphire',
    'Diamond': 'Uncut Diamond'
};


// Calculate expanded stock including all intermediate materials that can be made
// Optimized: tracks expanded items to prevent infinite loops instead of skipping non-zero stocks
function getExpandedStock(stokUser) {
    const expanded = { ...stokUser };
    const expandedItems = new Set();

    // Keep expanding until no new materials can be made
    let changed = true;
    let iterations = 0;
    const maxIterations = 20; // Prevent infinite loops

    while (changed && iterations < maxIterations) {
        changed = false;
        iterations++;

        for (let [itemName, recipe] of Object.entries(recipeMap)) {
            // Skip if this item has already been expanded
            if (expandedItems.has(itemName)) continue;

            // Skip if this item has no recipe (raw materials)
            if (!recipe || Object.keys(recipe).length === 0) continue;

            // Check for aliases to avoid double-counting stock
            const alias = materialAliases[itemName];
            if (!expanded[itemName] && alias && expanded[alias]) {
                continue;
            }

            // Check if we can make this item
            let maxCanMake = Infinity;
            for (let [bahan, qty] of Object.entries(recipe)) {
                // Use getAvailableStockWithExpanded which looks at both direct and aliases
                const tersedia = getAvailableStockWithAliases(expanded, bahan);
                const canMake = Math.floor(tersedia / qty);
                if (canMake < maxCanMake) maxCanMake = canMake;
            }

            if (maxCanMake > 0) {
                expanded[itemName] = (expanded[itemName] || 0) + maxCanMake;
                expandedItems.add(itemName);
                changed = true;
            }
        }
    }

    return expanded;
}

// Get available stock with alias support
function getAvailableStockWithAliases(stokUser, bahan) {
    if ((stokUser[bahan] || 0) > 0) return stokUser[bahan];
    const alias = materialAliases[bahan];
    if (alias && (stokUser[alias] || 0) > 0) return stokUser[alias];
    return 0;
}

// Get available stock, considering aliases
function getAvailableStock(stokUser, bahan) {
    // Direct check first
    if ((stokUser[bahan] || 0) > 0) return stokUser[bahan];

    // Check alias
    const alias = materialAliases[bahan];
    if (alias && (stokUser[alias] || 0) > 0) return stokUser[alias];

    return 0;
}

// Get the actual material name that has stock (for deduction)
function getActualMaterialAvailable(stokUser, bahan) {
    if ((stokUser[bahan] || 0) > 0) return bahan;
    const alias = materialAliases[bahan];
    if (alias && (stokUser[alias] || 0) > 0) return alias;
    return null;
}

// Get recursive raw material cost of an item with memoization
function getRawMaterialCost(itemName) {
    if (!database) return 0;
    if (rawMaterialCostCache[itemName] !== undefined) {
        return rawMaterialCostCache[itemName];
    }

    let cost = 0;
    // Jika ada harga jual mentah langsung, gunakan itu
    if (database.raw_sell_prices[itemName] !== undefined) {
        cost = database.raw_sell_prices[itemName];
    } else {
        // Jika tidak, cari dari resep
        const recipe = recipeMap[itemName];
        if (recipe && Object.keys(recipe).length > 0) {
            for (let [bahan, qty] of Object.entries(recipe)) {
                cost += qty * getRawMaterialCost(bahan);
            }
        } else {
            // Jika tidak ada di resep tapi ada di items, gunakan sell_price
            const item = itemMap[itemName];
            if (item) {
                cost = item.sell_price;
            }
        }
    }

    rawMaterialCostCache[itemName] = cost;
    return cost;
}

// Get price for a material (considering aliases for pricing)
function getMaterialPrice(bahan) {
    // Direct lookup first
    const item = database.items.find(i => i.name === bahan);
    if (item) return item.sell_price;

    // Check if this material is an alias - get price from the original
    const alias = materialAliases[bahan];
    if (alias) {
        const aliasItem = database.items.find(i => i.name === alias);
        if (aliasItem) return aliasItem.sell_price;
    }

    // Fallback to raw_sell_prices
    return database.raw_sell_prices[bahan] || 0;
}

function hitungProfitPerPcs(strategi) {
    let modal = 0;
    for (let [bahan, qty] of Object.entries(strategi.ingredients)) {
        const price = getRawMaterialCost(bahan);
        modal += qty * price;
    }
    return strategi.sell_price - modal;
}

// Calculate rankings for individual items
function hitungIndividualRankings(stokUser) {
    const timeLimit = getTimeLimitSeconds();
    // Expand stock to include intermediate materials that can be made
    const expandedStok = getExpandedStock(stokUser);

    let results = processedItems.map(strategi => {
        const profitSatuan = hitungProfitPerPcs(strategi);
        const steps = strategi.processing_steps || 0;
        const time = strategi.processing_time || 0;
        const rawTime = strategi.processing_time_raw || 0;
        const profitPerDetik = rawTime > 0 ? (profitSatuan / rawTime) : 0;

        let maxBisa = Infinity;
        let bahanKekurangan = null;

        for (let [bahan, butuhQty] of Object.entries(strategi.ingredients)) {
            const tersedia = getAvailableStockWithAliases(expandedStok, bahan);
            const hitung = Math.floor(tersedia / butuhQty);
            if (hitung < maxBisa) {
                maxBisa = hitung;
                bahanKekurangan = bahan;
            }
        }

        // Apply time limit constraint to maxBisa
        if (maxBisa > 0 && rawTime > 0 && timeLimit !== Infinity) {
            const maxByTime = Math.floor(timeLimit / rawTime);
            if (maxByTime < maxBisa) {
                maxBisa = maxByTime;
                if (maxBisa === 0) {
                    bahanKekurangan = "Limit Waktu";
                }
            }
        }

        return {
            nama: strategi.name,
            category: strategi.category,
            sellPrice: strategi.sell_price,
            profitSatuan,
            profitPerDetik,
            maxBisa: maxBisa === Infinity ? 9999 : maxBisa,
            bahanKekurangan: maxBisa === 0 ? (bahanKekurangan || "Limit Waktu") : null,
            ingredients: strategi.ingredients,
            processing_steps: steps,
            processing_time: time,
            processing_time_raw: rawTime
        };
    });

    results = results.filter(r => r.maxBisa > 0);

    const sortMode = sortModeIndividual;
    if (sortMode === 'time') {
        results.sort((a, b) => b.profitPerDetik - a.profitPerDetik);
    } else {
        results.sort((a, b) => b.profitSatuan - a.profitSatuan);
    }
    return results;
}

// Greedy algorithm for optimal item combination
function hitungComboGreedy(stokUser) {
    const sortMode = sortModeCombo;
    const timeLimit = getTimeLimitSeconds();
    // Expand stock to include intermediate materials that can be made
    const expandedStok = getExpandedStock(stokUser);

    let strategies = processedItems.map(s => {
        const profitSatuan = hitungProfitPerPcs(s);
        const rawTime = s.processing_time_raw || 0;
        const profitPerDetik = rawTime > 0 ? (profitSatuan / rawTime) : 0;
        return {
            ...s,
            profitSatuan,
            profitPerDetik,
            processing_time_raw: rawTime
        };
    });

    if (sortMode === 'time') {
        strategies.sort((a, b) => b.profitPerDetik - a.profitPerDetik);
    } else {
        strategies.sort((a, b) => b.profitSatuan - a.profitSatuan);
    }

    let stokTersisa = { ...expandedStok };
    let comboResults = [];
    let categoryProfit = {};
    let totalBahanTerpakai = 0;
    let totalHargaMentah = 0;
    let totalDuration = 0;
    const totalBahanAwal = Object.values(stokUser).reduce((s, v) => s + v, 0);

    // Inner helper to avoid code duplication between Phase 1 and Phase 2
    function processStrategy(strategi) {
        if (timeLimit !== Infinity && totalDuration >= timeLimit) return;

        let maxBisa = Infinity;
        for (let [bahan, qty] of Object.entries(strategi.ingredients)) {
            const hitung = Math.floor(getAvailableStock(stokTersisa, bahan) / qty);
            if (hitung < maxBisa) maxBisa = hitung;
        }

        // Apply remaining time limit constraint
        if (maxBisa > 0 && strategi.processing_time_raw > 0 && timeLimit !== Infinity) {
            const remainingTime = timeLimit - totalDuration;
            const maxByTime = Math.floor(remainingTime / strategi.processing_time_raw);
            if (maxByTime < maxBisa) maxBisa = maxByTime;
        }

        if (maxBisa <= 0) return;

        const profitTotal = strategi.profitSatuan * maxBisa;
        let modalStrategi = 0;
        const rincian = [];

        for (let [bahan, qty] of Object.entries(strategi.ingredients)) {
            // Deduct from the actual material we have (original or alias)
            const actualMaterial = getActualMaterialAvailable(stokTersisa, bahan);
            if (actualMaterial) {
                stokTersisa[actualMaterial] = (stokTersisa[actualMaterial] || 0) - qty * maxBisa;
            }
            modalStrategi += qty * getRawMaterialCost(bahan);
            rincian.push(`${qty * maxBisa}x ${bahan}`);
            totalBahanTerpakai += qty * maxBisa;
        }

        totalDuration += (strategi.processing_time_raw || 0) * maxBisa;

        comboResults.push({
            nama: strategi.name,
            category: strategi.category,
            sellPrice: strategi.sell_price,
            ingredients: strategi.ingredients,
            jumlah: maxBisa,
            profitSatuan: strategi.profitSatuan,
            profitTotal,
            modalTotal: modalStrategi * maxBisa,
            rincian: rincian.join(' + '),
            processing_steps: strategi.processing_steps,
            processing_time: strategi.processing_time,
            processing_time_raw: strategi.processing_time_raw
        });

        categoryProfit[strategi.category] = (categoryProfit[strategi.category] || 0) + profitTotal;
        totalHargaMentah += modalStrategi * maxBisa;
    }

    // Phase 1: profitable strategies first
    for (let strategi of strategies) {
        if (strategi.profitSatuan <= 0) continue;
        processStrategy(strategi);
    }

    // Phase 2: loss-making strategies to use remaining materials
    for (let strategi of strategies) {
        if (strategi.profitSatuan > 0) continue;
        const usesRemaining = Object.keys(strategi.ingredients)
            .some(bahan => getAvailableStock(stokTersisa, bahan) > 0);
        if (usesRemaining) processStrategy(strategi);
    }

    const totalProfit = comboResults.reduce((s, i) => s + i.profitTotal, 0);
    const totalProduksi = comboResults.reduce((s, i) => s + i.jumlah, 0);

    return {
        strategies: comboResults,
        summary: {
            totalProfit,
            totalProduksi,
            totalHargaMentah,
            percentageUsed: totalBahanAwal > 0 ? Math.round((totalBahanTerpakai / totalBahanAwal) * 100) : 0,
            categoryProfit,
            remainingMaterials: stokTersisa,
            totalDuration
        }
    };
}

function hitungOptimasi() {
    if (!database) { alert('Database belum dimuat!'); return; }
    const stokUser = getStokUser();
    renderIndividualResults(hitungIndividualRankings(stokUser));
    renderComboResults(hitungComboGreedy(stokUser));
}
