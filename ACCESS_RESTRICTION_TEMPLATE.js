// Template pour intégrer AccessRestriction dans toutes les commandes

// À ajouter en haut du fichier (après les imports existants) :
import AccessRestriction from '../../utils/AccessRestriction.js';

// À ajouter au début de la fonction execute :
export async function execute(interaction, client) {
    // === VÉRIFICATION D'ACCÈS GLOBALE ===
    const accessRestriction = new AccessRestriction();
    const hasAccess = await accessRestriction.checkAccess(interaction);
    if (!hasAccess) {
        return; // Accès refusé, message déjà envoyé
    }

    // ... reste du code existant
}
