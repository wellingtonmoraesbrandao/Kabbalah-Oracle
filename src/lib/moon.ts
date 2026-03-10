/**
 * Simple moon phase calculation.
 * Returns the phase name and a mystical description.
 */
export const getMoonPhase = (date: Date = new Date()) => {
    // Reference: Jan 6, 2000 was a New Moon
    const referenceDate = new Date(2000, 0, 6, 18, 14, 0);
    const synodicMonth = 29.53058867;

    const diffMs = date.getTime() - referenceDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    const phasePercent = (diffDays % synodicMonth) / synodicMonth;

    // Normalize percentage
    const normalizedPhase = phasePercent < 0 ? phasePercent + 1 : phasePercent;

    if (normalizedPhase < 0.03 || normalizedPhase > 0.97) {
        return {
            name: 'Nova',
            desc: 'Tempo de semear e novos começos',
            phase: 0
        };
    } else if (normalizedPhase < 0.47) {
        return {
            name: 'Crescente',
            desc: 'Tempo de expansão e foco',
            phase: 0.25
        };
    } else if (normalizedPhase < 0.53) {
        return {
            name: 'Cheia',
            desc: 'Tempo de colheita e celebração',
            phase: 0.5
        };
    } else {
        return {
            name: 'Minguante',
            desc: 'Tempo de desapego e limpeza',
            phase: 0.75
        };
    }
};
