/**
Inventory Pro - Complete Application Logic (MERGED VERSION with Soft Delete)
Features:
- bcrypt password hashing
- Enhanced ID search with highlighting
- Mobile menu support
- Soft delete for products with movement history
- ID filtering 1-1000 range
- Reorder level removed
- Product Condition field
*/
'use strict';
// ============================================================================
// STATE MANAGEMENT
// ============================================================================
const AppState = {
currentUser: null,
products: [],
categories: [],
buildings: [],
movements: [],
selectedProductId: null,
isLoading: false,
clockInterval: null,
showArchived: false,
reset() {
    this.currentUser = null;
    this.products = [];
    this.categories = [];
    this.buildings = [];
    this.movements = [];
    this.selectedProductId = null;
    this.isLoading = false;
    this.showArchived = false;
    if (this.clockInterval) {
        clearInterval(this.clockInterval);
        this.clockInterval = null;
    }
}
};
// ============================================================================
// UTILITIES
// ============================================================================
const Utils = {
escapeHtml(text) {
if (text == null) return '';
const div = document.createElement('div');
div.textContent = String(text);
return div.innerHTML;
},
formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('en-US', AppConfig.DATE_FORMAT);
    } catch {
         return 'Invalid Date';
    }
},

formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleString('en-US');
    } catch  {
        return 'Invalid Date';
    }
},

debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
},

throttle(func, limit) {
    let inThrottle;
    return (...args) => {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
},

isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
},

parseInteger(value, defaultValue = 0) {
    if (value === null || value === undefined || value === '') return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
},

parseFloat(value, defaultValue = 0) {
    if (value === null || value === undefined || value === '') return defaultValue;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
},

validateIdRange(id) {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
        return { valid: false, error: 'ID must be a number' };
    }
    if (numId < AppConfig.MIN_ID || numId > AppConfig.MAX_ID) {
        return { valid: false, error: `ID must be between ${AppConfig.MIN_ID} and ${AppConfig.MAX_ID}` };
    }
    return { valid: true, error: null };
},

validateAndParseId(id) {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return null;
    if (numId < AppConfig.MIN_ID || numId > AppConfig.MAX_ID) return null;
    return numId;
},

async getNextAvailableId(tableName) {
    const supabase = window.getSupabaseClient();
    if (!supabase) return null;
    
     try {
        const { data, error } = await supabase
            .from(tableName)
            .select('id')
            .eq('is_active', true)
            .order('id', { ascending: true });
            
        if (error) throw error;
        
        const existingIds = (data || []).map(item => item.id);
        
        for (let i = AppConfig.MIN_ID; i <= AppConfig.MAX_ID; i++) {
            if (!existingIds.includes(i)) {
                return i;
            }
        }
        
        console.error(`No available IDs in range for ${tableName}`);
        return null;
    } catch (error) {
        console.error(`Error in getNextAvailableId:`, error);
        return null;
    }
},

async isIdAvailable(tableName, id) {
    const supabase = window.getSupabaseClient();
    if (!supabase) return false;
    
    const { data, error } = await supabase
        .from(tableName)
        .select('id')
        .eq('id', id)
        .eq('is_active', true)
        .single();
        
    if (error && error.code === 'PGRST116') return true;
    return false;
},

showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
     notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#17a2b8'};
        color: white;
         border-radius: 8px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, duration);
},

validateForm(formId, rules) {
    const form = document.getElementById(formId);
    if (!form) return { isValid: false, errors: ['Form not found'] };
    
    const errors = [];
    for (const [fieldId, rule] of Object.entries(rules)) {
        const element = document.getElementById(fieldId);
        if (!element) continue;
        
        const value = element.value.trim();
        if (rule.required && !value) {
            errors.push(rule.message || `${fieldId} is required`);
        }
        if (rule.pattern && value && !rule.pattern.test(value)) {
            errors.push(rule.patternMessage || `${fieldId} is invalid`);
        }
        if (rule.minLength && value && value.length < rule.minLength) {
            errors.push(rule.minLengthMessage || `${fieldId} must be at least ${rule.minLength} characters`);
        }
    }
    
    return { isValid: errors.length === 0, errors };
},

async hashPassword(password) {
    if (typeof bcrypt !== 'undefined') {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    }
    console.warn('bcrypt not available, using plain text (development only)');
    return password;
},

async verifyPassword(password, hash) {
    if (typeof bcrypt !== 'undefined') {
        return await bcrypt.compare(password, hash);
    }
    return password === hash;
},

// Helper to generate condition badge HTML
getConditionBadge(condition) {
    const lowerCondition = (condition || '').toLowerCase();
    let badgeClass = 'working-storage'; // Default fallback
    let label = condition || 'Unknown';
    let icon = 'fa-box';

    if (lowerCondition.includes('assigned')) {
        badgeClass = 'working-assigned';
        icon = 'fa-user-check';
    } else if (lowerCondition.includes('storage')) {
        badgeClass = 'working-storage';
        icon = 'fa-warehouse';
    } else if (lowerCondition.includes('defective')) {
        badgeClass = 'defective';
        icon = 'fa-exclamation-triangle';
    } else if (lowerCondition.includes('damaged')) {
        badgeClass = 'damaged';
        icon = 'fa-times-circle';
    }

    return `<span class="condition-badge ${badgeClass}"><i class="fas ${icon}" aria-hidden="true"></i> ${Utils.escapeHtml(label)}</span>`;
}
};
// Add notification animations
if (!document.querySelector('#notification-styles')) {
const style = document.createElement('style');
style.id = 'notification-styles';
style.textContent = `@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } } @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } } .highlight-row { animation: highlight 1s ease-in-out; background-color: #fff3cd !important; } @keyframes highlight { 0% { background-color: #ffeb3b; } 100% { background-color: #fff3cd; } } .product-archived { opacity: 0.7; text-decoration: line-through; } .archived-badge { background: #6c757d; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; margin-left: 8px; }`;
document.head.appendChild(style);
}
// ============================================================================
// UI MANAGER
// ============================================================================
const UIManager = {
showLoading() {
const el = document.getElementById('loading-overlay');
if (el) {
el.style.display = 'flex';
AppState.isLoading = true;
}
},
hideLoading() {
    const el = document.getElementById('loading-overlay');
    if (el) {
        el.style.display = 'none';
        AppState.isLoading = false;
    }
},

showError(elementId, message, duration = 5000) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = message;
    el.style.display = 'block';
    if (duration) {
        setTimeout(() => {
            el.textContent = '';
            el.style.display = 'none';
        }, duration);
    }
    console.error('UI Error:', message);
    Utils.showNotification(message, 'error', duration);
},

hideError(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = '';
        el.style.display = 'none';
     }
},

showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const target = document.getElementById(viewId);
    if (target) target.classList.add('active');
},

showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(sectionId);
    if (target) target.classList.add('active');
    
    const titleMap = {
        'dashboard-home': 'Dashboard',
        'products-view': 'Products Management',
        'categories-view': 'Categories Management',
        'buildings-view': 'Buildings Management',
        'stock-view': 'Stock Management',
        'reports-view': 'Reports & Analytics',
        'profile-view': 'User Profile'
    };
    const titleEl = document.getElementById('page-title');
    if (titleEl && titleMap[sectionId]) {
        titleEl.textContent = titleMap[sectionId];
    }
},

updateNavigation(activeView) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.view === activeView);
    });
},

openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) { 
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
},

closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
},

updateDateTime() {
    const dateEl = document.getElementById('current-date');
    const timeEl = document.getElementById('current-time');
    
    const now = new Date();
    
    if (dateEl) {
        dateEl.textContent = now.toLocaleDateString('en-US', AppConfig.DATE_FORMAT);
    }
    
    if (timeEl) {
        timeEl.textContent = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
             second: '2-digit',
            hour12: true
        });
    }
},

updateDateDisplay() {
    const el = document.getElementById('current-date');
    if (el) {
        el.textContent = new Date().toLocaleDateString('en-US', AppConfig.DATE_FORMAT);
    }
},

updateUserUI() {
    const nameEl = document.getElementById('user-name');
    const roleEl = document.getElementById('user-role');
    if (nameEl) nameEl.textContent = AppState.currentUser?.full_name || 'User';
    if (roleEl) roleEl.textContent = AppState.currentUser?.role || 'User';
},

