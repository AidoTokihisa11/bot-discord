// Test de la syntaxe du TicketManager
try {
    const TicketManager = await import('./src/managers/TicketManager.js');
    console.log('✅ Syntaxe correcte');
} catch (error) {
    console.error('❌ Erreur de syntaxe:', error.message);
    console.error('Stack:', error.stack);
}
