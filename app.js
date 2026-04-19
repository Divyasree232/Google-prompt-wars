// MOCK FIRESTORE SCHEMA (Simulating real-time tracking)
const facilityDatabase = [
    {
        id: "food-1",
        name: "Northside Burger Stall",
        type: "food",
        top: "20%", left: "30%",
        capacity: 150,
        currentOccupancy: 85,
        isOpen: true,
        menu: [
            { item: "Classic Burger", price: "$8.00", available: true },
            { item: "Fries", price: "$4.00", available: true },
            { item: "Hotdog", price: "$6.00", available: false }
        ]
    },
    {
        id: "food-2",
        name: "Gate 4 Snacks",
        type: "food",
        top: "70%", left: "80%",
        capacity: 100,
        currentOccupancy: 95, // Highly crowded
        isOpen: true,
        menu: [
            { item: "Pretzel", price: "$5.00", available: true },
            { item: "Soda", price: "$3.00", available: true }
        ]
    },
    {
        id: "rest-1",
        name: "VIP Lounge Sector B",
        type: "lounge",
        top: "50%", left: "10%",
        capacity: 50,
        currentOccupancy: 12,
        isOpen: true,
        features: ["Charging Ports", "Armchairs", "AC"]
    },
    {
        id: "restroom-1",
        name: "Sector C Restrooms",
        type: "restroom",
        top: "85%", left: "40%",
        capacity: 30,
        currentOccupancy: 28, // Almost full
        isOpen: true,
        cleanliness: "Good"
    },
    {
        id: "restroom-2",
        name: "Sector A Washrooms",
        type: "restroom",
        top: "15%", left: "70%",
        capacity: 40,
        currentOccupancy: 8,
        isOpen: true,
        cleanliness: "Excellent"
    }
];

// App Initialization
document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons();
    initNavigation();
    renderMapPins();
    renderAdminFacilityList();
    startLiveOccupancyTicker();
    
    // Update dashboard counter
    setTimeout(() => {
        const count = document.getElementById('dash-facilities');
        if(count) count.innerText = facilityDatabase.length;
    }, 500);
});

// --- NAVIGATION ---
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            const targetId = item.getAttribute('data-target');
            views.forEach(view => {
                view.classList.remove('active');
                if(view.id === targetId) view.classList.add('active');
            });
            // Auto re-render if jumping to admin
            if(targetId === 'admin') renderAdminFacilityList();
        });
    });
}

// --- MAP & SCHEMA RENDERING ---
function renderMapPins() {
    const mapArea = document.getElementById('stadium-map-area');
    if (!mapArea) return;
    
    // Clear old pins but keep the field
    const field = mapArea.querySelector('.field');
    mapArea.innerHTML = '';
    if(field) mapArea.appendChild(field);

    facilityDatabase.forEach(facility => {
        if(!facility.isOpen) return; // Don't show closed facilities
        
        const pin = document.createElement('div');
        const ratio = facility.currentOccupancy / facility.capacity;
        
        let statusClass = "capacity-low";
        if (ratio > 0.6) statusClass = "capacity-med";
        if (ratio > 0.85) statusClass = "capacity-high";
        
        pin.className = `map-pin ${facility.type} ${statusClass}`;
        pin.style.top = facility.top;
        pin.style.left = facility.left;
        
        let iconName = "store";
        if(facility.type === "restroom") iconName = "droplets";
        if(facility.type === "lounge") iconName = "sofa";
        
        pin.innerHTML = `
            <div class="pin-pulse" style="border-color:inherit"></div>
            <i data-lucide="${iconName}"></i>
            <span class="occupancy-badge">${facility.currentOccupancy}</span>
        `;
        
        pin.addEventListener('click', () => openFacilityModal(facility.id));
        mapArea.appendChild(pin);
    });
    lucide.createIcons();
}

// --- FACILITY MODAL ---
function calculateWaitTime(facility) {
    // Arbitrary dynamic wait time based on occupancy ratio
    const ratio = facility.currentOccupancy / facility.capacity;
    let baseMins = 0;
    if(facility.type === 'food') baseMins = Math.floor(ratio * 20); // up to 20 mins
    if(facility.type === 'restroom') baseMins = Math.floor(ratio * 10); // up to 10 mins
    return Math.max(0, baseMins) + " mins";
}