clearForm(formId) {
    const form = document.getElementById(formId);
    if (form) form.reset();
}
};
// ============================================================================
// AUTH SERVICE
// ============================================================================
const AuthService = {
async checkAuth() {
try {
const session = localStorage.getItem(AppConfig.SESSION_KEY);
if (!session) {
UIManager.showView('login-view');
return false;
}
        const user = JSON.parse(session);
        const supabase = window.getSupabaseClient();
        
        if (!supabase) {
            this.logout();
            return false;
        }
        
        const { data, error } = await supabase
            .from(TABLES.USERS)
            .select('id, email, full_name, role, is_active')
            .eq('id', user.id)
            .single();
            
        if (data && !error && data.is_active !== false) {
            AppState.currentUser = data;
            UIManager.updateUserUI();
            await DataService.loadDashboard();
            UIManager.showView('dashboard-view');
            return true;
        }
        
        this.logout();
        return false;
    } catch (error) {
        console.error('Auth check failed:', error);
        this.logout();
        return false;
    }
},

async login(email, password) {
    if (!email || !password) {
        throw new Error('Email and password required');
    }
    
    const supabase = window.getSupabaseClient();
    if (!supabase) {
        throw new Error('Database unavailable');
    }
    
    const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .single();
        
    if (error || !data) {
        throw new Error('Invalid credentials');
    }
    
    if (!data.is_active) {
        throw new Error('Account is disabled');
    }
    
    const isValidPassword = await Utils.verifyPassword(password, data.password_hash);
    
    if (!isValidPassword) {
        throw new Error('Invalid credentials');
    }
    
    const session = { 
        id: data.id, 
        email: data.email, 
        full_name: data.full_name, 
        role: data.role 
    };
    
    localStorage.setItem(AppConfig.SESSION_KEY, JSON.stringify(session));
    AppState.currentUser = session;
    
    await supabase
        .from(TABLES.USERS)
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.id);
        
    return data; 
},

async register(fullName, email, password, confirmPassword) {
    if (!fullName || !email || !password) {
        throw new Error('All fields required');
    }
    
    if (!Utils.isValidEmail(email)) {
        throw new Error('Invalid email format');
    }
    
    if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
    }
    
    if (password.length < AppConfig.MIN_PASSWORD_LENGTH) {
        throw new Error(`Password must be at least ${AppConfig.MIN_PASSWORD_LENGTH} characters`);
    }
    
    const supabase = window.getSupabaseClient();
    if (!supabase) {
        throw new Error('Database unavailable');
    }
    
    const hashedPassword = await Utils.hashPassword(password);
    
    const { data, error } = await supabase
        .from(TABLES.USERS)
        .insert([{
            email: email.toLowerCase().trim(),
            full_name: fullName.trim(),
            password_hash: hashedPassword,
            role: 'user',
            is_active: true
        }])
        .select()
        .single();
        
    if (error) {
        if (error.code === '23505') {
            throw new Error('Email already exists');
        }
        throw new Error(`Registration failed: ${error.message}`);
    }
    
    return data;
},

logout() { 
    AppState.reset();
    localStorage.removeItem(AppConfig.SESSION_KEY);
    UIManager.clearForm('login-form');
    UIManager.showView('login-view');
    Utils.showNotification('Logged out successfully', 'info');
},

async changePassword(current, newPassword, confirm) {
    if (!current || !newPassword || !confirm) {
        throw new Error('All fields required');
    }
    
    if (newPassword !== confirm) {
        throw new Error('New passwords do not match');
    }
    
    if (newPassword.length < AppConfig.MIN_PASSWORD_LENGTH) {
        throw new Error(`Password must be at least ${AppConfig.MIN_PASSWORD_LENGTH} characters`);
    }
    
    const supabase = window.getSupabaseClient();
    if (!supabase || !AppState.currentUser) {
        throw new Error('Not authenticated');
    }
    
    const { data: user, error: fetchErr } = await supabase
        .from(TABLES.USERS)
        .select('password_hash')
        .eq('id', AppState.currentUser.id)
        .single();
        
    if (fetchErr || !user) {
        throw new Error('User not found');
    }
    
    const isValidCurrent = await Utils.verifyPassword(current, user.password_hash);
    
    if (!isValidCurrent) {
        throw new Error('Current password is incorrect');
    }
    
    const hashedNew = await Utils.hashPassword(newPassword);
    
    const { error: updateErr } = await supabase
        .from(TABLES.USERS)
        .update({ password_hash: hashedNew })
        .eq('id', AppState.currentUser.id);
        
    if (updateErr) {
        throw new Error('Password update failed');
    }
    
    return true;
}
};
// ============================================================================
// DATA SERVICE
// ============================================================================
const DataService = {
async loadDashboard() {
try {
UIManager.showLoading();
const stats = await this.getDashboardStats();
await this.renderDashboardStats(stats);
await Promise.all([this.loadRecentMovements(), this.loadTopProducts()]);
} catch (error) {
console.error('Dashboard load failed:', error);
UIManager.showError('dashboard-error', 'Failed to load dashboard');
} finally {
UIManager.hideLoading();
}
},
async getDashboardStats() {
    const supabase = window.getSupabaseClient();
    if (!supabase) throw new Error('Database unavailable');
    
    const { data: products, error } = await supabase
        .from(TABLES.PRODUCTS)
        .select('stock_quantity')
        .eq('is_active', true);
        
    if (error) throw error;
    
    const totalProducts = products?.length || 0;
    const totalItems = products?.reduce((sum, p) => sum + (p.stock_quantity || 0), 0) || 0;
    
    return { total_products: totalProducts, total_items: totalItems };
},

async renderDashboardStats(stats) {
    const container = document.getElementById('stats-container');
    if (!container) return;
    
    const statsData = [
        { title: 'Total Products', value: stats.total_products, icon: 'fa-boxes', color: '#4361ee' },
        { title: 'Items in Stock', value: stats.total_items, icon: 'fa-chart-bar', color: '#06d6a0' }
    ];
    
    container.innerHTML = statsData.map(stat => `
        <div class="stat-card">
            <i class="fas ${stat.icon} stat-icon" style="color:${stat.color};opacity:0.3"></i>
            <div class="stat-value" style="color:${stat.color}">${Utils.escapeHtml(String(stat.value))}</div>
            <div class="stat-title">${Utils.escapeHtml(stat.title)}</div>
        </div>
    `).join('');
},

async loadRecentMovements() {
    const supabase = window.getSupabaseClient();
    if (!supabase) return;
    
    const { data, error } = await supabase
        .from(TABLES.MOVEMENTS)
        .select('*, products:product_id(name)')
        .order('created_at', { ascending: false })
        .limit(5);
        
    if (error) {
        console.error('Movements load failed:', error);
        return;
    }
    
    const container = document.getElementById('recent-movements');
    if (!container) return;
    
    container.innerHTML = data?.length > 0 
        ? data.map(m => `
            <div class="movement-item">
                <div class="movement-product">${Utils.escapeHtml(m.products?.name || 'Unknown')}</div>
                <div class="movement-details">
                    <span class="movement-date">${Utils.formatDate(m.created_at)}</span>
                    <span class="movement-type ${m.movement_type === 'IN' ? 'in' : 'out'}">
                        ${m.movement_type} ${m.quantity}
                    </span>
                </div>
            </div>
        `).join('')
        : '<p style="color:var(--text-secondary);text-align:center;padding:20px">No recent movements</p>';
},

async loadTopProducts() {
    const supabase = window.getSupabaseClient();
    if (!supabase) return;
    
    const { data, error } = await supabase
        .from(TABLES.PRODUCTS)
        .select('id, name, stock_quantity')
        .eq('is_active', true)
        .order('stock_quantity', { ascending: false })
        .limit(5);
        
    if (error) {
        console.error('Products load failed:', error);
        return;
    }
    
    const container = document.getElementById('top-products');
    if (!container) return;
    
    container.innerHTML = data?.length > 0
        ? data.map(p => `
            <div class="product-item">
                <div class="product-name">${Utils.escapeHtml(p.name)}</div>
                <div class="product-details">
                    <span class="product-stock">Stock: ${p.stock_quantity || 0}</span>
                </div>
            </div>
        `).join('')
        : '<p style="color:var(--text-secondary);text-align:center;padding:20px">No products</p>';
},

async loadProducts() {
    try {
        UIManager.showLoading();
        const supabase = window.getSupabaseClient();
        if (!supabase) throw new Error('Database unavailable');
        
        let query = supabase
            .from(TABLES.PRODUCTS)
            .select(`
                *,
                categories:category_id(name),
                buildings:building_id(name)
            `);
        
        if (!AppState.showArchived) {
            query = query.eq('is_active', true);
        }
        
        const { data, error } = await query.order('id', { ascending: true });
            
        if (error) throw error;
        AppState.products = data || [];
        this.renderProductsTable(AppState.products);
    } catch (error) {
        console.error('Products load failed:', error);
        UIManager.showError('products-error', 'Failed to load products');
    } finally {
        UIManager.hideLoading();
    }
},

renderProductsTable(products, highlightedId = null) {
    const tbody = document.getElementById('products-list');
    if (!tbody) return;
    
    if (!products?.length) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center">No products found</tr>';
        return;
    }
    
    tbody.innerHTML = products.map(p => {
        const isArchived = p.is_active === false;
        const stock = p.stock_quantity || 0;
        const status = stock > 0 
            ? '<span class="status-badge status-ok">✓ In Stock</span>'
            : '<span class="status-badge status-low">⚠️ Out of Stock</span>';
        
        const highlightClass = highlightedId === p.id ? 'highlight-row' : '';
        const archivedClass = isArchived ? 'product-archived' : '';
        const assignedTo = p.assigned_to ? Utils.escapeHtml(p.assigned_to) : '—';
        
        return `
            <tr class="${highlightClass} ${archivedClass}" data-product-id="${p.id}">
                <td><strong>${Utils.escapeHtml(String(p.id))}</strong>${isArchived ? '<span class="archived-badge">Archived</span>' : ''}</td>
                <td>${Utils.escapeHtml(p.sku || '')}</td>
                <td>${Utils.escapeHtml(p.name || '')}${isArchived ? ' [DELETED]' : ''}</td>
                <td>${Utils.escapeHtml(p.categories?.name || 'N/A')}</td>
                <td>${Utils.escapeHtml(p.buildings?.name || 'N/A')}</td>
                <td>${assignedTo}</td>
                <td>${Utils.getConditionBadge(p.condition)}</td>
                <td>${stock}</td>
                <td>${status}</td>
                <td>
                    <button class="action-btn btn-edit" onclick="window.editProduct(${p.id})" ${isArchived ? 'disabled style="opacity:0.5"' : ''}>
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn btn-delete" onclick="window.deleteProduct(${p.id})">
                        <i class="fas ${isArchived ? 'fa-trash-restore' : 'fa-trash'}"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
},

async searchProducts(term) {
    try {
        UIManager.showLoading();
        const supabase = window.getSupabaseClient();
        if (!supabase) throw new Error('Database unavailable');
        
        if (!term?.trim()) {
            await this.loadProducts();
            return;
        }
        
        const search = term.trim().toLowerCase();
        const isNumericSearch = /^\d+$/.test(search);
        
        let query = supabase
            .from(TABLES.PRODUCTS)
            .select(`
                *,
                categories:category_id(name),
                buildings:building_id(name)
            `);
        
        if (!AppState.showArchived) {
            query = query.eq('is_active', true);
        }
        
        if (isNumericSearch) {
            const idNumber = parseInt(search, 10);
            const idValidation = Utils.validateIdRange(idNumber);
            if (idValidation.valid) {
                query = query.eq('id', idNumber);
                const { data, error } = await query;
                if (error) throw error;
                this.renderProductsTable(data || [], idNumber);
                if (data?.length === 0) {
                    Utils.showNotification(`No product found with ID ${idNumber}`, 'info');
                } else {
                    Utils.showNotification(`Found product with ID ${idNumber}`, 'success');
                }
            } else {
                Utils.showNotification(idValidation.error, 'error');
                this.renderProductsTable([]);
            }
        } else {
            query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,description.ilike.%${search}%`);
            const { data, error } = await query.order('id', { ascending: true });
            if (error) throw error;
            this.renderProductsTable(data || []);
            if (data?.length === 0) {
                Utils.showNotification('No products found matching your search', 'info');
            }
        }
    } catch (error) {
        console.error('Search failed:', error);
        UIManager.showError('products-error', 'Search failed');
        Utils.showNotification('Search failed: ' + error.message, 'error');
    } finally {
        UIManager.hideLoading();
    }
},

