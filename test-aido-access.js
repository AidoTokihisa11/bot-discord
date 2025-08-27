import AccessRestriction from './src/utils/AccessRestriction.js';

// Test de l'accès d'AidoTokihisa
console.log('🧪 Test des restrictions d\'accès pour AidoTokihisa');

const accessRestriction = new AccessRestriction();

// Simulation d'un utilisateur AidoTokihisa
const mockInteractionAido = {
    user: {
        id: '421245210220298240',
        tag: 'AidoTokihisa',
        username: 'AidoTokihisa'
    },
    member: {
        roles: {
            cache: new Map([
                ['1388265895264129157', { id: '1388265895264129157', name: 'Role1' }]
            ])
        }
    }
};

// Test de checkAccess
console.log('\n📋 Test checkAccess pour AidoTokihisa:');
accessRestriction.checkAccess(mockInteractionAido).then(result => {
    console.log(`✅ Résultat checkAccess: ${result ? 'AUTORISÉ' : 'BLOQUÉ'}`);
}).catch(err => {
    console.error('❌ Erreur:', err);
});

// Test de checkUserAccess
console.log('\n📋 Test checkUserAccess pour AidoTokihisa:');
accessRestriction.checkUserAccess(mockInteractionAido.user, mockInteractionAido.member).then(result => {
    console.log(`✅ Résultat checkUserAccess: ${result ? 'AUTORISÉ' : 'BLOQUÉ'}`);
}).catch(err => {
    console.error('❌ Erreur:', err);
});

console.log('\n🔍 Tests terminés');