function openFacilityModal(id) {
    const facility = facilityDatabase.find(f => f.id === id);
    if(!facility) return;
    
    const modal = document.getElementById('facility-modal');
    const content = document.getElementById('facility-modal-content');
    
    const ratio = facility.currentOccupancy / facility.capacity;
    let color = "var(--accent)";
    let statusText = "Available";
    if (ratio >= 0.6) { color = "var(--warning)"; statusText = "Moderate Traffic"; }
    if (ratio >= 0.85) { color = "var(--danger)"; statusText = "Near Full Capacity"; }
    
    const fillPercent = Math.min(100, ratio * 100);
    
    let detailsHTML = "";
    if (facility.type === "food") {
        detailsHTML = `
            <h4 style="margin:1rem 0 0.5rem">Live Menu Details</h4>
            <div style="background:rgba(255,255,255,0.05); border-radius:8px; padding:0.5rem">
                ${facility.menu.map(m => `
                    <div class="menu-item">
                        <span style="${m.available ? 'color:white' : 'text-decoration:line-through; color:gray'}">${m.item}</span>
                        <span>${m.available ? m.price : '<span style="color:var(--danger); font-size:0.8rem">SOLD OUT</span>'}</span>
                    </div>
                `).join('')}
            </div>
        `;
    } else if (facility.type === "restroom") {
        detailsHTML = `<p style="margin-top:1rem; color:var(--text-secondary)">Cleanliness Status: <strong style="color:white">${facility.cleanliness}</strong></p>`;
    } else if (facility.type === "lounge") {
        detailsHTML = `<p style="margin-top:1rem; color:var(--text-secondary)">Amenities: <strong style="color:white">${facility.features.join(", ")}</strong></p>`;
    }
    
    content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem">
            <h2 style="font-size:1.8rem;">${facility.name}</h2>
            <i data-lucide="x" style="cursor:pointer" onclick="document.getElementById('facility-modal').classList.remove('active')"></i>
        </div>
        
        <div style="display:flex; gap:1rem; margin-bottom:1.5rem">
            <span style="background:rgba(255,255,255,0.1); padding:0.4rem 0.8rem; border-radius:30px; font-size:0.9rem"><i data-lucide="users" style="width:14px; display:inline"></i> ${facility.currentOccupancy} / ${facility.capacity} People</span>
            <span style="background:rgba(255,255,255,0.1); padding:0.4rem 0.8rem; border-radius:30px; font-size:0.9rem"><i data-lucide="clock" style="width:14px; display:inline"></i> Est. Wait: ${calculateWaitTime(facility)}</span>
        </div>
        
        <p style="font-weight:bold; color:${color}">${statusText}</p>
        <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width:${fillPercent}%; background:${color}; color:${color}"></div>
        </div>
        
        ${detailsHTML}
        
        <button class="btn btn-primary" style="margin-top:2rem; width:100%" onclick="document.getElementById('facility-modal').classList.remove('active')">AI Smart Route Here</button>
    `;
    
    lucide.createIcons();
    modal.classList.add('active');
}

// --- LIVE TICKER (Mocks Firestore Real-time Sync) ---
function startLiveOccupancyTicker() {
    setInterval(() => {
        let changed = false;
        facilityDatabase.forEach(fac => {
            // Randomly let a person enter or leave
            const diff = Math.floor(Math.random() * 5) - 2; // -2 to +2
            const newOcc = fac.currentOccupancy + diff;
            if(newOcc >= 0 && newOcc <= fac.capacity * 1.1) {
                fac.currentOccupancy = newOcc;
                changed = true;
            }
        });
        
        if (changed) {
            // Re-render map pins quietly if we aren't hovering them to prevent flicker
            // In a pro app we'd target specific DOM nodes via ID. Here we just re-render.
            renderMapPins();
            
            // If admin view is open, re-render admin list
            if(document.getElementById('admin').classList.contains('active')) {
               renderAdminFacilityList();
            }
        }
    }, 4500); // Trigger every 4.5 seconds
}

// --- ADMIN CONTROL ---
function renderAdminFacilityList() {
    const list = document.getElementById('admin-facility-list');
    if(!list) return;
    
    list.innerHTML = "";
    facilityDatabase.forEach(fac => {
        const row = document.createElement('div');
        row.style.cssText = "display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); padding:1rem; border-radius:12px; border:1px solid var(--border)";
        
        row.innerHTML = `
            <div>
                <h4 style="margin-bottom:0.3rem">${fac.name} <span style="font-size:0.8rem; color:var(--text-secondary)">(${fac.type})</span></h4>
                <p style="font-size:0.9rem; color:${fac.isOpen ? 'var(--accent)' : 'var(--danger)'}">Status: ${fac.isOpen ? 'Operating' : 'Closed by Admin'}</p>
                <p style="font-size:0.8rem; color:var(--text-secondary)">Crowd: ${fac.currentOccupancy} / ${fac.capacity}</p>
            </div>
            <div style="display:flex; gap:0.5rem">
                <button class="btn" style="background:${fac.isOpen ? 'var(--danger)' : 'var(--accent)'}; color:white; padding:0.5rem 1rem; font-size:0.85rem" onclick="toggleFacilityState('${fac.id}')">${fac.isOpen ? 'Force Close' : 'Re-open'}</button>
            </div>
        `;
        list.appendChild(row);
    });
}

window.toggleFacilityState = function(id) {
    const fac = facilityDatabase.find(f => f.id === id);
    if(fac) {
        fac.isOpen = !fac.isOpen;
        if(!fac.isOpen) fac.currentOccupancy = 0; // flush crowd
        renderMapPins();
        renderAdminFacilityList();
    }
}

// --- AI LOGIC UPGRADE (Dynamic Schema Parsing) ---
const aiPanel = document.getElementById('ai-panel');
const aiHeader = document.getElementById('ai-header');
const aiInput = document.getElementById('ai-text-input');
const aiSendBtn = document.getElementById('ai-send-btn');
const chatMessages = document.getElementById('chat-messages');

aiHeader.addEventListener('click', () => {
    aiPanel.classList.toggle('collapsed');
    if(!aiPanel.classList.contains('collapsed')) aiInput.focus();
});

function getAIResponse(query) {
    query = query.toLowerCase();
    
    if (query.includes('food') || query.includes('eat') || query.includes('hungry')) {
        const foods = facilityDatabase.filter(f => f.type === 'food' && f.isOpen);
        if(!foods.length) return "All food stalls are currently closed by operations.";
        
        // Sort by occupancy ratio
        foods.sort((a,b) => (a.currentOccupancy/a.capacity) - (b.currentOccupancy/b.capacity));
        const best = foods[0];
        return `Based on live Firestore data, I recommend **${best.name}**. It's currently at ${(best.currentOccupancy/best.capacity*100).toFixed(0)}% capacity. The estimated wait is only **${calculateWaitTime(best)}**!`;
    }
    
    if (query.includes('restroom') || query.includes('bathroom')) {
        const rooms = facilityDatabase.filter(f => f.type === 'restroom' && f.isOpen);
        rooms.sort((a,b) => (a.currentOccupancy/a.capacity) - (b.currentOccupancy/b.capacity));
        const best = rooms[0];
        return `The least crowded option right now is **${best.name}**. Wait time is approx **${calculateWaitTime(best)}**.`;
    }
    
    if (query.includes('sit') || query.includes('rest') || query.includes('lounge')) {
        const rests = facilityDatabase.filter(f => f.type === 'lounge' && f.isOpen);
        const availableSpace = rests[0].capacity - rests[0].currentOccupancy;
        return `**${rests[0].name}** currently has **${availableSpace} seats available**. It features ${rests[0].features.join(' and ')}.`;
    }

    return "I am tied into the live facility network. Ask me to find the nearest empty seats, food stalls, or washrooms, and I'll crunch the live capacity numbers for you!";
}

const handleSendMessage = () => {
    const text = aiInput.value.trim();
    if(!text) return;

    chatMessages.innerHTML += `<div class="message msg-user">${text}</div>`;
    aiInput.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    setTimeout(() => {
        const responseText = getAIResponse(text);
        chatMessages.innerHTML += `
            <div class="message msg-ai">
                <div style="display:flex; align-items:start; gap:0.5rem">
                    <i data-lucide="sparkles" style="width:16px; height:16px; color: var(--primary); margin-top:2px;"></i>
                    <span>${responseText}</span>
                </div>
            </div>`;
        lucide.createIcons();
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 1000);
};

aiSendBtn.addEventListener('click', handleSendMessage);
aiInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') handleSendMessage(); });
