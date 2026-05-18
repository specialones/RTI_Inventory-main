/**
 * Inventory Pro - Complete Application Logic (MERGED VERSION with Soft Delete & Excel Import)
 * Features:
 * - bcrypt password hashing
 * - Enhanced ID search with highlighting
 * - Mobile menu support
 * - Soft delete for products with movement history
 * - ID filtering 1-1000 range
 * - Product Condition field
 * - Category filter in search bar (use "category:" prefix)
 * - Stock adjustment shows only defective products
 * - Enhanced practical dashboard statistics with building breakdown
 * - Interface toggle (Computer Equipment & Electronics / Office Supplies & Consumables)
 * - Sidebar toggle button for switching interfaces
 * - Pagination for Assets Management with navigation buttons
 * - Clickable sidebar toggle on all devices
 * - Full search across all fields with pagination support
 * - Search on Enter key press only
 * - Excel Import functionality with template download
 */
'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// DATABASE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const DatabaseConfig = {
    // Interface 1 - Computer Equipment & Electronics
    interface1: {
        supabaseUrl: 'https://gawfomcajlzvcslzfwiu.supabase.co',
        supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdhd2ZvbWNhamx6dmNzbHpmd2l1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNTA5MDksImV4cCI6MjA5MDYyNjkwOX0.Rlrtel3bEqwpGpWS5_-1gLV0ZUrlN3Fvgalgc3cJB7s',
        label: 'Computer Equipment & Electronics',
        shortLabel: 'Computer & Electronics'
    },
    // Interface 2 - Office Supplies & Consumables
    interface2: {
        supabaseUrl: 'https://unwwnhnwwxdayjhcqsew.supabase.co',
        supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVud3duaG53d3hkYXlqaGNxc2V3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NDE0MjAsImV4cCI6MjA5MDExNzQyMH0.IvQ0k7EtwYte57hkDwbKTX-lNDpwlKyS4qHJhpF9C9U',
        label: 'Office Supplies & Consumables',
        shortLabel: 'Office Supplies'
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// SUPABASE CLIENT MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

const SupabaseManager = {
    clients: {},
    
    initializeClients() {
        try {
            // Initialize Interface 1 client
            if (DatabaseConfig.interface1.supabaseUrl && DatabaseConfig.interface1.supabaseKey) {
                this.clients.interface1 = supabase.createClient(
                    DatabaseConfig.interface1.supabaseUrl,
                    DatabaseConfig.interface1.supabaseKey
                );
                console.log('Interface 1 Supabase client initialized (Computer Equipment & Electronics)');
            }
            
            // Initialize Interface 2 client
            if (DatabaseConfig.interface2.supabaseUrl && DatabaseConfig.interface2.supabaseKey) {
                this.clients.interface2 = supabase.createClient(
                    DatabaseConfig.interface2.supabaseUrl,
                    DatabaseConfig.interface2.supabaseKey
                );
                console.log('Interface 2 Supabase client initialized (Office Supplies & Consumables)');
            }
            
            return true;
        } catch (error) {
            console.error('Failed to initialize Supabase clients:', error);
            return false;
        }
    },
    
    getClient(interfaceName = null) {
        if (!interfaceName) {
            interfaceName = AppState.currentInterface;
        }
        
        const client = this.clients[interfaceName];
        if (!client) {
            console.error(`No Supabase client found for interface: ${interfaceName}`);
            return null;
        }
        return client;
    },
    
    getCurrentClient() {
        return this.getClient(AppState.currentInterface);
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL HELPERS FOR SUPABASE ACCESS
// ═══════════════════════════════════════════════════════════════════════════════

window.getSupabaseClient = () => SupabaseManager.getCurrentClient();
window.getInterfaceClient = (interfaceName) => SupabaseManager.getClient(interfaceName);

// ═══════════════════════════════════════════════════════════════════════════════
// APPLICATION STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

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
    currentInterface: 'interface1',
    currentSearchTerm: null,
    currentSearchType: null,
    
    pagination: {
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 0,
        totalPages: 0
    },
    
    interfaceStates: {
        interface1: {
            products: [],
            categories: [],
            buildings: [],
            movements: [],
            selectedProductId: null,
            showArchived: false,
            currentSearchTerm: null,
            currentSearchType: null,
            pagination: { currentPage: 1, itemsPerPage: 10, totalItems: 0, totalPages: 0 }
        },
        interface2: {
            products: [],
            categories: [],
            buildings: [],
            movements: [],
            selectedProductId: null,
            showArchived: false,
            currentSearchTerm: null,
            currentSearchType: null,
            pagination: { currentPage: 1, itemsPerPage: 10, totalItems: 0, totalPages: 0 }
        }
    },
    
    // Reset all state
    reset() {
        this.currentUser = null;
        this.products = [];
        this.categories = [];
        this.buildings = [];
        this.movements = [];
        this.selectedProductId = null;
        this.isLoading = false;
        this.showArchived = false;
        this.currentInterface = 'interface1';
        this.currentSearchTerm = null;
        this.currentSearchType = null;
        this.pagination = { currentPage: 1, itemsPerPage: 10, totalItems: 0, totalPages: 0 };
        this.interfaceStates = {
            interface1: {
                products: [], categories: [], buildings: [], movements: [],
                selectedProductId: null, showArchived: false,
                currentSearchTerm: null, currentSearchType: null,
                pagination: { currentPage: 1, itemsPerPage: 10, totalItems: 0, totalPages: 0 }
            },
            interface2: {
                products: [], categories: [], buildings: [], movements: [],
                selectedProductId: null, showArchived: false,
                currentSearchTerm: null, currentSearchType: null,
                pagination: { currentPage: 1, itemsPerPage: 10, totalItems: 0, totalPages: 0 }
            }
        };
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
            this.clockInterval = null;
        }
    },
    
    // Save current interface state
    saveCurrentState() {
        this.interfaceStates[this.currentInterface] = {
            products: [...this.products],
            categories: [...this.categories],
            buildings: [...this.buildings],
            movements: [...this.movements],
            selectedProductId: this.selectedProductId,
            showArchived: this.showArchived,
            currentSearchTerm: this.currentSearchTerm,
            currentSearchType: this.currentSearchType,
            pagination: { ...this.pagination }
        };
    },
    
    // Load interface state
    loadInterfaceState(interfaceName) {
        const state = this.interfaceStates[interfaceName];
        if (state) {
            this.products = [...state.products];
            this.categories = [...state.categories];
            this.buildings = [...state.buildings];
            this.movements = [...state.movements];
            this.selectedProductId = state.selectedProductId;
            this.showArchived = state.showArchived;
            this.currentSearchTerm = state.currentSearchTerm;
            this.currentSearchType = state.currentSearchType;
            this.pagination = { ...state.pagination };
        }
    },
    
    // Interface label helpers
    getCurrentInterfaceLabel() {
        return DatabaseConfig[this.currentInterface]?.label || 'Unknown';
    },
    
    getCurrentInterfaceShortLabel() {
        return DatabaseConfig[this.currentInterface]?.shortLabel || 'Unknown';
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

const Utils = {
    // String utilities
    escapeHtml(text) {
        if (text == null) return '';
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    },
    
    // Date formatting
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
        } catch {
            return 'Invalid Date';
        }
    },
    
    // Performance utilities
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
    
    // Validation utilities
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
    
    // ID validation
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
    
    // Database ID helpers
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
                if (!existingIds.includes(i)) return i;
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
    
    // UI notification
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
    
    // Form validation
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
    
    // Password utilities
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
    
    // Condition badge helper
    getConditionBadge(condition) {
        const lowerCondition = (condition || '').toLowerCase();
        let badgeClass = 'working-storage';
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

// ═══════════════════════════════════════════════════════════════════════════════
// UI MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

const UIManager = {
    // Loading state
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
    
    // Error handling
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
    
    // View management
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
            'products-view': 'Assets Management',
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
    
    // Navigation
    updateNavigation(activeView) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === activeView);
        });
    },
    
    // Modal management
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
    
    // Date/time display
    updateDateTime() {
        const dateEl = document.getElementById('current-date');
        const timeEl = document.getElementById('current-time');
        const now = new Date();
        
        if (dateEl) dateEl.textContent = now.toLocaleDateString('en-US', AppConfig.DATE_FORMAT);
        if (timeEl) timeEl.textContent = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    },
    
    updateDateDisplay() {
        const el = document.getElementById('current-date');
        if (el) el.textContent = new Date().toLocaleDateString('en-US', AppConfig.DATE_FORMAT);
    },
    
    // User interface
    updateUserUI() {
        const nameEl = document.getElementById('user-name');
        const roleEl = document.getElementById('user-role');
        
        if (nameEl) nameEl.textContent = AppState.currentUser?.full_name || 'User';
        if (roleEl) roleEl.textContent = AppState.currentUser?.role || 'User';
    },
    
    // Form utilities
    clearForm(formId) {
        const form = document.getElementById(formId);
        if (form) form.reset();
    },
    
    // Interface indicators
    updateInterfaceIndicator() {
        const indicator = document.getElementById('interface-indicator');
        if (indicator) indicator.textContent = AppState.getCurrentInterfaceShortLabel();
        
        if (AppState.currentInterface === 'interface1') {
            document.body.classList.remove('interface-2');
        } else {
            document.body.classList.add('interface-2');
        }
        
        this.updateDatabaseIndicator();
    },
    
    updateDatabaseIndicator() {
        const dbIndicator = document.getElementById('database-indicator');
        if (dbIndicator) {
            dbIndicator.textContent = `${AppState.getCurrentInterfaceShortLabel()}`;
            dbIndicator.className = `database-indicator ${AppState.currentInterface}`;
        }
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// AUTHENTICATION SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

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
                UIManager.updateInterfaceIndicator();
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
        if (!email || !password) throw new Error('Email and password required');
        
        const supabase = window.getSupabaseClient();
        if (!supabase) throw new Error('Database unavailable');
        
        const { data, error } = await supabase
            .from(TABLES.USERS)
            .select('*')
            .eq('email', email.toLowerCase().trim())
            .single();
        
        if (error || !data) throw new Error('Invalid credentials');
        if (!data.is_active) throw new Error('Account is disabled');
        
        const isValidPassword = await Utils.verifyPassword(password, data.password_hash);
        if (!isValidPassword) throw new Error('Invalid credentials');
        
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
        if (!fullName || !email || !password) throw new Error('All fields required');
        if (!Utils.isValidEmail(email)) throw new Error('Invalid email format');
        if (password !== confirmPassword) throw new Error('Passwords do not match');
        if (password.length < AppConfig.MIN_PASSWORD_LENGTH) {
            throw new Error(`Password must be at least ${AppConfig.MIN_PASSWORD_LENGTH} characters`);
        }
        
        const supabase = window.getSupabaseClient();
        if (!supabase) throw new Error('Database unavailable');
        
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
            if (error.code === '23505') throw new Error('Email already exists');
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
        if (!current || !newPassword || !confirm) throw new Error('All fields required');
        if (newPassword !== confirm) throw new Error('New passwords do not match');
        if (newPassword.length < AppConfig.MIN_PASSWORD_LENGTH) {
            throw new Error(`Password must be at least ${AppConfig.MIN_PASSWORD_LENGTH} characters`);
        }
        
        const supabase = window.getSupabaseClient();
        if (!supabase || !AppState.currentUser) throw new Error('Not authenticated');
        
        const { data: user, error: fetchErr } = await supabase
            .from(TABLES.USERS)
            .select('password_hash')
            .eq('id', AppState.currentUser.id)
            .single();
        
        if (fetchErr || !user) throw new Error('User not found');
        
        const isValidCurrent = await Utils.verifyPassword(current, user.password_hash);
        if (!isValidCurrent) throw new Error('Current password is incorrect');
        
        const hashedNew = await Utils.hashPassword(newPassword);
        
        const { error: updateErr } = await supabase
            .from(TABLES.USERS)
            .update({ password_hash: hashedNew })
            .eq('id', AppState.currentUser.id);
        
        if (updateErr) throw new Error('Password update failed');
        
        return true;
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// DATA SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

const DataService = {
    // ═══════════════════════════════════════════════════════════════════════
    // DASHBOARD METHODS
    // ═══════════════════════════════════════════════════════════════════════
    
    async loadDashboard() {
        try {
            UIManager.showLoading();
            const stats = await this.getDashboardStats();
            await this.renderDashboardStats(stats);
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
        
        // Get all active products
        const { data: products, error } = await supabase
            .from(TABLES.PRODUCTS)
            .select(`stock_quantity, condition, category_id, building_id, buildings:building_id(id, name, location_address)`)
            .eq('is_active', true);
        
        if (error) throw error;
        
        // Calculate basic stats
        const totalProducts = products?.length || 0;
        const totalItems = products?.reduce((sum, p) => sum + (p.stock_quantity || 0), 0) || 0;
        const defectiveProducts = products?.filter(p => (p.condition || '').toLowerCase().includes('defective')).length || 0;
        const damagedProducts = products?.filter(p => (p.condition || '').toLowerCase().includes('damaged')).length || 0;
        const assignedProducts = products?.filter(p => (p.condition || '').toLowerCase().includes('assigned')).length || 0;
        const workingProducts = totalProducts - defectiveProducts - damagedProducts;
        
        // Get today's movements
        const today = new Date().toISOString().split('T')[0];
        const { data: todayMovements } = await supabase
            .from(TABLES.MOVEMENTS)
            .select('movement_type, quantity')
            .gte('created_at', today);
        
        const todayInbound = todayMovements?.filter(m => m.movement_type === 'IN')
            .reduce((sum, m) => sum + (m.quantity || 0), 0) || 0;
        const todayOutbound = todayMovements?.filter(m => m.movement_type === 'OUT')
            .reduce((sum, m) => sum + (m.quantity || 0), 0) || 0;
        
        // Get counts
        const { count: categoriesCount } = await supabase
            .from(TABLES.CATEGORIES)
            .select('*', { count: 'exact', head: true });
        
        // Get building stats
        const { data: buildings } = await supabase
            .from(TABLES.BUILDINGS)
            .select('*, products:products(id, stock_quantity)');
        
        // Get category stats with products
        const { data: categories } = await supabase
            .from(TABLES.CATEGORIES)
            .select('*, products:products(id, stock_quantity)')
            .order('id', { ascending: true });
        
        // Group buildings: Voyager (A, B, C combined), Mabini (A, B, C combined)
        const voyagerBuildings = [];
        const mabiniBuildings = [];
        const otherBuildings = [];
        
        (buildings || []).forEach(building => {
            const buildingName = (building.name || '').toLowerCase();
            
            if (buildingName.includes('voyager') && !buildingName.includes('storage')) {
                voyagerBuildings.push(building);
            }
            else if (buildingName.includes('mabini') && !buildingName.includes('storage')) {
                mabiniBuildings.push(building);
            }
            else if (!buildingName.includes('mabini storage')) {
                otherBuildings.push(building);
            }
        });
        
        // Calculate Voyager combined stats
        const voyagerTotalUnits = voyagerBuildings.reduce((sum, building) => {
            const buildingProducts = building.products || [];
            return sum + buildingProducts.reduce((pSum, p) => pSum + (p.stock_quantity || 0), 0);
        }, 0);
        
        // Calculate Mabini combined stats
        const mabiniTotalUnits = mabiniBuildings.reduce((sum, building) => {
            const buildingProducts = building.products || [];
            return sum + buildingProducts.reduce((pSum, p) => pSum + (p.stock_quantity || 0), 0);
        }, 0);
        
        // Create building stats array
        let buildingStats = [];
        
        if (voyagerBuildings.length > 0) {
            buildingStats.push({
                id: 'voyager-combined',
                name: 'Voyager',
                total_units: voyagerTotalUnits,
                product_count: voyagerBuildings.reduce((sum, b) => sum + (b.products || []).length, 0),
            });
        }
        
        if (mabiniBuildings.length > 0) {
            buildingStats.push({
                id: 'mabini-combined',
                name: 'Mabini',
                total_units: mabiniTotalUnits,
                product_count: mabiniBuildings.reduce((sum, b) => sum + (b.products || []).length, 0),
                location: 'Davao City'
            });
        }
        
        otherBuildings.forEach(building => {
            const buildingProducts = building.products || [];
            buildingStats.push({
                id: building.id,
                name: building.name,
                total_units: buildingProducts.reduce((sum, p) => sum + (p.stock_quantity || 0), 0),
                product_count: buildingProducts.length,
                location: building.location_address || 'N/A'
            });
        });
        
        // Create category stats array
        let categoryStats = [];
        
        (categories || []).forEach(category => {
            const categoryProducts = category.products || [];
            const totalUnits = categoryProducts.reduce((sum, p) => sum + (p.stock_quantity || 0), 0);
            
            if (categoryProducts.length > 0) {
                categoryStats.push({
                    id: category.id,
                    name: category.name,
                    total_units: totalUnits,
                    product_count: categoryProducts.length
                });
            }
        });
        
        return {
            total_products: totalProducts,
            total_items: totalItems,
            working_products: workingProducts,
            defective_products: defectiveProducts,
            damaged_products: damagedProducts,
            assigned_products: assignedProducts,
            out_of_stock: products?.filter(p => (p.stock_quantity || 0) === 0).length || 0,
            today_inbound: todayInbound,
            today_outbound: todayOutbound,
            categories_count: categoriesCount || 0,
            buildings_count: buildings?.length || 0,
            building_stats: buildingStats,
            category_stats: categoryStats
        };
    },
    
    async renderDashboardStats(stats) {
        const container = document.getElementById('stats-container');
        if (!container) return;
        
        // Render 4 stat cards in a row - matching the image layout (NEW VERSION)
        container.innerHTML = `
            <div class="dashboard-stats-row">
                <div class="stat-card-dashboard working">
                    <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
                    <div class="stat-value">${stats.working_products}</div>
                    <div class="stat-title">Working Products</div>
                    <div class="stat-desc">In good condition</div>
                </div>
                <div class="stat-card-dashboard defective">
                    <div class="stat-icon"><i class="fas fa-tools"></i></div>
                    <div class="stat-value">${stats.defective_products}</div>
                    <div class="stat-title">Defective</div>
                    <div class="stat-desc">Needs repair/replacement</div>
                </div>
                <div class="stat-card-dashboard damaged">
                    <div class="stat-icon"><i class="fas fa-times-circle"></i></div>
                    <div class="stat-value">${stats.damaged_products}</div>
                    <div class="stat-title">Damaged</div>
                    <div class="stat-desc">Cannot be used</div>
                </div>
                <div class="stat-card-dashboard assigned">
                    <div class="stat-icon"><i class="fas fa-user-check"></i></div>
                    <div class="stat-value">${stats.assigned_products}</div>
                    <div class="stat-title">Assigned</div>
                    <div class="stat-desc">Assigned in units</div>
                </div>
            </div>
        `;
        
        // Render Building Analysis Section
        const buildingsHTML = stats.building_stats && stats.building_stats.length > 0
            ? stats.building_stats.map(building => `
                <div class="building-analysis-card">
                    <div class="card-name">${Utils.escapeHtml(building.name)}</div>
                    <div class="card-stats">
                        <div class="stat-value">${building.total_units.toLocaleString()}</div>
                        <div class="stat-label">TOTAL ASSETS</div>
                    </div>
                </div>
            `).join('')
            : '<div class="building-analysis-card" style="grid-column:1/-1;text-align:center;padding:40px">No buildings with assets found</div>';
        
        // Render Category Analysis Section
        const categoriesHTML = stats.category_stats && stats.category_stats.length > 0
            ? stats.category_stats.map(category => `
                <div class="category-analysis-card">
                    <div class="card-name">${Utils.escapeHtml(category.name)}</div>
                    <div class="card-stats">
                        <div class="stat-value">${category.total_units.toLocaleString()}</div>
                        <div class="stat-label">TOTAL ASSETS</div>
                    </div>
                </div>
            `).join('')
            : '';
        
        // Check if we need to append the building and category sections
        // Check if sections already exist, if not create them
        let buildingsSection = document.getElementById('buildings-section');
        let categoriesSection = document.getElementById('categories-section');
        
        if (!buildingsSection) {
            // Create buildings section
            buildingsSection = document.createElement('div');
            buildingsSection.id = 'buildings-section';
            buildingsSection.className = 'dashboard-section';
            buildingsSection.innerHTML = `
                <h3 class="section-title">
                    <i class="fas fa-building"></i> Building Analysis
                </h3>
                <div id="buildings-container" class="building-cards-grid"></div>
            `;
            container.parentNode.appendChild(buildingsSection);
        }
        
        if (!categoriesSection && stats.category_stats && stats.category_stats.length > 0) {
            // Create categories section
            categoriesSection = document.createElement('div');
            categoriesSection.id = 'categories-section';
            categoriesSection.className = 'dashboard-section';
            categoriesSection.innerHTML = `
                <h3 class="section-title">
                    <i class="fas fa-tags"></i> Category Analysis
                </h3>
                <div id="categories-container" class="category-cards-grid"></div>
            `;
            container.parentNode.appendChild(categoriesSection);
        }
        
        // Update buildings container
        const buildingsContainer = document.getElementById('buildings-container');
        if (buildingsContainer) {
            buildingsContainer.innerHTML = buildingsHTML;
        }
        
        // Update categories container
        const categoriesContainer = document.getElementById('categories-container');
        if (categoriesContainer) {
            if (stats.category_stats && stats.category_stats.length > 0) {
                categoriesContainer.innerHTML = categoriesHTML;
                document.getElementById('categories-section').style.display = 'block';
            } else {
                if (document.getElementById('categories-section')) {
                    document.getElementById('categories-section').style.display = 'none';
                }
            }
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // PAGINATION METHODS
    // ═══════════════════════════════════════════════════════════════════════
    
    async getPaginatedProducts(page = 1, itemsPerPage = null) {
        const supabase = window.getSupabaseClient();
        if (!supabase) throw new Error('Database unavailable');
        
        const perPage = itemsPerPage || AppState.pagination.itemsPerPage;
        const from = (page - 1) * perPage;
        const to = from + perPage - 1;
        
        let query = supabase
            .from(TABLES.PRODUCTS)
            .select(`*, categories:category_id(name), buildings:building_id(name)`, { count: 'exact' });
        
        if (!AppState.showArchived) {
            query = query.eq('is_active', true);
        }
        
        const { data, error, count } = await query
            .order('id', { ascending: true })
            .range(from, to);
        
        if (error) throw error;
        
        AppState.pagination.totalItems = count || 0;
        AppState.pagination.totalPages = Math.ceil((count || 0) / perPage);
        AppState.pagination.currentPage = page;
        AppState.pagination.itemsPerPage = perPage;
        
        return {
            products: data || [],
            totalItems: count || 0,
            totalPages: AppState.pagination.totalPages,
            currentPage: page,
            itemsPerPage: perPage
        };
    },
    
    renderPagination() {
        const paginationContainer = document.getElementById('pagination-container');
        if (!paginationContainer) return;
        
        const { currentPage, totalPages, totalItems, itemsPerPage } = AppState.pagination;
        
        if (totalItems === 0) {
            paginationContainer.innerHTML = `
                <div class="pagination-wrapper">
                    <div class="pagination-info">No items found</div>
                    <div class="pagination-per-page">
                        <label for="items-per-page">Items per page:</label>
                        <select id="items-per-page" onchange="window.changeItemsPerPage(this.value)">
                            <option value="5" ${itemsPerPage === 5 ? 'selected' : ''}>5</option>
                            <option value="10" ${itemsPerPage === 10 ? 'selected' : ''}>10</option>
                            <option value="25" ${itemsPerPage === 25 ? 'selected' : ''}>25</option>
                            <option value="50" ${itemsPerPage === 50 ? 'selected' : ''}>50</option>
                            <option value="100" ${itemsPerPage === 100 ? 'selected' : ''}>100</option>
                        </select>
                    </div>
                </div>
            `;
            return;
        }
        
        if (totalPages <= 1) {
            paginationContainer.innerHTML = `
                <div class="pagination-wrapper">
                    <div class="pagination-info">Showing all ${totalItems} items</div>
                    <div class="pagination-per-page">
                        <label for="items-per-page">Items per page:</label>
                        <select id="items-per-page" onchange="window.changeItemsPerPage(this.value)">
                            <option value="5" ${itemsPerPage === 5 ? 'selected' : ''}>5</option>
                            <option value="10" ${itemsPerPage === 10 ? 'selected' : ''}>10</option>
                            <option value="25" ${itemsPerPage === 25 ? 'selected' : ''}>25</option>
                            <option value="50" ${itemsPerPage === 50 ? 'selected' : ''}>50</option>
                            <option value="100" ${itemsPerPage === 100 ? 'selected' : ''}>100</option>
                        </select>
                    </div>
                </div>
            `;
            return;
        }
        
        const startItem = (currentPage - 1) * itemsPerPage + 1;
        const endItem = Math.min(currentPage * itemsPerPage, totalItems);
        
        let pagesHTML = '';
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        // First page button
        if (startPage > 1) {
            pagesHTML += `<button class="pagination-btn" onclick="window.goToPage(1)" title="Page 1">1</button>`;
            if (startPage > 2) {
                pagesHTML += `<span class="pagination-ellipsis">...</span>`;
            }
        }
        
        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            pagesHTML += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="window.goToPage(${i})" title="Page ${i}">${i}</button>`;
        }
        
        // Last page button
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pagesHTML += `<span class="pagination-ellipsis">...</span>`;
            }
            pagesHTML += `<button class="pagination-btn" onclick="window.goToPage(${totalPages})" title="Page ${totalPages}">${totalPages}</button>`;
        }
        
        paginationContainer.innerHTML = `
            <div class="pagination-wrapper">
                <div class="pagination-info">Showing ${startItem}-${endItem} of ${totalItems} items</div>
                <div class="pagination-controls">
                    <button class="pagination-btn" onclick="window.goToPage(1)" ${currentPage === 1 ? 'disabled' : ''} title="First Page">
                        <i class="fas fa-angle-double-left"></i>
                    </button>
                    <button class="pagination-btn" onclick="window.goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''} title="Previous Page">
                        <i class="fas fa-angle-left"></i>
                    </button>
                    ${pagesHTML}
                    <button class="pagination-btn" onclick="window.goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''} title="Next Page">
                        <i class="fas fa-angle-right"></i>
                    </button>
                    <button class="pagination-btn" onclick="window.goToPage(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''} title="Last Page">
                        <i class="fas fa-angle-double-right"></i>
                    </button>
                </div>
                <div class="pagination-per-page">
                    <label for="items-per-page">Items per page:</label>
                    <select id="items-per-page" onchange="window.changeItemsPerPage(this.value)">
                        <option value="5" ${itemsPerPage === 5 ? 'selected' : ''}>5</option>
                        <option value="10" ${itemsPerPage === 10 ? 'selected' : ''}>10</option>
                        <option value="25" ${itemsPerPage === 25 ? 'selected' : ''}>25</option>
                        <option value="50" ${itemsPerPage === 50 ? 'selected' : ''}>50</option>
                        <option value="100" ${itemsPerPage === 100 ? 'selected' : ''}>100</option>
                    </select>
                </div>
            </div>
        `;
    },
    
    async loadProductsPaginated(page = 1) {
        try {
            UIManager.showLoading();
            const result = await this.getPaginatedProducts(page, AppState.pagination.itemsPerPage);
            AppState.products = result.products;
            this.renderProductsTable(AppState.products);
            this.renderPagination();
        } catch (error) {
            console.error('Products load failed:', error);
            UIManager.showError('products-error', 'Failed to load products');
        } finally {
            UIManager.hideLoading();
        }
    },
    
    async goToPage(page) {
        if (page < 1 || page > AppState.pagination.totalPages) return;
        
        // Check if we're in search mode
        if (AppState.currentSearchTerm) {
            await this.searchProductsPaginated(AppState.currentSearchTerm, page);
        } else {
            await this.loadProductsPaginated(page);
        }
    },
    
    async changeItemsPerPage(value) {
        const itemsPerPage = parseInt(value);
        AppState.pagination.itemsPerPage = itemsPerPage;
        AppState.pagination.currentPage = 1;
        
        // Check if we're in search mode
        if (AppState.currentSearchTerm) {
            await this.searchProductsPaginated(AppState.currentSearchTerm, 1);
        } else {
            await this.loadProductsPaginated(1);
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // PRODUCTS METHODS
    // ═══════════════════════════════════════════════════════════════════════
    
    async loadProducts() {
        await this.loadProductsPaginated(1);
    },
    
    renderProductsTable(products, highlightedId = null) {
        const tbody = document.getElementById('products-list');
        if (!tbody) return;
        
        if (!products?.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" style="text-align:center;padding:30px;color:var(--text-secondary)">
                        <i class="fas fa-box-open" style="font-size:32px;display:block;margin-bottom:12px;opacity:0.5"></i>
                        No products found
                    </td>
                </tr>
            `;
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
                    <td>
                        <strong>${Utils.escapeHtml(String(p.id))}</strong>
                        ${isArchived ? '<span class="archived-badge">Archived</span>' : ''}
                    </td>
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
            const supabase = window.getSupabaseClient();
            if (!supabase) throw new Error('Database unavailable');
            
            if (!term?.trim()) {
                AppState.currentSearchTerm = null;
                AppState.currentSearchType = null;
                await this.loadProductsPaginated(1);
                return;
            }
            
            const search = term.trim().toLowerCase();
            
            // Check for category filter: category:CategoryName
            const categoryMatch = search.match(/^category:\s*(.+)$/i);
            if (categoryMatch) {
                AppState.currentSearchTerm = search;
                AppState.currentSearchType = 'category';
                await this.filterProductsByCategory(categoryMatch[1].trim());
                return;
            }
            
            // Check for building filter: building:BuildingName
            const buildingMatch = search.match(/^building:\s*(.+)$/i);
            if (buildingMatch) {
                AppState.currentSearchTerm = search;
                AppState.currentSearchType = 'building';
                await this.filterProductsByField('building', buildingMatch[1].trim());
                return;
            }
            
            // Check for assigned_to filter: assigned:PersonName
            const assignedMatch = search.match(/^assigned:\s*(.+)$/i);
            if (assignedMatch) {
                AppState.currentSearchTerm = search;
                AppState.currentSearchType = 'assigned';
                await this.filterProductsByField('assigned', assignedMatch[1].trim());
                return;
            }
            
            // Check for condition filter: condition:ConditionName
            const conditionMatch = search.match(/^condition:\s*(.+)$/i);
            if (conditionMatch) {
                AppState.currentSearchTerm = search;
                AppState.currentSearchType = 'condition';
                await this.filterProductsByField('condition', conditionMatch[1].trim());
                return;
            }
            
            const isNumericSearch = /^\d+$/.test(search);
            
            if (isNumericSearch) {
                // Handle exact ID search
                const idNumber = parseInt(search, 10);
                const idValidation = Utils.validateIdRange(idNumber);
                
                if (idValidation.valid) {
                    let query = supabase
                        .from(TABLES.PRODUCTS)
                        .select(`*, categories:category_id(name), buildings:building_id(name)`, { count: 'exact' });
                    
                    if (!AppState.showArchived) {
                        query = query.eq('is_active', true);
                    }
                    
                    query = query.eq('id', idNumber);
                    
                    const { data, error, count } = await query;
                    
                    if (error) throw error;
                    
                    AppState.currentSearchTerm = search;
                    AppState.currentSearchType = 'id';
                    AppState.products = data || [];
                    this.renderProductsTable(data || [], idNumber);
                    AppState.pagination.totalItems = count || 0;
                    AppState.pagination.totalPages = Math.ceil((count || 0) / AppState.pagination.itemsPerPage);
                    AppState.pagination.currentPage = 1;
                    this.renderPagination();
                    
                    if (data?.length === 0) {
                        Utils.showNotification(`No product found with ID ${idNumber}`, 'info');
                    } else {
                        Utils.showNotification(`Found product with ID ${idNumber}`, 'success');
                    }
                } else {
                    Utils.showNotification(idValidation.error, 'error');
                    this.renderProductsTable([]);
                    this.renderPagination();
                }
            } else {
                // Store the current search term in AppState for pagination
                AppState.currentSearchTerm = search;
                AppState.currentSearchType = 'general';
                
                // Perform paginated search - NO LOADING EFFECT
                await this.searchProductsPaginated(search, 1);
            }
        } catch (error) {
            console.error('Search failed:', error);
            UIManager.showError('products-error', 'Search failed');
            Utils.showNotification('Search failed: ' + error.message, 'error');
        }
    },
    
    // Paginated search across all fields - NO LOADING EFFECT
    async searchProductsPaginated(searchTerm, page = 1) {
        try {
            // REMOVED: UIManager.showLoading();
            const supabase = window.getSupabaseClient();
            if (!supabase) throw new Error('Database unavailable');
            
            const perPage = AppState.pagination.itemsPerPage;
            const from = (page - 1) * perPage;
            const to = from + perPage - 1;
            const searchPattern = `%${searchTerm}%`;
            
            // Collect all matching product IDs from all sources
            let allMatchingIds = new Set();
            
            // Search in main product fields
            let productsQuery = supabase
                .from(TABLES.PRODUCTS)
                .select('id');
            
            if (!AppState.showArchived) {
                productsQuery = productsQuery.eq('is_active', true);
            }
            
            productsQuery = productsQuery.or(
                `name.ilike.${searchPattern},` +
                `sku.ilike.${searchPattern},` +
                `description.ilike.${searchPattern},` +
                `assigned_to.ilike.${searchPattern},` +
                `condition.ilike.${searchPattern}`
            );
            
            const { data: productMatches, error: productError } = await productsQuery;
            
            if (productError) throw productError;
            
            (productMatches || []).forEach(p => allMatchingIds.add(p.id));
            
            // Search in categories
            const { data: matchingCategories } = await supabase
                .from(TABLES.CATEGORIES)
                .select('id')
                .ilike('name', searchPattern);
            
            const categoryIds = (matchingCategories || []).map(c => c.id);
            
            if (categoryIds.length > 0) {
                let categoryProductsQuery = supabase
                    .from(TABLES.PRODUCTS)
                    .select('id');
                
                if (!AppState.showArchived) {
                    categoryProductsQuery = categoryProductsQuery.eq('is_active', true);
                }
                
                categoryProductsQuery = categoryProductsQuery.in('category_id', categoryIds);
                
                const { data: categoryProductMatches } = await categoryProductsQuery;
                (categoryProductMatches || []).forEach(p => allMatchingIds.add(p.id));
            }
            
            // Search in buildings
            const { data: matchingBuildings } = await supabase
                .from(TABLES.BUILDINGS)
                .select('id')
                .ilike('name', searchPattern);
            
            const buildingIds = (matchingBuildings || []).map(b => b.id);
            
            if (buildingIds.length > 0) {
                let buildingProductsQuery = supabase
                    .from(TABLES.PRODUCTS)
                    .select('id');
                
                if (!AppState.showArchived) {
                    buildingProductsQuery = buildingProductsQuery.eq('is_active', true);
                }
                
                buildingProductsQuery = buildingProductsQuery.in('building_id', buildingIds);
                
                const { data: buildingProductMatches } = await buildingProductsQuery;
                (buildingProductMatches || []).forEach(p => allMatchingIds.add(p.id));
            }
            
            const matchingIdArray = Array.from(allMatchingIds).sort((a, b) => a - b);
            const totalItems = matchingIdArray.length;
            const totalPages = Math.ceil(totalItems / perPage);
            
            // Get the IDs for the current page
            const pageIds = matchingIdArray.slice(from, to + 1);
            
            // Fetch full product data for the current page
            let finalQuery = supabase
                .from(TABLES.PRODUCTS)
                .select(`*, categories:category_id(name), buildings:building_id(name)`)
                .in('id', pageIds)
                .order('id', { ascending: true });
            
            const { data: paginatedProducts, error: finalError } = await finalQuery;
            
            if (finalError) throw finalError;
            
            // Sort results to match the order of pageIds
            const sortedProducts = pageIds.map(id => 
                (paginatedProducts || []).find(p => p.id === id)
            ).filter(Boolean);
            
            // Update state
            AppState.products = sortedProducts;
            AppState.pagination.totalItems = totalItems;
            AppState.pagination.totalPages = totalPages;
            AppState.pagination.currentPage = page;
            AppState.pagination.itemsPerPage = perPage;
            
            this.renderProductsTable(sortedProducts);
            this.renderPagination();
            
            if (sortedProducts.length === 0) {
                Utils.showNotification('No products found matching your search', 'info');
            } else if (page === 1) {
                Utils.showNotification(`Found ${totalItems} product(s) matching "${searchTerm}"`, 'success');
            }
            
        } catch (error) {
            console.error('Paginated search failed:', error);
            throw error;
        } finally {
            // REMOVED: UIManager.hideLoading();
        }
    },
    
    // Filter products by field - NO LOADING EFFECT
    async filterProductsByField(field, value) {
        try {
            // REMOVED: UIManager.showLoading();
            const supabase = window.getSupabaseClient();
            if (!supabase) throw new Error('Database unavailable');
            
            let query = supabase
                .from(TABLES.PRODUCTS)
                .select(`*, categories:category_id(name), buildings:building_id(name)`, { count: 'exact' });
            
            if (!AppState.showArchived) {
                query = query.eq('is_active', true);
            }
            
            const fieldLabels = {
                'building': 'Building',
                'assigned': 'Assigned To',
                'condition': 'Condition'
            };
            
            switch (field) {
                case 'building':
                    query = query.filter('buildings.name', 'ilike', `%${value}%`);
                    break;
                    
                case 'assigned':
                    query = query.ilike('assigned_to', `%${value}%`);
                    break;
                    
                case 'condition':
                    query = query.ilike('condition', `%${value}%`);
                    break;
                    
                default:
                    throw new Error(`Unknown filter type: ${field}`);
            }
            
            const { data, error, count } = await query.order('id', { ascending: true });
            
            if (error) throw error;
            
            AppState.products = data || [];
            this.renderProductsTable(data || []);
            AppState.pagination.totalItems = count || 0;
            AppState.pagination.totalPages = Math.ceil((count || 0) / AppState.pagination.itemsPerPage);
            AppState.pagination.currentPage = 1;
            this.renderPagination();
            
            const fieldLabel = fieldLabels[field] || field;
            
            if (!data || data.length === 0) {
                Utils.showNotification(`No products found with ${fieldLabel.toLowerCase()} matching "${value}"`, 'info');
            } else {
                Utils.showNotification(`Found ${data.length} product(s) with ${fieldLabel.toLowerCase()} matching "${value}"`, 'success');
            }
        } catch (error) {
            console.error(`${field} filter failed:`, error);
            Utils.showNotification(`Filter failed: ${error.message}`, 'error');
            this.renderProductsTable([]);
            this.renderPagination();
        } finally {
            // REMOVED: UIManager.hideLoading();
        }
    },
    
    async filterProductsByCategory(categoryName) {
        try {
            // REMOVED: UIManager.showLoading();
            const supabase = window.getSupabaseClient();
            if (!supabase) throw new Error('Database unavailable');
            
            let query = supabase
                .from(TABLES.PRODUCTS)
                .select(`*, categories:category_id(name), buildings:building_id(name)`, { count: 'exact' });
            
            if (!AppState.showArchived) {
                query = query.eq('is_active', true);
            }
            
            query = query.filter('categories.name', 'ilike', `%${categoryName}%`);
            
            const { data, error, count } = await query.order('id', { ascending: true });
            
            if (error) throw error;
            
            AppState.products = data || [];
            this.renderProductsTable(data || []);
            AppState.pagination.totalItems = count || 0;
            AppState.pagination.totalPages = Math.ceil((count || 0) / AppState.pagination.itemsPerPage);
            AppState.pagination.currentPage = 1;
            this.renderPagination();
            
            if (data?.length === 0) {
                Utils.showNotification(`No products found in category matching "${categoryName}"`, 'info');
            } else {
                Utils.showNotification(`Found ${data.length} product(s) in category matching "${categoryName}"`, 'success');
            }
        } catch (error) {
            console.error('Category filter failed:', error);
            Utils.showNotification('Category filter failed: ' + error.message, 'error');
            this.renderProductsTable([]);
            this.renderPagination();
        } finally {
            // REMOVED: UIManager.hideLoading();
        }
    },
    
    async saveProduct(data, id = null) {
        try {
            UIManager.showLoading();
            const supabase = window.getSupabaseClient();
            if (!supabase) throw new Error('Database unavailable');
            
            if (!data.condition) {
                data.condition = PRODUCT_CONDITIONS.DEFAULT;
            }
            
            if (id) {
                // Update existing product
                const idValidation = Utils.validateIdRange(id);
                if (!idValidation.valid) throw new Error(idValidation.error);
                
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
                    .update({ ...data, updated_at: new Date().toISOString() })
                    .eq('id', id);
                
                if (error) throw error;
                
                // Record stock change if quantity changed
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
                // Create new product
                const nextId = await Utils.getNextAvailableId(TABLES.PRODUCTS);
                if (!nextId) {
                    throw new Error(`No available IDs in range ${AppConfig.MIN_ID}-${AppConfig.MAX_ID}. Maximum capacity reached.`);
                }
                
                const { error } = await supabase.from(TABLES.PRODUCTS).insert([{
                    id: nextId,
                    ...data,
                    is_active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }]);
                
                if (error) throw error;
                
                // Record initial stock movement
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
            
            // Reload products based on current state
            if (AppState.currentSearchTerm) {
                await this.searchProductsPaginated(AppState.currentSearchTerm, AppState.pagination.currentPage);
            } else {
                await this.loadProductsPaginated(AppState.pagination.currentPage);
            }
            
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
            if (!idValidation.valid) throw new Error(idValidation.error);
            
            UIManager.showLoading();
            const supabase = window.getSupabaseClient();
            if (!supabase) throw new Error('Database unavailable');
            
            const { data: product, error: productErr } = await supabase
                .from(TABLES.PRODUCTS)
                .select('is_active, name')
                .eq('id', id)
                .single();
            
            if (productErr) throw productErr;
            
            // If already archived, offer permanent deletion
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
                    if (AppState.currentSearchTerm) {
                        await this.searchProductsPaginated(AppState.currentSearchTerm, AppState.pagination.currentPage);
                    } else {
                        await this.loadProductsPaginated(AppState.pagination.currentPage);
                    }
                }
                return true;
            }
            
            // Check for movements
            const { data: movements, error: moveCheck } = await supabase
                .from(TABLES.MOVEMENTS)
                .select('id', { count: 'exact' })
                .eq('product_id', id);
            
            if (moveCheck) throw moveCheck;
            
            if (movements?.length > 0) {
                if (confirm(`Product "${product.name}" has ${movements.length} movement record(s).\n\nIt cannot be deleted due to existing history.\n\nWould you like to ARCHIVE it instead?\n(Archived products are hidden from main view but can be restored later)`)) {
                    const { error } = await supabase
                        .from(TABLES.PRODUCTS)
                        .update({ is_active: false, deleted_at: new Date().toISOString() })
                        .eq('id', id);
                    
                    if (error) throw error;
                    
                    Utils.showNotification('Product archived successfully', 'warning');
                    if (AppState.currentSearchTerm) {
                        await this.searchProductsPaginated(AppState.currentSearchTerm, AppState.pagination.currentPage);
                    } else {
                        await this.loadProductsPaginated(AppState.pagination.currentPage);
                    }
                }
            } else {
                if (confirm(`Delete product "${product.name}"? This action cannot be undone.`)) {
                    const { error } = await supabase
                        .from(TABLES.PRODUCTS)
                        .delete()
                        .eq('id', id);
                    
                    if (error) throw error;
                    
                    Utils.showNotification('Product deleted successfully', 'success');
                    if (AppState.currentSearchTerm) {
                        await this.searchProductsPaginated(AppState.currentSearchTerm, AppState.pagination.currentPage);
                    } else {
                        await this.loadProductsPaginated(AppState.pagination.currentPage);
                    }
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
                .update({ is_active: true, deleted_at: null })
                .eq('id', id);
            
            if (error) throw error;
            
            Utils.showNotification('Product restored successfully', 'success');
            if (AppState.currentSearchTerm) {
                await this.searchProductsPaginated(AppState.currentSearchTerm, AppState.pagination.currentPage);
            } else {
                await this.loadProductsPaginated(AppState.pagination.currentPage);
            }
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
        if (btn) btn.textContent = AppState.showArchived ? 'Hide Archived' : 'Show Archived';
        
        if (AppState.currentSearchTerm) {
            await this.searchProductsPaginated(AppState.currentSearchTerm, 1);
        } else {
            await this.loadProductsPaginated(1);
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // CATEGORIES METHODS
    // ═══════════════════════════════════════════════════════════════════════
    
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
                    <button class="action-btn btn-edit" onclick="window.editCategory(${c.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn btn-delete" onclick="window.deleteCategory(${c.id})">
                        <i class="fas fa-trash"></i>
                    </button>
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
                if (!nextId) throw new Error('No available IDs. Maximum capacity reached.');
                
                const { error } = await supabase.from(TABLES.CATEGORIES).insert([{
                    id: nextId,
                    ...data,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }]);
                
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from(TABLES.CATEGORIES)
                    .update({ ...data, updated_at: new Date().toISOString() })
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
            if (used?.length > 0) throw new Error('Category is being used by products and cannot be deleted');
            
            const { error } = await supabase
                .from(TABLES.CATEGORIES)
                .delete()
                .eq('id', id);
            
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
    
    // ═══════════════════════════════════════════════════════════════════════
    // BUILDINGS METHODS
    // ═══════════════════════════════════════════════════════════════════════
    
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
                    <button class="action-btn btn-edit" onclick="window.editBuilding(${b.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn btn-delete" onclick="window.deleteBuilding(${b.id})">
                        <i class="fas fa-trash"></i>
                    </button>
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
                if (!nextId) throw new Error('No available IDs. Maximum capacity reached.');
                
                const { error } = await supabase.from(TABLES.BUILDINGS).insert([{
                    id: nextId,
                    ...data,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }]);
                
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from(TABLES.BUILDINGS)
                    .update({ ...data, updated_at: new Date().toISOString() })
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
            if (used?.length > 0) throw new Error('Building is being used by products and cannot be deleted');
            
            const { error } = await supabase
                .from(TABLES.BUILDINGS)
                .delete()
                .eq('id', id);
            
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
    
    // ═══════════════════════════════════════════════════════════════════════
    // STOCK MANAGEMENT METHODS
    // ═══════════════════════════════════════════════════════════════════════
    
    async loadStockView() {
        try {
            UIManager.showLoading();
            const supabase = window.getSupabaseClient();
            if (!supabase) throw new Error('Database unavailable');
            
            const { data, error } = await supabase
                .from(TABLES.PRODUCTS)
                .select('id, name, sku, stock_quantity, condition')
                .eq('is_active', true)
                .ilike('condition', '%defective%')
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
        
        if (!products || products.length === 0) {
            select.innerHTML = '<option value="">No defective products found</option>';
            return;
        }
        
        select.innerHTML = '<option value="">Select defective product...</option>' +
            products.map(p => `
                <option value="${p.id}" data-sku="${Utils.escapeHtml(p.sku || '')}" data-name="${Utils.escapeHtml(p.name)}">
                    ID ${p.id}: ${Utils.escapeHtml(p.name)} (Stock: ${p.stock_quantity || 0})
                    ${(p.stock_quantity || 0) === 0 ? ' ⚠️ Out of Stock' : ''}
                </option>
            `).join('');
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
                .update({ stock_quantity: newQty, updated_at: new Date().toISOString() })
                .eq('id', productId);
            
            if (updateErr) throw updateErr;
            
            const { error: moveErr } = await supabase.from(TABLES.MOVEMENTS).insert([{
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
    
    // ═══════════════════════════════════════════════════════════════════════
    // REPORTS METHODS
    // ═══════════════════════════════════════════════════════════════════════
    
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
            .select(`*, categories:category_id(name), buildings:building_id(name)`)
            .eq('is_active', true)
            .order('id', { ascending: true });
        
        let html = `
            <div class="stats-grid" style="margin-bottom:20px">
                <div class="stat-card">
                    <div class="stat-value">${stats.total_items}</div>
                    <div class="stat-title">Total Items</div>
                </div>
            </div>
            <div class="table-container">
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Code</th>
                            <th>Product</th>
                            <th>Category</th>
                            <th>Building</th>
                            <th>Condition</th>
                            <th>Stock</th>
                            <th>Status</th>
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
                    <td style="color:${status === 'OUT OF STOCK' ? '#ef476f' : '#06d6a0'}">${stock}</td>
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
            .select('*, products:products(id, stock_quantity)')
            .gte('id', 1)
            .order('id', { ascending: true });
        
        let html = `
            <div class="table-container">
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Category</th>
                            <th>Assets</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        let grandTotal = 0;
        (categories || []).forEach(c => {
            const products = c.products || [];
            const totalUnits = products.reduce((sum, p) => sum + (p.stock_quantity || 0), 0);
            grandTotal += totalUnits;
            
            html += `
                <tr>
                    <td>${c.id}</td>
                    <td><strong>${Utils.escapeHtml(c.name)}</strong></td>
                    <td>${totalUnits}</td>
                </tr>
            `;
        });
        
        html += `
                <tr style="background:linear-gradient(135deg,#2f3850 0%,#1a1f2e 100%);font-weight:bold;border-top:2px solid #4361ee">
                    <td colspan="2" style="text-align:right;color:#e0e0e0">TOTAL ASSETS:</td>
                    <td style="color:#06d6a0;font-size:16px">${grandTotal}</td>
                </tr>
            </tbody></table></div>
        `;
        
        container.innerHTML = html;
    },
    
   async showBuildingAnalysis(container) {
    const supabase = window.getSupabaseClient();
    const { data: buildings } = await supabase
        .from(TABLES.BUILDINGS)
        .select(`*, products:products(id, name, stock_quantity, category_id, categories:category_id(name))`)
        .order('id', { ascending: true });
    
    // Check which interface is active
    const isInterface2 = AppState.currentInterface === 'interface2';
    
    let html = `
        <div class="table-container">
            <table class="report-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Building</th>
                        <th>${isInterface2 ? 'Total Assets' : 'PC-Desktop Units'}</th>
                        ${isInterface2 ? '<th>Categories</th>' : ''}
                    </tr>
                </thead>
                <tbody>
    `;
    
    let grandTotal = 0;
    
    (buildings || []).forEach(b => {
        const products = b.products || [];
        let totalUnits = 0;
        let categoryInfo = '';
        
        if (isInterface2) {
            // Interface 2: Count ALL products (office supplies & consumables)
            totalUnits = products.reduce((sum, p) => sum + (p.stock_quantity || 0), 0);
            grandTotal += totalUnits;
            
            // Collect unique categories for this building
            const categories = new Set();
            products.forEach(p => {
                if (p.categories?.name) {
                    categories.add(p.categories.name);
                }
            });
            categoryInfo = Array.from(categories).slice(0, 3).join(', ');
            if (categories.size > 3) categoryInfo += ` +${categories.size - 3} more`;
            if (categories.size === 0) categoryInfo = '—';
        } else {
            // Interface 1: Only PC-Desktop units (original behavior)
            const pcDesktopProducts = products.filter(p =>
                p.categories && (p.categories.name || '').toLowerCase().includes('pc-desktop')
            );
            totalUnits = pcDesktopProducts.reduce((sum, p) => sum + (p.stock_quantity || 0), 0);
            grandTotal += totalUnits;
        }
        
        html += `
            <tr>
                <td>${b.id}</td>
                <td><strong>${Utils.escapeHtml(b.name)}</strong></td>
                <td style="color:#06d6a0;font-weight:bold">${totalUnits.toLocaleString()}</td>
                ${isInterface2 ? `<td style="font-size:12px;color:#aaa">${Utils.escapeHtml(categoryInfo)}</td>` : ''}
            </tr>
        `;
    });
    
    const totalLabel = isInterface2 ? 'TOTAL ASSETS:' : 'TOTAL PC-DESKTOP UNITS:';
    
    html += `
            <tr style="background:linear-gradient(135deg,#2f3850 0%,#1a1f2e 100%);font-weight:bold;border-top:2px solid #4361ee">
                <td colspan="2" style="text-align:right;color:#e0e0e0">${totalLabel}</td>
                <td style="color:#06d6a0;font-size:16px">${grandTotal.toLocaleString()}</td>
                ${isInterface2 ? '<td></td>' : ''}
            </tr>
        </tbody>
    </table></div>
    `;
    
    container.innerHTML = html;
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXCEL IMPORT SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

const ExcelImportService = {
    async importFromExcel(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                    
                    const results = await this.processExcelData(jsonData);
                    resolve(results);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsArrayBuffer(file);
        });
    },
    
    async processExcelData(data) {
        const supabase = window.getSupabaseClient();
        if (!supabase) throw new Error('Database unavailable');
        
        let successCount = 0;
        let errorCount = 0;
        const errors = [];
        
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            try {
                // Map Excel columns to product fields (supports multiple column name variations)
                const product = {
                    name: row['Product Name'] || row['name'] || row['NAME'] || row['product_name'],
                    sku: row['SKU'] || row['sku'] || row['Code'] || row['code'],
                    description: row['Description'] || row['description'] || row['DESCRIPTION'] || '',
                    stock_quantity: parseInt(row['Stock'] || row['stock_quantity'] || row['Quantity'] || row['quantity'] || 0),
                    condition: row['Condition'] || row['condition'] || row['CONDITION'] || 'Working - Storage',
                    assigned_to: row['Assigned To'] || row['assigned_to'] || row['Assigned'] || row['assigned'] || null,
                    is_active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                
                // Validate required fields
                if (!product.name) {
                    throw new Error('Product name is required');
                }
                
                // Get or create category
                if (row['Category'] || row['category'] || row['CATEGORY']) {
                    const categoryName = row['Category'] || row['category'] || row['CATEGORY'];
                    const category = await this.getOrCreateCategory(categoryName.trim());
                    product.category_id = category.id;
                }
                
                // Get or create building
                if (row['Building'] || row['building'] || row['BUILDING']) {
                    const buildingName = row['Building'] || row['building'] || row['BUILDING'];
                    const building = await this.getOrCreateBuilding(buildingName.trim());
                    product.building_id = building.id;
                }
                
                // Get next available ID
                const nextId = await Utils.getNextAvailableId(TABLES.PRODUCTS);
                if (!nextId) {
                    throw new Error('No available IDs. Maximum capacity reached.');
                }
                product.id = nextId;
                
                // Save to database
                const { error } = await supabase
                    .from(TABLES.PRODUCTS)
                    .insert([product]);
                
                if (error) throw error;
                
                // Record initial stock movement if stock > 0
                if (product.stock_quantity > 0) {
                    await supabase.from(TABLES.MOVEMENTS).insert([{
                        product_id: nextId,
                        quantity: product.stock_quantity,
                        movement_type: 'IN',
                        reference: 'EXCEL_IMPORT',
                        notes: `Imported from Excel - Row ${i + 2}`,
                        user_id: AppState.currentUser?.id,
                        created_at: new Date().toISOString()
                    }]);
                }
                
                successCount++;
            } catch (error) {
                errorCount++;
                errors.push(`Row ${i + 2}: ${error.message}`);
                console.error('Import error for row:', row, error);
            }
        }
        
        return { successCount, errorCount, errors };
    },
    
    async getOrCreateCategory(name) {
        const supabase = window.getSupabaseClient();
        
        // Try to find existing category
        const { data: existing } = await supabase
            .from(TABLES.CATEGORIES)
            .select('id')
            .ilike('name', name)
            .limit(1);
        
        if (existing && existing.length > 0) {
            return existing[0];
        }
        
        // Create new category
        const nextId = await Utils.getNextAvailableId(TABLES.CATEGORIES);
        if (!nextId) throw new Error('No available IDs for category');
        
        const { data: newCategory, error } = await supabase
            .from(TABLES.CATEGORIES)
            .insert([{
                id: nextId,
                name: name,
                description: `Auto-created from Excel import`,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (error) throw error;
        return newCategory;
    },
    
    async getOrCreateBuilding(name) {
        const supabase = window.getSupabaseClient();
        
        // Try to find existing building
        const { data: existing } = await supabase
            .from(TABLES.BUILDINGS)
            .select('id')
            .ilike('name', name)
            .limit(1);
        
        if (existing && existing.length > 0) {
            return existing[0];
        }
        
        // Create new building
        const nextId = await Utils.getNextAvailableId(TABLES.BUILDINGS);
        if (!nextId) throw new Error('No available IDs for building');
        
        const { data: newBuilding, error } = await supabase
            .from(TABLES.BUILDINGS)
            .insert([{
                id: nextId,
                name: name,
                location_address: '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (error) throw error;
        return newBuilding;
    },
    
    downloadTemplate() {
        const template = [
            {
                'Product Name': 'Example Product',
                'SKU': 'PRD-001',
                'Description': 'Product description here',
                'Category': 'Electronics',
                'Building': 'Main Building',
                'Stock': 10,
                'Condition': 'Working - Storage',
                'Assigned To': ''
            },
            {
                'Product Name': 'Second Product',
                'SKU': 'PRD-002',
                'Description': 'Another product example',
                'Category': 'Office Supplies',
                'Building': 'Mabini A',
                'Stock': 5,
                'Condition': 'Working - Assigned',
                'Assigned To': 'John Doe'
            }
        ];
        
        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Products Template');
        
        // Set column widths
        ws['!cols'] = [
            { wch: 20 }, // Product Name
            { wch: 15 }, // SKU
            { wch: 30 }, // Description
            { wch: 15 }, // Category
            { wch: 15 }, // Building
            { wch: 10 }, // Stock
            { wch: 20 }, // Condition
            { wch: 20 }  // Assigned To
        ];
        
        XLSX.writeFile(wb, 'product_import_template.xlsx');
        Utils.showNotification('Template downloaded successfully', 'success');
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// APPLICATION CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════════

const App = {
    interfaceToggleBtn: null,
    
    async init() {
        try {
            console.log('App initializing...');
            
            const initialized = SupabaseManager.initializeClients();
            if (!initialized) {
                console.error('Supabase init failed');
                UIManager.showError('app-error', 'Database connection failed. Please refresh the page.');
                return;
            }
            
            UIManager.updateDateTime();
            AppState.clockInterval = setInterval(() => UIManager.updateDateTime(), 1000);
            
            await AuthService.checkAuth();
            this.bindEvents();
            this.setupMobileMenu();
            this.setupInterfaceToggle();
            this.addInterfaceToggleButton();
            
            console.log('App initialized successfully');
        } catch (error) {
            console.error('Init failed:', error);
            UIManager.showError('app-error', 'Application failed to start');
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // EVENT BINDING
    // ═══════════════════════════════════════════════════════════════════════
    
    bindEvents() {
        // Authentication
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
                    UIManager.updateInterfaceIndicator();
                    await DataService.loadDashboard();
                    UIManager.showView('dashboard-view');
                    Utils.showNotification('Login successful!', 'success');
                } catch (err) {
                    UIManager.showError('login-error', err.message || 'Login failed');
                } finally {
                    UIManager.hideLoading();
                    if (loginForm) loginForm.reset();
                }
            });
        }
        
        // Registration
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
                    UIManager.showError('register-error', err.message || 'Registration failed');
                } finally {
                    UIManager.hideLoading();
                }
            });
        }
        
        // Logout
        document.getElementById('logout-btn')?.addEventListener('click', () => AuthService.logout());
        
        // Search - UPDATED: Only search on Enter key press
        const search = document.getElementById('product-search');
        if (search) {
            search.placeholder = "Search ID, code, name, category, building, assigned, condition... [Press Enter to search]";
            
            // Search on Enter key
            search.addEventListener('keydown', async (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    await DataService.searchProducts(e.target.value);
                }
            });
        }
        
        // Clear search
        document.getElementById('clear-search')?.addEventListener('click', async () => {
            if (search) search.value = '';
            AppState.currentSearchTerm = null;
            AppState.currentSearchType = null;
            await DataService.loadProductsPaginated(1);
            Utils.showNotification('Filters cleared', 'info');
        });
        
        // Toggle archived
        document.getElementById('toggle-archived')?.addEventListener('click', () => DataService.toggleShowArchived());
        
        // Import Excel button
        const importExcelBtn = document.getElementById('import-excel');
        if (importExcelBtn) {
            importExcelBtn.addEventListener('click', () => this.showExcelImportModal());
        }
        
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', function() {
                const view = this.dataset.view;
                if (view) App.switchView(view);
                document.getElementById('sidebar')?.classList.remove('active');
                document.getElementById('sidebar-overlay')?.classList.remove('active');
            });
        });
        
        // Stock management
        document.getElementById('stock-form')?.addEventListener('submit', async e => {
            e.preventDefault();
            await this.handleStockAdjustment(e);
        });
        
        document.getElementById('stock-product')?.addEventListener('change', () => this.handleProductSelect());
        
        document.querySelectorAll('.btn-type').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.btn-type').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                App.handleStockTypeChange();
            });
        });
        
        // Password change
        document.getElementById('password-form')?.addEventListener('submit', async e => {
            e.preventDefault();
            await this.handlePasswordChange(e);
        });
        
        // CRUD forms
        document.getElementById('product-form')?.addEventListener('submit', async e => {
            e.preventDefault();
            await this.handleProductSave(e);
        });
        
        document.getElementById('category-form')?.addEventListener('submit', async e => {
            e.preventDefault();
            await this.handleCategorySave(e);
        });
        
        document.getElementById('building-form')?.addEventListener('submit', async e => {
            e.preventDefault();
            await this.handleBuildingSave(e);
        });
        
        // Movement filter
        document.getElementById('movement-filter')?.addEventListener('change', () => this.filterMovements());
        
        // Modal close on background click
        window.onclick = e => {
            if (e.target.classList?.contains('modal')) {
                e.target.classList.remove('active');
                document.body.style.overflow = '';
            }
        };
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K: Focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const si = document.getElementById('product-search');
                if (si && document.getElementById('products-view').classList.contains('active')) {
                    si.focus();
                    si.select();
                }
            }
            
            // Ctrl/Cmd + Shift + I: Toggle interface
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
                e.preventDefault();
                this.toggleInterface();
            }
        });
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // EXCEL IMPORT MODAL
    // ═══════════════════════════════════════════════════════════════════════
    
    showExcelImportModal() {
        // Create modal if it doesn't exist
        let modal = document.getElementById('excel-import-modal');
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'excel-import-modal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 550px;">
                    <div class="modal-header">
                        <h3><i class="fas fa-file-excel"></i> Import Excel Data</h3>
                        <button class="close-btn" onclick="closeModal('excel-import-modal')">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="import-info" style="margin-bottom: 20px; padding: 15px; background: #2f3850; border-radius: 8px;">
                            <i class="fas fa-info-circle"></i>
                            <strong>Instructions:</strong>
                            <ul style="margin-top: 10px; margin-bottom: 0;">
                                <li>File must be .xlsx or .xls format</li>
                                <li>Required column: <strong>Product Name, SKU, Description, Category, Building, Stock, Condition, Assigned To</strong></li>
                                <li>Categories and Buildings will be auto-created if not found</li>
                                <li>Maximum file size: 10MB</li>
                            </ul>
                        </div>
                        
                        <div class="form-group">
                            <label>Select Excel File:</label>
                            <input type="file" id="excel-file-input" accept=".xlsx,.xls" class="form-control">
                            <small class="form-text text-muted">Choose an Excel file to import product data</small>
                        </div>
                        
                        <div id="import-progress" style="display: none;">
                            <div class="progress-bar-container" style="background: #1a1f2e; border-radius: 4px; overflow: hidden; margin: 10px 0;">
                                <div id="import-progress-bar" style="width: 0%; height: 4px; background: linear-gradient(90deg, #4361ee, #06d6a0); transition: width 0.3s;"></div>
                            </div>
                            <p id="import-status" style="margin-top: 10px; text-align: center;"></p>
                        </div>
                        
                        <div id="import-results" style="display: none;" class="import-results"></div>
                        
                        <div class="form-actions" style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
                            <button id="download-template-btn" class="btn btn-secondary">
                                <i class="fas fa-download"></i> Download Template
                            </button>
                            <button id="confirm-import-btn" class="btn btn-primary">
                                <i class="fas fa-upload"></i> Import
                            </button>
                            <button onclick="closeModal('excel-import-modal')" class="btn btn-secondary">Cancel</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            // Add event listeners for the modal buttons
            const downloadBtn = document.getElementById('download-template-btn');
            if (downloadBtn) {
                downloadBtn.addEventListener('click', () => ExcelImportService.downloadTemplate());
            }
            
            const confirmBtn = document.getElementById('confirm-import-btn');
            if (confirmBtn) {
                confirmBtn.addEventListener('click', () => this.processExcelImport());
            }
        }
        
        // Reset modal state
        const fileInput = document.getElementById('excel-file-input');
        if (fileInput) fileInput.value = '';
        
        const progressDiv = document.getElementById('import-progress');
        if (progressDiv) progressDiv.style.display = 'none';
        
        const resultsDiv = document.getElementById('import-results');
        if (resultsDiv) {
            resultsDiv.style.display = 'none';
            resultsDiv.innerHTML = '';
        }
        
        UIManager.openModal('excel-import-modal');
    },
    
    async processExcelImport() {
        const fileInput = document.getElementById('excel-file-input');
        const file = fileInput?.files[0];
        
        if (!file) {
            Utils.showNotification('Please select an Excel file', 'error');
            return;
        }
        
        // Check file extension
        const fileExt = file.name.split('.').pop().toLowerCase();
        if (!['xlsx', 'xls'].includes(fileExt)) {
            Utils.showNotification('Please select a valid Excel file (.xlsx or .xls)', 'error');
            return;
        }
        
        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            Utils.showNotification('File size exceeds 10MB limit', 'error');
            return;
        }
        
        // Show progress
        const progressDiv = document.getElementById('import-progress');
        const progressBar = document.getElementById('import-progress-bar');
        const statusText = document.getElementById('import-status');
        const importBtn = document.getElementById('confirm-import-btn');
        const downloadBtn = document.getElementById('download-template-btn');
        
        progressDiv.style.display = 'block';
        progressBar.style.width = '30%';
        statusText.textContent = 'Reading file...';
        
        // Disable buttons during import
        if (importBtn) importBtn.disabled = true;
        if (downloadBtn) downloadBtn.disabled = true;
        
        try {
            progressBar.style.width = '50%';
            statusText.textContent = 'Processing data...';
            
            const results = await ExcelImportService.importFromExcel(file);
            
            progressBar.style.width = '100%';
            statusText.textContent = 'Import completed!';
            
            // Show results
            const resultsDiv = document.getElementById('import-results');
            resultsDiv.style.display = 'block';
            resultsDiv.innerHTML = `
                <div class="import-summary" style="padding: 15px; border-radius: 8px; ${results.errorCount > 0 ? 'background: rgba(220,53,69,0.1); border-left: 4px solid #dc3545;' : 'background: rgba(40,167,69,0.1); border-left: 4px solid #28a745;'}">
                    <h4>Import Results:</h4>
                    <p><strong style="color: #28a745;">✓ Successfully imported:</strong> ${results.successCount} product(s)</p>
                    ${results.errorCount > 0 ? `<p><strong style="color: #dc3545;">✗ Failed:</strong> ${results.errorCount} product(s)</p>` : ''}
                    ${results.errors.length > 0 ? `
                        <details style="margin-top: 10px;">
                            <summary style="cursor: pointer; color: #dc3545;">View Errors (${results.errors.length})</summary>
                            <ul style="margin-top: 10px; max-height: 200px; overflow-y: auto; padding-left: 20px;">
                                ${results.errors.map(err => `<li style="color: #dc3545; font-size: 12px; margin: 5px 0;">${Utils.escapeHtml(err)}</li>`).join('')}
                            </ul>
                        </details>
                    ` : ''}
                </div>
            `;
            
            // Reload products if any were imported
            if (results.successCount > 0) {
                if (AppState.currentSearchTerm) {
                    await DataService.searchProductsPaginated(AppState.currentSearchTerm, 1);
                } else {
                    await DataService.loadProductsPaginated(1);
                }
                
                // Close modal after 2.5 seconds
                setTimeout(() => {
                    UIManager.closeModal('excel-import-modal');
                    Utils.showNotification(`Successfully imported ${results.successCount} product(s)!`, 'success');
                }, 2500);
            } else {
                Utils.showNotification('No products were imported. Please check your file format and data.', 'error');
                // Re-enable buttons
                if (importBtn) importBtn.disabled = false;
                if (downloadBtn) downloadBtn.disabled = false;
            }
            
        } catch (error) {
            console.error('Import failed:', error);
            progressBar.style.width = '0%';
            statusText.textContent = 'Import failed!';
            Utils.showNotification('Import failed: ' + error.message, 'error');
            
            // Re-enable buttons
            if (importBtn) importBtn.disabled = false;
            if (downloadBtn) downloadBtn.disabled = false;
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // MOBILE MENU
    // ═══════════════════════════════════════════════════════════════════════
    
    setupMobileMenu() {
        const toggleBtn = document.getElementById('mobile-menu-toggle');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        
        if (toggleBtn && sidebar && overlay) {
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                sidebar.classList.toggle('active');
                overlay.classList.toggle('active');
            });
            
            overlay.addEventListener('click', () => {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
            });
            
            sidebar.addEventListener('click', (e) => {
                const clickedInteractive = e.target.closest('button') || 
                                          e.target.closest('a') || 
                                          e.target.closest('input') ||
                                          e.target.closest('select') ||
                                          e.target.closest('textarea');
                
                const clickedNavItem = e.target.closest('.nav-item');
                
                if (!clickedInteractive && !clickedNavItem) {
                    sidebar.classList.toggle('active');
                    overlay.classList.toggle('active');
                }
            });
            
            const sidebarHeader = sidebar.querySelector('.sidebar-header');
            if (sidebarHeader) {
                sidebarHeader.addEventListener('click', (e) => {
                    if (!e.target.closest('button') && !e.target.closest('a')) {
                        sidebar.classList.toggle('active');
                        overlay.classList.toggle('active');
                    }
                });
            }
            
            const sidebarFooter = sidebar.querySelector('.sidebar-footer');
            if (sidebarFooter) {
                sidebarFooter.addEventListener('click', (e) => {
                    if (!e.target.closest('button') && !e.target.closest('a')) {
                        sidebar.classList.toggle('active');
                        overlay.classList.toggle('active');
                    }
                });
            }
            
            sidebar.querySelectorAll('.nav-item').forEach(navItem => {
                navItem.addEventListener('click', () => {
                    sidebar.classList.remove('active');
                    overlay.classList.remove('active');
                });
            });
            
            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                    e.preventDefault();
                    sidebar.classList.toggle('active');
                    overlay.classList.toggle('active');
                }
            });
            
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && sidebar.classList.contains('active')) {
                    sidebar.classList.remove('active');
                    overlay.classList.remove('active');
                }
            });
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // INTERFACE TOGGLE
    // ═══════════════════════════════════════════════════════════════════════
    
    setupInterfaceToggle() {
        document.querySelectorAll('.logo-text, .sidebar-header h2, .app-title, [data-app-name]').forEach(element => {
            if (element.textContent.includes('Inventory') || element.dataset.appName === 'Inventory') {
                element.classList.add('interface-toggle');
                element.setAttribute('title', 'Click to switch: Computer Equipment & Electronics ↔ Office Supplies & Consumables');
                
                if (!element.querySelector('.database-indicator')) {
                    const dbIndicator = document.createElement('span');
                    dbIndicator.className = 'database-indicator interface1';
                    dbIndicator.id = 'database-indicator';
                    dbIndicator.textContent = 'Computer & Electronics';
                    element.appendChild(dbIndicator);
                }
                
                if (!element.querySelector('.interface-tooltip')) {
                    const tooltip = document.createElement('span');
                    tooltip.className = 'interface-tooltip';
                    tooltip.textContent = 'Click to switch: Computer Equipment & Electronics ↔ Office Supplies & Consumables';
                    element.appendChild(tooltip);
                }
                
                const newElement = element.cloneNode(true);
                element.parentNode.replaceChild(newElement, element);
                newElement.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.toggleInterface();
                });
            }
        });
        
        document.querySelectorAll('.logo, .app-logo, .brand').forEach(element => {
            if (!element.classList.contains('interface-toggle')) {
                element.style.cursor = 'pointer';
                element.setAttribute('title', 'Click to switch: Computer Equipment & Electronics ↔ Office Supplies & Consumables');
                const newElement = element.cloneNode(true);
                element.parentNode.replaceChild(newElement, element);
                newElement.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.toggleInterface();
                });
            }
        });
    },
    
    addInterfaceToggleButton() {
        const sidebarFooter = document.querySelector('.sidebar-footer');
        if (!sidebarFooter) return;
        
        const existingBtn = document.getElementById('interface-toggle-btn');
        if (existingBtn) existingBtn.remove();
        
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'interface-toggle-btn';
        toggleBtn.className = 'btn-inventory interface-switch-btn';
        toggleBtn.setAttribute('title', 'Click to switch: Computer Equipment & Electronics ↔ Office Supplies & Consumables');
        
        const isInterface1 = AppState.currentInterface === 'interface1';
        toggleBtn.innerHTML = `<i class="fas fa-exchange-alt"></i> Switch to ${isInterface1 ? 'Office Supplies' : 'Computer & Electronics'}`;
        
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleInterface();
        });
        
        const logoutBtn = sidebarFooter.querySelector('.btn-logout');
        if (logoutBtn) {
            sidebarFooter.insertBefore(toggleBtn, logoutBtn);
        } else {
            sidebarFooter.insertBefore(toggleBtn, sidebarFooter.firstChild);
        }
        
        this.interfaceToggleBtn = toggleBtn;
    },
    
    updateInterfaceToggleButton() {
        if (this.interfaceToggleBtn) {
            const isInterface1 = AppState.currentInterface === 'interface1';
            this.interfaceToggleBtn.innerHTML = `<i class="fas fa-exchange-alt"></i> Switch to ${isInterface1 ? 'Office Supplies' : 'Computer & Electronics'}`;
        }
    },
    
    toggleInterface() {
        AppState.saveCurrentState();
        
        AppState.currentInterface = AppState.currentInterface === 'interface1' ? 'interface2' : 'interface1';
        
        AppState.loadInterfaceState(AppState.currentInterface);
        UIManager.updateInterfaceIndicator();
        this.updateInterfaceToggleButton();
        
        const activeView = document.querySelector('.nav-item.active')?.dataset.view;
        if (activeView) {
            this.switchView(activeView);
        } else {
            DataService.loadDashboard();
        }
        
        Utils.showNotification(`Switched to ${AppState.getCurrentInterfaceLabel()}`, 'info');
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // STOCK MANAGEMENT HANDLERS
    // ═══════════════════════════════════════════════════════════════════════
    
    handleStockTypeChange() {
        const pid = AppState.selectedProductId;
        if (pid) {
            const product = AppState.products.find(p => p.id === pid);
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
        
        try {
            await DataService.adjustStock(
                AppState.selectedProductId,
                qty,
                type,
                document.getElementById('stock-reference')?.value?.trim(),
                document.getElementById('stock-notes')?.value?.trim()
            );
            this.clearStockForm();
        } catch (err) {
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
            DataService.renderMovementsTable(
                AppState.movements.filter(m => m.product_id === AppState.selectedProductId)
            );
        } else {
            DataService.renderMovementsTable(AppState.movements);
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // NAVIGATION & VIEWS
    // ═══════════════════════════════════════════════════════════════════════
    
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
                if (AppState.currentSearchTerm) {
                    DataService.searchProductsPaginated(AppState.currentSearchTerm, AppState.pagination.currentPage || 1);
                } else {
                    DataService.loadProductsPaginated(AppState.pagination.currentPage || 1);
                }
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
    
    // ═══════════════════════════════════════════════════════════════════════
    // PASSWORD MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════
    
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
            document.getElementById('password-form')?.reset();
        } catch (err) {
            Utils.showNotification(err.message || 'Password change failed', 'error');
        } finally {
            UIManager.hideLoading();
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // CRUD MODAL HANDLERS
    // ═══════════════════════════════════════════════════════════════════════
    
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
            name: document.getElementById('product-name')?.value?.trim(),
            sku: document.getElementById('product-sku')?.value?.trim(),
            description: document.getElementById('product-description')?.value?.trim(),
            category_id: document.getElementById('product-category')?.value ? parseInt(document.getElementById('product-category').value) : null,
            building_id: document.getElementById('product-building')?.value ? parseInt(document.getElementById('product-building').value) : null,
            stock_quantity: parseInt(document.getElementById('product-stock')?.value) || 0,
            assigned_to: document.getElementById('product-assigned')?.value?.trim() || null,
            condition: document.getElementById('product-condition')?.value?.trim() || PRODUCT_CONDITIONS.DEFAULT
        };
        
        try {
            await DataService.saveProduct(data, id ? parseInt(id) : null);
            UIManager.closeModal('product-modal');
            document.getElementById('product-form')?.reset();
        } catch (err) {
            Utils.showNotification(err.message || 'Failed to save product', 'error');
        }
    },
    
    async showCategoryModal(id = null) {
        if (id) {
            const supabase = window.getSupabaseClient();
            if (!supabase) {
                Utils.showNotification('Database unavailable', 'error');
                return;
            }
            
            const { data, error } = await supabase
                .from(TABLES.CATEGORIES)
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) {
                Utils.showNotification('Failed to load category', 'error');
                return;
            }
            
            document.getElementById('category-modal-title').textContent = 'Edit Category';
            document.getElementById('category-id').value = data.id;
            document.getElementById('category-name').value = data.name || '';
            document.getElementById('category-description').value = data.description || '';
        } else {
            document.getElementById('category-modal-title').textContent = 'Add Category';
            document.getElementById('category-id').value = '';
            document.getElementById('category-form')?.reset();
        }
        
        UIManager.openModal('category-modal');
    },
    
    async handleCategorySave(e) {
        e.preventDefault();
        const id = document.getElementById('category-id')?.value;
        
        const data = {
            name: document.getElementById('category-name')?.value?.trim(),
            description: document.getElementById('category-description')?.value?.trim()
        };
        
        try {
            await DataService.saveCategory(data, id ? parseInt(id) : null);
            UIManager.closeModal('category-modal');
            document.getElementById('category-form')?.reset();
        } catch (err) {
            Utils.showNotification(err.message || 'Failed to save category', 'error');
        }
    },
    
    async showBuildingModal(id = null) {
        if (id) {
            const supabase = window.getSupabaseClient();
            if (!supabase) {
                Utils.showNotification('Database unavailable', 'error');
                return;
            }
            
            const { data, error } = await supabase
                .from(TABLES.BUILDINGS)
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) {
                Utils.showNotification('Failed to load building', 'error');
                return;
            }
            
            document.getElementById('building-modal-title').textContent = 'Edit Building';
            document.getElementById('building-id').value = data.id;
            document.getElementById('building-name').value = data.name || '';
            document.getElementById('building-address').value = data.location_address || '';
        } else {
            document.getElementById('building-modal-title').textContent = 'Add Building';
            document.getElementById('building-id').value = '';
            document.getElementById('building-form')?.reset();
        }
        
        UIManager.openModal('building-modal');
    },
    
    async handleBuildingSave(e) {
        e.preventDefault();
        const id = document.getElementById('building-id')?.value;
        
        const data = {
            name: document.getElementById('building-name')?.value?.trim(),
            location_address: document.getElementById('building-address')?.value?.trim()
        };
        
        try {
            await DataService.saveBuilding(data, id ? parseInt(id) : null);
            UIManager.closeModal('building-modal');
            document.getElementById('building-form')?.reset();
        } catch (err) {
            Utils.showNotification(err.message || 'Failed to save building', 'error');
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // DELETE HANDLERS
    // ═══════════════════════════════════════════════════════════════════════
    
    async deleteProduct(id) {
        await DataService.deleteProduct(id);
    },
    
    async deleteCategory(id) {
        await DataService.deleteCategory(id);
    },
    
    async deleteBuilding(id) {
        await DataService.deleteBuilding(id);
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // REPORTS
    // ═══════════════════════════════════════════════════════════════════════
    
    async showReport(type) {
        const results = document.getElementById('report-results');
        const title = document.getElementById('report-title');
        
        if (!results || !title) return;
        
        results.style.display = 'block';
        title.textContent = {
            'stock-summary': 'Stock Summary',
            'category-analysis': 'Category Analysis',
            'building-analysis': 'Building Analysis',
            'movement-history': 'Movement History'
        }[type] || 'Report';
        
        try {
            await DataService.generateReport(type);
            results.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (err) {
            const content = document.getElementById('report-content');
            if (content) {
                content.innerHTML = `<p style="color:var(--danger);text-align:center;padding:20px">Report generation failed: ${err.message}</p>`;
            }
        }
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

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
window.toggleInterface = () => App.toggleInterface();
window.goToPage = (page) => DataService.goToPage(page);
window.changeItemsPerPage = (value) => DataService.changeItemsPerPage(value);

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => App.init());