async saveProduct(data, id = null) {
    try {
        UIManager.showLoading();
        const supabase = window.getSupabaseClient();
        if (!supabase) throw new Error('Database unavailable');
        
        // Set default condition if not provided
        if (!data.condition) {
            data.condition = PRODUCT_CONDITIONS.DEFAULT;
        }
        
        if (id) {
            const idValidation = Utils.validateIdRange(id);
            if (!idValidation.valid) {
                throw new Error(idValidation.error);
            }
            
            const { data: oldProduct } = await supabase
                .from(TABLES.PRODUCTS)
                .select('stock_quantity, is_active')
                .eq('id', id)
                .single();
            
            if (oldProduct && oldProduct.is_active === false) {
                throw new Error('Cannot edit archived product. Please restore it first.');
            }
            
            const { error } = await supabase
                .from(TABLES.PRODUCTS)
                .update({
                    ...data,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);
                
            if (error) throw error;
            
            if (oldProduct && oldProduct.stock_quantity !== data.stock_quantity) {
                const diff = data.stock_quantity - oldProduct.stock_quantity;
                if (diff !== 0) {
                    await supabase.from(TABLES.MOVEMENTS).insert([{
                        product_id: id,
                        quantity: Math.abs(diff),
                        movement_type: diff > 0 ? 'IN' : 'OUT',
                        reference: 'STOCK_ADJUSTMENT',
                        notes: `Adjusted via edit: ${oldProduct.stock_quantity} → ${data.stock_quantity}`,
                        user_id: AppState.currentUser?.id,
                        created_at: new Date().toISOString()
                    }]);
                }
            }
        } else {
            const nextId = await Utils.getNextAvailableId(TABLES.PRODUCTS);
            
            if (!nextId) {
                throw new Error(`No available IDs in range ${AppConfig.MIN_ID}-${AppConfig.MAX_ID}. Maximum capacity reached.`);
            }
            
            const { error } = await supabase
                .from(TABLES.PRODUCTS)
                .insert([{
                    id: nextId,
                    ...data,
                    is_active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }]);
                
            if (error) throw error;
            
            if (data.stock_quantity > 0) {
                await supabase.from(TABLES.MOVEMENTS).insert([{
                    product_id: nextId,
                    quantity: data.stock_quantity,
                    movement_type: 'IN',
                    reference: 'INITIAL_STOCK',
                    notes: 'Created with initial stock',
                    user_id: AppState.currentUser?.id,
                    created_at: new Date().toISOString()
                }]);
            }
        }
        
        await this.loadProducts();
        Utils.showNotification(`Product ${id ? 'updated' : 'created'} successfully`, 'success');
        return true;
    } catch (error) {
        console.error('Product save failed:', error);
        throw error;
    } finally {
        UIManager.hideLoading();
    }
},

async deleteProduct(id) {
    try {
        const idValidation = Utils.validateIdRange(id);
        if (!idValidation.valid) {
            throw new Error(idValidation.error);
        }
        
        UIManager.showLoading();
        const supabase = window.getSupabaseClient();
        if (!supabase) throw new Error('Database unavailable');
        
        const { data: product, error: productErr } = await supabase
            .from(TABLES.PRODUCTS)
            .select('is_active, name')
            .eq('id', id)
            .single();
            
        if (productErr) throw productErr;
        
        if (product.is_active === false) {
            if (confirm(`Permanently delete "${product.name}"? This will remove all movement history. This action cannot be undone.`)) {
                const { data: movements, error: moveCheck } = await supabase
                    .from(TABLES.MOVEMENTS)
                    .select('id')
                    .eq('product_id', id);
                    
                if (moveCheck) throw moveCheck;
                
                if (movements?.length > 0) {
                    const { error: deleteMovements } = await supabase
                        .from(TABLES.MOVEMENTS)
                        .delete()
                        .eq('product_id', id);
                    if (deleteMovements) throw deleteMovements;
                }
                
                const { error } = await supabase
                    .from(TABLES.PRODUCTS)
                    .delete()
                    .eq('id', id);
                    
                if (error) throw error;
                Utils.showNotification('Product permanently deleted', 'success');
                await this.loadProducts();
            }
            return true;
        }
        
        const { data: movements, error: moveCheck } = await supabase
            .from(TABLES.MOVEMENTS)
            .select('id', { count: 'exact' })
            .eq('product_id', id);
            
        if (moveCheck) throw moveCheck;
        
        if (movements?.length > 0) {
            const confirmArchive = confirm(
                `Product "${product.name}" has ${movements.length} movement record(s).\n\n` +
                `It cannot be deleted due to existing history.\n\n` +
                `Would you like to ARCHIVE it instead?\n` +
                `(Archived products are hidden from main view but can be restored later)`
            );
            
            if (confirmArchive) {
                const { error } = await supabase
                    .from(TABLES.PRODUCTS)
                    .update({ 
                        is_active: false,
                        deleted_at: new Date().toISOString()
                    })
                    .eq('id', id);
                    
                if (error) throw error;
                Utils.showNotification('Product archived successfully', 'warning');
                await this.loadProducts();
            }
        } else {
            if (confirm(`Delete product "${product.name}"? This action cannot be undone.`)) {
                const { error } = await supabase
                    .from(TABLES.PRODUCTS)
                    .delete()
                    .eq('id', id);
                    
                if (error) throw error;
                Utils.showNotification('Product deleted successfully', 'success');
                await this.loadProducts();
            }
        }
        return true;
    } catch (error) {
        console.error('Product delete failed:', error);
        Utils.showNotification(error.message, 'error');
        return false;
    } finally {
        UIManager.hideLoading();
    }
},

async restoreProduct(id) {
    try {
        const supabase = window.getSupabaseClient();
        if (!supabase) throw new Error('Database unavailable');
        
        const { error } = await supabase
            .from(TABLES.PRODUCTS)
            .update({ 
                is_active: true,
                deleted_at: null
            })
            .eq('id', id);
            
        if (error) throw error;
        Utils.showNotification('Product restored successfully', 'success');
        await this.loadProducts();
        return true;
    } catch (error) {
        console.error('Product restore failed:', error);
        Utils.showNotification(error.message, 'error');
        return false;
    }
},

async toggleShowArchived() {
    AppState.showArchived = !AppState.showArchived;
    const btn = document.getElementById('toggle-archived');
    if (btn) {
        btn.textContent = AppState.showArchived ? 'Hide Archived' : 'Show Archived';
    }
    await this.loadProducts();
},

async loadCategories() {
    try {
        UIManager.showLoading();
        const supabase = window.getSupabaseClient();
        if (!supabase) throw new Error('Database unavailable');
        
        const { data, error } = await supabase
            .from(TABLES.CATEGORIES)
            .select('*')
            .order('id', { ascending: true });
            
        if (error) throw error;
        AppState.categories = data || [];
        this.renderCategoriesTable(AppState.categories);
    } catch (error) {
        console.error('Categories load failed:', error);
        UIManager.showError('categories-error', 'Failed to load categories');
    } finally {
        UIManager.hideLoading();
    }
},

renderCategoriesTable(categories) {
    const tbody = document.getElementById('categories-list');
    if (!tbody) return;
    
    if (!categories?.length) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">No categories</td></tr>';
        return;
    }
    
    tbody.innerHTML = categories.map(c => `
        <tr>
            <td><strong>${Utils.escapeHtml(String(c.id))}</strong></td>
            <td>${Utils.escapeHtml(c.name)}</td>
            <td>${Utils.escapeHtml(c.description || '')}</td>
            <td>${Utils.formatDate(c.created_at)}</td>
            <td>
                <button class="action-btn btn-edit" onclick="window.editCategory(${c.id})"><i class="fas fa-edit"></i></button>
                <button class="action-btn btn-delete" onclick="window.deleteCategory(${c.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
},

async saveCategory(data, id = null) {
    try {
        UIManager.showLoading();
        const supabase = window.getSupabaseClient();
        if (!supabase) throw new Error('Database unavailable');
        
        if (!id) {
            const nextId = await Utils.getNextAvailableId(TABLES.CATEGORIES);
            if (!nextId) {
                throw new Error(`No available IDs. Maximum capacity reached.`);
            }
            
            const { error } = await supabase
                .from(TABLES.CATEGORIES)
                .insert([{
                    id: nextId,
                    ...data,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }]);
                
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from(TABLES.CATEGORIES)
                .update({
                    ...data,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);
                
            if (error) throw error;
        }
        
        await this.loadCategories();
        Utils.showNotification(`Category ${id ? 'updated' : 'created'} successfully`, 'success');
        return true;
    } catch (error) {
        console.error('Category save failed:', error);
        throw error;
    } finally {
        UIManager.hideLoading();
    }
},

async deleteCategory(id) {
    try {
        if (!confirm('Delete this category? Products in this category will be affected.')) {
            return false;
        }
        
        UIManager.showLoading();
        const supabase = window.getSupabaseClient();
        if (!supabase) throw new Error('Database unavailable');
        
        const { data: used, error: checkErr } = await supabase
            .from(TABLES.PRODUCTS)
            .select('id')
            .eq('category_id', id)
            .limit(1);
            
        if (checkErr) throw checkErr;
        
        if (used?.length > 0) {
            throw new Error('Category is being used by products and cannot be deleted');
        }
        
        const { error } = await supabase.from(TABLES.CATEGORIES).delete().eq('id', id);
        if (error) throw error;
        await this.loadCategories();
        Utils.showNotification('Category deleted successfully', 'success');
        return true;
    } catch (error) {
        console.error('Category delete failed:', error);
        Utils.showNotification(error.message, 'error');
        return false;
    } finally {
        UIManager.hideLoading();
    }
},

async loadBuildings() {
    try {
        UIManager.showLoading();
        const supabase = window.getSupabaseClient();
        if (!supabase) throw new Error('Database unavailable');
        
        const { data, error } = await supabase
            .from(TABLES.BUILDINGS)
            .select('*')
            .order('id', { ascending: true });
            
        if (error) throw error;
        AppState.buildings = data || [];
        this.renderBuildingsTable(AppState.buildings);
    } catch (error) {
        console.error('Buildings load failed:', error);
        UIManager.showError('buildings-error', 'Failed to load buildings');
    } finally {
        UIManager.hideLoading();
    }
},

renderBuildingsTable(buildings) {
    const tbody = document.getElementById('buildings-list');
    if (!tbody) return;
    
    if (!buildings?.length) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">No buildings</td></tr>';
        return;
    }
    
    tbody.innerHTML = buildings.map(b => `
        <tr>
            <td><strong>${Utils.escapeHtml(String(b.id))}</strong></td>
            <td>${Utils.escapeHtml(b.name)}</td>
            <td>${Utils.escapeHtml(b.location_address || '')}</td>
            <td>${Utils.formatDate(b.created_at)}</td>
            <td>
                <button class="action-btn btn-edit" onclick="window.editBuilding(${b.id})"><i class="fas fa-edit"></i></button>
                <button class="action-btn btn-delete" onclick="window.deleteBuilding(${b.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
},

async saveBuilding(data, id = null) {
    try {
        UIManager.showLoading();
        const supabase = window.getSupabaseClient();
        if (!supabase) throw new Error('Database unavailable');
        
        if (!id) {
            const nextId = await Utils.getNextAvailableId(TABLES.BUILDINGS);
            if (!nextId) {
                throw new Error(`No available IDs. Maximum capacity reached.`);
            }
            
            const { error } = await supabase
                .from(TABLES.BUILDINGS)
                .insert([{
                    id: nextId,
                    ...data,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }]);
                
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from(TABLES.BUILDINGS)
                .update({
                    ...data,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);
                
            if (error) throw error;
        }
        
        await this.loadBuildings();
        Utils.showNotification(`Building ${id ? 'updated' : 'created'} successfully`, 'success');
        return true;
    } catch (error) {
        console.error('Building save failed:', error);
        throw error;
    } finally {
        UIManager.hideLoading();
    }
},

async deleteBuilding(id) {
    try {
        if (!confirm('Delete this building? Products in this building will be affected.')) {
            return false;
        }
        
        UIManager.showLoading();
        const supabase = window.getSupabaseClient();
        if (!supabase) throw new Error('Database unavailable');
        
        const { data: used, error: checkErr } = await supabase
            .from(TABLES.PRODUCTS)
            .select('id')
            .eq('building_id', id)
            .limit(1);
            
        if (checkErr) throw checkErr;
        
        if (used?.length > 0) {
            throw new Error('Building is being used by products and cannot be deleted');
        }
        
        const { error } = await supabase.from(TABLES.BUILDINGS).delete().eq('id', id);
        if (error) throw error;
        await this.loadBuildings();
        Utils.showNotification('Building deleted successfully', 'success');
        return true;
    } catch (error) {
        console.error('Building delete failed:', error);
        Utils.showNotification(error.message, 'error');
        return false;
    } finally {
        UIManager.hideLoading();
    }
},

async loadStockView() {
    try {
        UIManager.showLoading();
        const supabase = window.getSupabaseClient();
        if (!supabase) throw new Error('Database unavailable');
        
        const { data, error } = await supabase
            .from(TABLES.PRODUCTS)
            .select('id, name, stock_quantity')
            .eq('is_active', true)
            .order('id', { ascending: true });
            
        if (error) throw error;
        AppState.products = data || [];
        this.populateProductSelect(AppState.products);
        await this.loadAllMovements();
    } catch (error) {
        console.error('Stock view load failed:', error);
        UIManager.showError('stock-error', 'Failed to load stock view');
    } finally {
        UIManager.hideLoading();
    }
},

populateProductSelect(products) {
    const select = document.getElementById('stock-product');
    if (!select) return;
    
    select.innerHTML = '<option value="">Select product...</option>' +
        products.map(p => {
            const status = (p.stock_quantity || 0) === 0 ? ' ⚠️ Out of Stock' : '';
            return `<option value="${p.id}">ID ${p.id}: ${Utils.escapeHtml(p.name)} (Stock: ${p.stock_quantity || 0})${status}</option>`;
        }).join('');
},

async loadAllMovements() {
    try {
        const supabase = window.getSupabaseClient();
        if (!supabase) return;
        
        const { data, error } = await supabase
            .from(TABLES.MOVEMENTS)
            .select('*, products:product_id(name)')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        AppState.movements = data || [];
        this.renderMovementsTable(AppState.movements);
    } catch (error) {
        console.error('Movements load failed:', error);
    }
},

renderMovementsTable(movements) {
    const tbody = document.getElementById('movements-list');
    if (!tbody) return;
    
    if (!movements?.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">No movements</td></tr>';
        return;
    }
    
    tbody.innerHTML = movements.map(m => `
        <tr>
            <td>${Utils.formatDateTime(m.created_at)}</td>
            <td>${Utils.escapeHtml(m.products?.name || 'Unknown')}</td>
            <td><span class="movement-type ${m.movement_type === 'IN' ? 'in' : 'out'}">${m.movement_type}</span></td>
            <td>${m.quantity}</td>
            <td>${Utils.escapeHtml(m.reference || '')}</td>
            <td>${Utils.escapeHtml(m.notes || '')}</td>
        </tr>
    `).join('');
},

async loadCategoriesSelect() {
    try {
        const supabase = window.getSupabaseClient();
        if (!supabase) return;
        
        const { data, error } = await supabase
            .from(TABLES.CATEGORIES)
            .select('id, name')
            .order('name');
            
        if (error) throw error;
        
        const select = document.getElementById('product-category');
        if (!select) return;
        
        select.innerHTML = '<option value="">Select Category...</option>' +
            (data || []).map(c => `<option value="${c.id}">${Utils.escapeHtml(c.name)}</option>`).join('');
    } catch (error) {
        console.error('Categories select load failed:', error);
    }
},

async loadBuildingsSelect() {
    try {
        const supabase = window.getSupabaseClient();
        if (!supabase) return;
        
        const { data, error } = await supabase
            .from(TABLES.BUILDINGS)
            .select('id, name')
            .order('name');
            
        if (error) throw error;
        
        const select = document.getElementById('product-building');
        if (!select) return;
        
        select.innerHTML = '<option value="">Select Building...</option>' +
            (data || []).map(b => `<option value="${b.id}">${Utils.escapeHtml(b.name)}</option>`).join('');
    } catch (error) {
        console.error('Buildings select load failed:', error);
    }
},

async adjustStock(productId, quantity, type, reference = null, notes = null) {
    try {
        UIManager.showLoading();
        const supabase = window.getSupabaseClient();
        if (!supabase) throw new Error('Database unavailable');
        
        const product = AppState.products.find(p => p.id === productId);
        if (!product) throw new Error('Product not found');
        
        if (type === 'OUT' && (product.stock_quantity || 0) < quantity) {
            throw new Error(`Insufficient stock. Available: ${product.stock_quantity || 0}`);
        }
        
        const newQty = type === 'IN' 
            ? (product.stock_quantity || 0) + quantity 
            : (product.stock_quantity || 0) - quantity;
        
        const { error: updateErr } = await supabase
            .from(TABLES.PRODUCTS)
            .update({ 
                stock_quantity: newQty,
                updated_at: new Date().toISOString()
            })
            .eq('id', productId);
            
        if (updateErr) throw updateErr;
        
        const { error: moveErr } = await supabase
            .from(TABLES.MOVEMENTS)
            .insert([{
                product_id: productId,
                quantity,
                movement_type: type,
                reference: reference || null,
                notes: notes || null,
                user_id: AppState.currentUser?.id,
                created_at: new Date().toISOString()
            }]);
            
        if (moveErr) throw moveErr;
        
        product.stock_quantity = newQty;
        await Promise.all([this.loadAllMovements(), this.loadDashboard()]);
        Utils.showNotification(`Stock adjusted: ${type} ${quantity} units`, 'success');
        return true;
    } catch (error) {
        console.error('Stock adjust failed:', error);
        throw error;
    } finally {
        UIManager.hideLoading();
    }
},

async generateReport(type) {
    try {
        UIManager.showLoading();
        const supabase = window.getSupabaseClient();
        if (!supabase) throw new Error('Database unavailable');
        
        const content = document.getElementById('report-content');
        if (!content) return;
        
        switch (type) {
            case 'stock-summary':
                await this.showStockSummary(content);
                break;
            case 'category-analysis':
                await this.showCategoryAnalysis(content);
                break;
            case 'building-analysis':
                await this.showBuildingAnalysis(content);
                break;
            case 'movement-history':
                await this.showMovementHistory(content);
                break;
            default:
                throw new Error('Unknown report type');
        }
    } catch (error) {
        console.error('Report generation failed:', error);
        const content = document.getElementById('report-content');
        if (content) {
            content.innerHTML = `<p style="color:var(--danger);text-align:center;padding:20px">Report generation failed: ${error.message}</p>`;
        }
        throw error;
    } finally {
        UIManager.hideLoading();
    }
},

async showStockSummary(container) {
    const supabase = window.getSupabaseClient();
    const stats = await this.getDashboardStats();
    const { data: products } = await supabase
        .from(TABLES.PRODUCTS)
        .select(`
            *,
            categories:category_id(name),
            buildings:building_id(name)
        `)
        .eq('is_active', true)
        .order('id', { ascending: true });
    
    let html = `
        <div class="stats-grid" style="margin-bottom:20px;">
            <div class="stat-card">
                <div class="stat-value">${stats.total_products}</div>
                <div class="stat-title">Total Products</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.total_items}</div>
                <div class="stat-title">Total Items</div>
            </div>
        </div>
        <div class="table-container">
            <table class="report-table">
                <thead>
                    <tr>
                        <th>ID</th><th>Code</th><th>Product</th><th>Category</th>
                        <th>Building</th><th>Condition</th><th>Stock</th><th>Status</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    (products || []).forEach(p => {
        const stock = p.stock_quantity || 0;
        const status = stock > 0 ? 'OK' : 'OUT OF STOCK';
        html += `
            <tr>
                <td>${p.id}</td>
                <td>${Utils.escapeHtml(p.sku || '-')}</td>
                <td><strong>${Utils.escapeHtml(p.name)}</strong></td>
                <td>${Utils.escapeHtml(p.categories?.name || 'N/A')}</td>
                <td>${Utils.escapeHtml(p.buildings?.name || 'N/A')}</td>
                <td>${Utils.getConditionBadge(p.condition)}</td>
                <td style="color: ${status === 'OUT OF STOCK' ? '#ef476f' : '#06d6a0'}">${stock}</td>
                <td><span class="status-badge status-${status === 'OUT OF STOCK' ? 'low' : 'ok'}">${status}</span></td>
            </tr>
        `;
    });
    
    html += '</tbody></table></div>';
    container.innerHTML = html;
},

async showCategoryAnalysis(container) {
    const supabase = window.getSupabaseClient();
    const { data: categories } = await supabase
        .from(TABLES.CATEGORIES)
        .select('*, products:products(id, stock_quantity)');
    
    let html = '<div class="table-container"><table class="report-table"><thead><tr><th>ID</th><th>Category</th><th>Products</th><th>Total Units</th></tr></thead><tbody>';
    
    (categories || []).forEach(c => {
        const products = c.products || [];
        const totalUnits = products.reduce((sum, p) => sum + (p.stock_quantity || 0), 0);
        html += `<tr><td>${c.id}</td><td><strong>${Utils.escapeHtml(c.name)}</strong></td><td>${products.length}</td><td>${totalUnits}</td></tr>`;
    });
    
    html += '</tbody></table></div>';
    container.innerHTML = html;
},

async showBuildingAnalysis(container) {
    const supabase = window.getSupabaseClient();
    const { data: buildings } = await supabase
        .from(TABLES.BUILDINGS)
        .select('*, products:products(id, stock_quantity)');
    
    let html = '<div class="table-container"><table class="report-table"><thead><tr><th>ID</th><th>Building</th><th>Products</th><th>Total Units</th></tr></thead><tbody>';
    
    (buildings || []).forEach(b => {
        const products = b.products || [];
        const totalUnits = products.reduce((sum, p) => sum + (p.stock_quantity || 0), 0);
        html += `<tr><td>${b.id}</td><td><strong>${Utils.escapeHtml(b.name)}</strong></td><td>${products.length}</td><td>${totalUnits}</td></tr>`;
    });
    
    html += '</tbody></table></div>';
    container.innerHTML = html;
},

async showMovementHistory(container) {
    const supabase = window.getSupabaseClient();
    const { data } = await supabase
        .from(TABLES.MOVEMENTS)
        .select('*, products:product_id(name)')
        .order('created_at', { ascending: false })
        .limit(100);
    
    if (!data?.length) {
        container.innerHTML = '<p style="text-align:center;padding:40px">No movements found</p>';
        return;
    }
    
    let html = '<div class="table-container"><table class="report-table"><thead><tr><th>Date</th><th>Product</th><th>Type</th><th>Qty</th><th>Reference</th></tr></thead><tbody>';
    
    data.forEach(m => {
        html += `<tr>
            <td>${Utils.formatDateTime(m.created_at)}</td>
            <td>${Utils.escapeHtml(m.products?.name || 'Unknown')}</td>
            <td><span class="movement-type ${m.movement_type === 'IN' ? 'in' : 'out'}">${m.movement_type}</span></td>
            <td>${m.quantity}</td>
            <td>${Utils.escapeHtml(m.reference || '-')}</td>
        </tr>`;
    });
    
    html += '</tbody></table></div>';
    container.innerHTML = html;
}
};
// ============================================================================
// APP CONTROLLER
// ============================================================================
const App = {
async init() {
try {
console.log('App initializing...');
        const supabase = window.initializeSupabase();
        if (!supabase) {
            console.error('Supabase init failed');
            UIManager.showError('app-error', 'Database connection failed. Please refresh the page.');
            return;
        }
        
        UIManager.updateDateTime();
        AppState.clockInterval = setInterval(() => UIManager.updateDateTime(), 1000);
        
        await AuthService.checkAuth();
        this.bindEvents();
        this.setupMobileMenu();
        
        console.log('App initialized successfully');
    } catch (error) {
        console.error('Init failed:', error);
        UIManager.showError('app-error', 'Application failed to start');
    }
},

setupMobileMenu() {
    const toggleBtn = document.getElementById('mobile-menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (toggleBtn && sidebar && overlay) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        });
        
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
    }
},

bindEvents() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async e => {
            e.preventDefault();
            try {
                UIManager.showLoading();
                UIManager.hideError('login-error');
                await AuthService.login(
                    document.getElementById('username')?.value,
                    document.getElementById('password')?.value
                );
                UIManager.updateUserUI();
                await DataService.loadDashboard();
                UIManager.showView('dashboard-view');
                Utils.showNotification('Login successful!', 'success');
            } catch (err) {
                console.error('Login failed:', err);
                UIManager.showError('login-error', err.message || 'Login failed');
            } finally {
                UIManager.hideLoading();
                if (loginForm) loginForm.reset();
            }
        });
    }
    
    const regForm = document.getElementById('register-form');
    if (regForm) {
        regForm.addEventListener('submit', async e => {
            e.preventDefault();
            try {
                UIManager.showLoading();
                UIManager.hideError('register-error');
                await AuthService.register(
                    document.getElementById('reg-fullname')?.value,
                    document.getElementById('reg-email')?.value,
                    document.getElementById('reg-password')?.value,
                    document.getElementById('reg-confirm-password')?.value
                );
                Utils.showNotification('Registration successful! Please login.', 'success');
                UIManager.closeModal('register-modal');
                regForm.reset();
            } catch (err) {
                console.error('Register failed:', err);
                UIManager.showError('register-error', err.message || 'Registration failed');
            } finally {
                UIManager.hideLoading();
            }
        });
    }
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => AuthService.logout());
    }
    
    const search = document.getElementById('product-search');
    if (search) {
        const debouncedSearch = Utils.debounce(async e => {
            await DataService.searchProducts(e.target.value);
        }, 300);
        search.addEventListener('input', debouncedSearch);
    }
    
    const clearSearch = document.getElementById('clear-search');
    if (clearSearch) {
        clearSearch.addEventListener('click', () => {
            if (search) search.value = '';
            DataService.loadProducts();
            Utils.showNotification('Filters cleared', 'info');
        });
    }
    
    const toggleArchived = document.getElementById('toggle-archived');
    if (toggleArchived) {
        toggleArchived.addEventListener('click', () => {
            DataService.toggleShowArchived();
        });
    }
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const view = this.dataset.view;
            if (view) App.switchView(view);
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            if (sidebar) sidebar.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
        });
    });
    
    const stockForm = document.getElementById('stock-form');
    if (stockForm) {
        stockForm.addEventListener('submit', async e => {
            e.preventDefault();
            await this.handleStockAdjustment(e);
        });
    }
    
    const stockProduct = document.getElementById('stock-product');
    if (stockProduct) {
        stockProduct.addEventListener('change', () => this.handleProductSelect());
    }
    
    document.querySelectorAll('.btn-type').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.btn-type').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            App.handleStockTypeChange();
        });
    });
    
    const pwdForm = document.getElementById('password-form');
    if (pwdForm) {
        pwdForm.addEventListener('submit', async e => {
            e.preventDefault();
            await this.handlePasswordChange(e);
        });
    }
    
    const prodForm = document.getElementById('product-form');
    if (prodForm) {
        prodForm.addEventListener('submit', async e => {
            e.preventDefault();
            await this.handleProductSave(e);
        });
    }
    
    const catForm = document.getElementById('category-form');
    if (catForm) {
        catForm.addEventListener('submit', async e => {
            e.preventDefault();
            await this.handleCategorySave(e);
        });
    }
    
    const bldForm = document.getElementById('building-form');
    if (bldForm) {
        bldForm.addEventListener('submit', async e => {
            e.preventDefault();
            await this.handleBuildingSave(e);
        });
    }
    
    const filter = document.getElementById('movement-filter');
    if (filter) {
        filter.addEventListener('change', () => this.filterMovements());
    }
    
    window.onclick = e => {
        if (e.target.classList?.contains('modal')) {
            e.target.classList.remove('active');
            document.body.style.overflow = '';
        }
    };
    
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('product-search');
            if (searchInput && document.getElementById('products-view').classList.contains('active')) {
                searchInput.focus();
                searchInput.select();
            }
        }
    });
},

handleStockTypeChange() {
    const productId = AppState.selectedProductId;
    if (productId) {
        const product = AppState.products.find(p => p.id === productId);
        const warning = document.getElementById('stock-warning');
        const active = document.querySelector('.btn-type.active');
        if (active?.dataset.type === 'OUT' && warning && product) {
            warning.textContent = `⚠️ Available: ${product.stock_quantity || 0} units`;
            warning.style.display = 'block';
        } else if (warning) {
            warning.textContent = '';
            warning.style.display = 'none';
        }
    }
},

handleProductSelect() {
    const id = document.getElementById('stock-product')?.value;
    if (!id) {
        const info = document.getElementById('stock-info');
        if (info) info.style.display = 'none';
        AppState.selectedProductId = null;
        return;
    }
    
    AppState.selectedProductId = parseInt(id);
    const product = AppState.products.find(p => p.id === AppState.selectedProductId);
    
    if (product) {
        const info = document.getElementById('stock-info');
        const current = document.getElementById('current-stock');
        const warning = document.getElementById('stock-warning');
        
        if (info) info.style.display = 'block';
        if (current) current.textContent = `Current Stock: ${product.stock_quantity || 0}`;
        
        const active = document.querySelector('.btn-type.active');
        if (active?.dataset.type === 'OUT' && warning) {
            warning.textContent = `⚠️ Available: ${product.stock_quantity || 0} units`;
            warning.style.display = 'block';
        } else if (warning) {
            warning.textContent = '';
            warning.style.display = 'none';
        }
    }
},

async handleStockAdjustment(e) {
    e.preventDefault();
    if (!AppState.selectedProductId) {
        Utils.showNotification('Please select a product', 'error');
        return;
    }
    
    const qty = Utils.parseInteger(document.getElementById('stock-quantity')?.value);
    if (!qty || qty <= 0) {
        Utils.showNotification('Please enter a valid quantity (greater than 0)', 'error');
        return;
    }
    
    const type = document.querySelector('.btn-type.active')?.dataset.type;
    if (!type) {
        Utils.showNotification('Please select IN or OUT', 'error');
        return;
    }
    
    const ref = document.getElementById('stock-reference')?.value?.trim();
    const notes = document.getElementById('stock-notes')?.value?.trim();
    
    try {
        await DataService.adjustStock(AppState.selectedProductId, qty, type, ref, notes);
        this.clearStockForm();
    } catch (err) {
        console.error('Adjust failed:', err);
        Utils.showNotification(err.message || 'Adjustment failed', 'error');
    }
},

clearStockForm() {
    const form = document.getElementById('stock-form');
    if (form) form.reset();
    const info = document.getElementById('stock-info');
    if (info) info.style.display = 'none';
    const warning = document.getElementById('stock-warning');
    if (warning) warning.textContent = '';
    AppState.selectedProductId = null;
    const select = document.getElementById('stock-product');
    if (select) select.value = '';
    
    const inBtn = document.querySelector('.btn-type[data-type="IN"]');
    const outBtn = document.querySelector('.btn-type[data-type="OUT"]');
    if (inBtn) inBtn.classList.add('active');
    if (outBtn) outBtn.classList.remove('active');
},

filterMovements() {
    const filter = document.getElementById('movement-filter')?.value;
    if (filter === 'current' && AppState.selectedProductId) {
        const filtered = AppState.movements.filter(m => m.product_id === AppState.selectedProductId);
        DataService.renderMovementsTable(filtered);
    } else {
        DataService.renderMovementsTable(AppState.movements);
    }
},

switchView(viewName) {
    UIManager.updateNavigation(viewName);
    
    const sections = {
        dashboard: 'dashboard-home',
        products: 'products-view',
        categories: 'categories-view',
        buildings: 'buildings-view',
        stock: 'stock-view',
        reports: 'reports-view',
        profile: 'profile-view'
    };
    
    const section = sections[viewName];
    if (section) UIManager.showSection(section);
    
    switch (viewName) {
        case 'dashboard':
            DataService.loadDashboard();
            break;
        case 'products':
            DataService.loadProducts();
            break;
        case 'categories':
            DataService.loadCategories();
            break;
        case 'buildings':
            DataService.loadBuildings();
            break;
        case 'stock':
            DataService.loadStockView();
            break;
        case 'profile':
            this.loadProfile();
            break;
    }
},

loadProfile() {
    if (AppState.currentUser) {
        const name = document.getElementById('profile-fullname');
        const email = document.getElementById('profile-username');
        const role = document.getElementById('profile-role');
        if (name) name.textContent = AppState.currentUser.full_name;
        if (email) email.textContent = AppState.currentUser.email;
        if (role) role.textContent = AppState.currentUser.role;
    }
},

async handlePasswordChange(e) {
    e.preventDefault();
    try {
        UIManager.showLoading();
        await AuthService.changePassword(
            document.getElementById('current-password')?.value,
            document.getElementById('new-password')?.value,
            document.getElementById('confirm-password')?.value
        );
        Utils.showNotification('Password changed successfully', 'success');
        const form = document.getElementById('password-form');
        if (form) form.reset();
    } catch (err) {
        console.error('Password change failed:', err);
        Utils.showNotification(err.message || 'Password change failed', 'error');
    } finally {
        UIManager.hideLoading();
    }
},

async showProductModal(id = null) {
    const modal = document.getElementById('product-modal');
    if (!modal) return;
    
    await Promise.all([DataService.loadCategoriesSelect(), DataService.loadBuildingsSelect()]);
    
    const title = document.getElementById('modal-title');
    
    if (id) {
        if (title) title.textContent = 'Edit Product';
        try {
            const supabase = window.getSupabaseClient();
            const { data, error } = await supabase
                .from(TABLES.PRODUCTS)
                .select('*')
                .eq('id', id)
                .single();
                
            if (error) throw error;
            
            if (data) {
                if (data.is_active === false) {
                    Utils.showNotification('This product is archived. Please restore it first to edit.', 'warning');
                    return;
                }
                document.getElementById('product-id').value = data.id;
                document.getElementById('product-sku').value = data.sku || '';
                document.getElementById('product-name').value = data.name || '';
                document.getElementById('product-description').value = data.description || '';
                document.getElementById('product-category').value = data.category_id || '';
                document.getElementById('product-building').value = data.building_id || '';
                document.getElementById('product-stock').value = data.stock_quantity || 0;
                document.getElementById('product-condition').value = data.condition || PRODUCT_CONDITIONS.DEFAULT;
                document.getElementById('product-assigned').value = data.assigned_to || '';
            }
        } catch (err) {
            console.error('Load product failed:', err);
            Utils.showNotification('Failed to load product', 'error');
            return;
        }
    } else {
        if (title) title.textContent = 'Add Product';
        const form = document.getElementById('product-form');
        if (form) form.reset();
        document.getElementById('product-id').value = '';
        document.getElementById('product-stock').value = '0';
        document.getElementById('product-condition').value = PRODUCT_CONDITIONS.DEFAULT;
        document.getElementById('product-assigned').value = '';
        
        const nextId = await Utils.getNextAvailableId(TABLES.PRODUCTS);
        
        const existingInfo = modal.querySelector('.id-info');
        if (existingInfo) existingInfo.remove();
        
        const infoMsg = document.createElement('div');
        infoMsg.className = 'id-info';
        infoMsg.style.cssText = 'background:#2f3850;padding:12px;border-radius:6px;margin-bottom:15px;border-left:4px solid #2196f3;';
        
        if (nextId) {
            infoMsg.innerHTML = `<i class="fas fa-info-circle"></i> <strong>Auto-assigned ID:</strong> ${nextId}`;
        } else {
            infoMsg.innerHTML = `<i class="fas fa-exclamation-triangle"></i> <strong>Warning:</strong> No available IDs. Maximum capacity reached.`;
            const saveBtn = modal.querySelector('button[type="submit"]');
            if (saveBtn) saveBtn.disabled = true;
        }
        
        const formElement = modal.querySelector('form');
        if (formElement && !modal.querySelector('.id-info')) {
            formElement.insertBefore(infoMsg, formElement.firstChild);
        }
    }
    
    UIManager.openModal('product-modal');
},

async handleProductSave(e) {
    e.preventDefault();
    const id = document.getElementById('product-id')?.value;
    const data = {
        sku: document.getElementById('product-sku')?.value?.trim().toUpperCase(),
        name: document.getElementById('product-name')?.value?.trim(),
        description: document.getElementById('product-description')?.value?.trim(),
        category_id: Utils.parseInteger(document.getElementById('product-category')?.value) || null,
        building_id: Utils.parseInteger(document.getElementById('product-building')?.value) || null,
        stock_quantity: Utils.parseInteger(document.getElementById('product-stock')?.value),
        condition: document.getElementById('product-condition')?.value || PRODUCT_CONDITIONS.DEFAULT,
        assigned_to: document.getElementById('product-assigned')?.value?.trim() || null
        
    };
    
    if (!data.name) {
        Utils.showNotification('Product name is required', 'error');
        return;
    }
    
    if (!data.sku) {
        Utils.showNotification('SKU is required', 'error');
        return;
    }
    
    try {
        await DataService.saveProduct(data, id ? parseInt(id) : null);
        UIManager.closeModal('product-modal');
    } catch (err) {
        console.error('Save failed:', err);
        Utils.showNotification(err.message || 'Save failed', 'error');
    }
},

async showCategoryModal(id = null) {
    const modal = document.getElementById('category-modal');
    if (!modal) return;
    
    const form = document.getElementById('category-form');
    const existingInfo = modal.querySelector('.id-info');
    if (existingInfo) existingInfo.remove();
    
    if (id) {
        const cat = AppState.categories.find(c => c.id === id);
        if (cat) {
            document.getElementById('category-id').value = cat.id;
            document.getElementById('category-name').value = cat.name;
            document.getElementById('category-description').value = cat.description || '';
            const title = modal.querySelector('.modal-header h2');
            if (title) title.textContent = 'Edit Category';
        } else {
            const supabase = window.getSupabaseClient();
            const { data, error } = await supabase
                .from(TABLES.CATEGORIES)
                .select('*')
                .eq('id', id)
                .single();
            if (!error && data) {
                document.getElementById('category-id').value = data.id;
                document.getElementById('category-name').value = data.name;
                document.getElementById('category-description').value = data.description || '';
                const title = modal.querySelector('.modal-header h2');
                if (title) title.textContent = 'Edit Category';
            }
        }
    } else {
        if (form) form.reset();
        document.getElementById('category-id').value = '';
        const title = modal.querySelector('.modal-header h2');
        if (title) title.textContent = 'Add Category';
        
        const nextId = await Utils.getNextAvailableId(TABLES.CATEGORIES);
        
        const infoMsg = document.createElement('div');
        infoMsg.className = 'id-info';
        infoMsg.style.cssText = 'background:#2f3850;padding:12px;border-radius:6px;margin-bottom:15px;border-left:4px solid #2196f3;';
        infoMsg.innerHTML = `<i class="fas fa-info-circle"></i> <strong>Auto-assigned ID:</strong> ${nextId || 'None available'}`;
        
        const formElement = modal.querySelector('form');
        if (formElement && !modal.querySelector('.id-info')) {
            formElement.insertBefore(infoMsg, formElement.firstChild);
        }
    }
    
    UIManager.openModal('category-modal');
},

async handleCategorySave(e) {
    e.preventDefault();
    const id = document.getElementById('category-id')?.value;
    const name = document.getElementById('category-name')?.value?.trim();
    
    if (!name) {
        Utils.showNotification('Category name is required', 'error');
        return;
    }
    
    const data = {
        name: name,
        description: document.getElementById('category-description')?.value?.trim() || null
    };
    
    try {
        await DataService.saveCategory(data, id ? parseInt(id) : null);
        UIManager.closeModal('category-modal');
    } catch (err) {
        console.error('Save failed:', err);
        Utils.showNotification(err.message || 'Save failed', 'error');
    }
},

async showBuildingModal(id = null) {
    const modal = document.getElementById('building-modal');
    if (!modal) return;
    
    const form = document.getElementById('building-form');
    const existingInfo = modal.querySelector('.id-info');
    if (existingInfo) existingInfo.remove();
    
    if (id) {
        const bld = AppState.buildings.find(b => b.id === id);
        if (bld) {
            document.getElementById('building-id').value = bld.id;
            document.getElementById('building-name').value = bld.name;
            document.getElementById('building-address').value = bld.location_address || '';
            const title = modal.querySelector('.modal-header h2');
            if (title) title.textContent = 'Edit Building';
        } else {
            const supabase = window.getSupabaseClient();
            const { data, error } = await supabase
                .from(TABLES.BUILDINGS)
                .select('*')
                .eq('id', id)
                .single();
            if (!error && data) {
                document.getElementById('building-id').value = data.id;
                document.getElementById('building-name').value = data.name;
                document.getElementById('building-address').value = data.location_address || '';
                const title = modal.querySelector('.modal-header h2');
                if (title) title.textContent = 'Edit Building';
            }
        }
    } else {
        if (form) form.reset();
        document.getElementById('building-id').value = '';
        const title = modal.querySelector('.modal-header h2');
        if (title) title.textContent = 'Add Building';
        
        const nextId = await Utils.getNextAvailableId(TABLES.BUILDINGS);
        
        const infoMsg = document.createElement('div');
        infoMsg.className = 'id-info';
        infoMsg.style.cssText = 'background:#2f3850;padding:12px;border-radius:6px;margin-bottom:15px;border-left:4px solid #2196f3;';
        infoMsg.innerHTML = `<i class="fas fa-info-circle"></i> <strong>Auto-assigned ID:</strong> ${nextId || 'None available'}`;
        
        const formElement = modal.querySelector('form');
        if (formElement && !modal.querySelector('.id-info')) {
            formElement.insertBefore(infoMsg, formElement.firstChild);
        }
    }
    
    UIManager.openModal('building-modal');
},

async handleBuildingSave(e) {
    e.preventDefault();
    const id = document.getElementById('building-id')?.value;
    const name = document.getElementById('building-name')?.value?.trim();
    
    if (!name) {
        Utils.showNotification('Building name is required', 'error');
        return;
    }
    
    const data = {
        name: name,
        location_address: document.getElementById('building-address')?.value?.trim() || null
    };
    
    try {
        await DataService.saveBuilding(data, id ? parseInt(id) : null);
        UIManager.closeModal('building-modal');
    } catch (err) {
        console.error('Save failed:', err);
        Utils.showNotification(err.message || 'Save failed', 'error');
    }
},

async deleteProduct(id) {
    await DataService.deleteProduct(id);
},

async deleteCategory(id) {
    await DataService.deleteCategory(id);
},

async deleteBuilding(id) {
    await DataService.deleteBuilding(id);
},

async showReport(type) {
    const results = document.getElementById('report-results');
    const title = document.getElementById('report-title');
    
    if (!results || !title) return;
    
    results.style.display = 'block';
    
    const titles = {
        'stock-summary': 'Stock Summary',
        'category-analysis': 'Category Analysis',
        'building-analysis': 'Building Analysis',
        'movement-history': 'Movement History'
    };
    
    title.textContent = titles[type] || 'Report';
    
    try {
        await DataService.generateReport(type);
        results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
        console.error('Report failed:', err);
        const content = document.getElementById('report-content');
        if (content) {
            content.innerHTML = `<p style="color:var(--danger);text-align:center;padding:20px">Report generation failed: ${err.message}</p>`;
        }
    }
}
};
// ============================================================================
// GLOBAL EXPORTS
// ============================================================================
window.App = App;
window.editProduct = (id) => App.showProductModal(id);
window.deleteProduct = (id) => App.deleteProduct(id);
window.editCategory = (id) => App.showCategoryModal(id);
window.deleteCategory = (id) => App.deleteCategory(id);
window.editBuilding = (id) => App.showBuildingModal(id);
window.deleteBuilding = (id) => App.deleteBuilding(id);
window.showProductModal = (id) => App.showProductModal(id);
window.showCategoryModal = (id) => App.showCategoryModal(id);
window.showBuildingModal = (id) => App.showBuildingModal(id);
window.showRegisterModal = () => UIManager.openModal('register-modal');
window.closeModal = (id) => UIManager.closeModal(id);
window.showReport = (type) => App.showReport(type);
window.filterMovements = () => App.filterMovements();
window.clearStockForm = () => App.clearStockForm();
// Initialize app
document.addEventListener('DOMContentLoaded', () => App.init());