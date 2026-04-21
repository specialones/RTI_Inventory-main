/**
Inventory Pro - Configuration Module
Senior Developer Pattern: Immutable, Environment-Ready, Centralized
*/
'use strict';
// Supabase Configuration (Use env vars in production)
const SUPABASE_CONFIG = Object.freeze({
URL: 'https://gawfomcajlzvcslzfwiu.supabase.co',
ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdhd2ZvbWNhamx6dmNzbHpmd2l1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNTA5MDksImV4cCI6MjA5MDYyNjkwOX0.Rlrtel3bEqwpGpWS5_-1gLV0ZUrlN3Fvgalgc3cJB7s'
});
// Database Table Names (Single Source of Truth)
const TABLES = Object.freeze({
USERS: 'users',
CATEGORIES: 'categories',
BUILDINGS: 'buildings',
PRODUCTS: 'products',
MOVEMENTS: 'movements',
PRODUCT_DETAILS: 'product_details'
});
// Product Condition Constants
const PRODUCT_CONDITIONS = Object.freeze({
WORKING_ASSIGNED: 'Working - assigned',
WORKING_STORAGE: 'Working - in storage',
DEFECTIVE: 'Defective',
DAMAGED: 'Damaged',
OPTIONS: ['Working - assigned', 'Working - in storage', 'Defective', 'Damaged'],
DEFAULT: 'Working - in storage',
// Color codes for UI
COLORS: {
'Working - assigned': '#28a745',
'Working - in storage': '#17a2b8',
'Defective': '#ffc107',
'Damaged': '#dc3545'
}
});
// Application Constants
const AppConfig = Object.freeze({
MIN_PASSWORD_LENGTH: 6,
DEFAULT_REORDER_LEVEL: 10,
SESSION_KEY: 'inventory_session',
DATE_FORMAT: { year: 'numeric', month: 'long', day: 'numeric' },
MOVEMENT_TYPES: { IN: 'IN', OUT: 'OUT' },
STATUS: { OK: 'OK', LOW: 'LOW' },
MIN_ID: 1,
MAX_ID: 1000
});
// Supabase Client Management
let supabaseClient = null;
function initializeSupabase() {
if (!window.supabase) {
console.error('Supabase library not loaded');
return null;
}
try {
supabaseClient = window.supabase.createClient(
SUPABASE_CONFIG.URL,
SUPABASE_CONFIG.ANON_KEY,
{
auth: {
autoRefreshToken: true,
persistSession: true,
detectSessionInUrl: false
}
}
);
return supabaseClient;
} catch (error) {
console.error('Supabase init failed:', error);
return null;
}
}
// Public API
window.AppConfig = AppConfig;
window.TABLES = TABLES;
window.PRODUCT_CONDITIONS = PRODUCT_CONDITIONS;
window.getSupabaseClient = () => supabaseClient;
window.initializeSupabase = initializeSupabase;
// Auto-initialize
document.addEventListener('DOMContentLoaded', initializeSupabase);