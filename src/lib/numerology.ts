/**
 * Calculates the Destiny number based on a birth date string (YYYY-MM-DD).
 * The Destiny number is calculated by summing all digits of the birth date 
 * until a single digit (1-9) or a master number (11, 22) is reached.
 */
export const calculateDestinyNumber = (birthDate: string): number => {
    if (!birthDate) return 0;

    // Remove hyphens and sum digits
    const digits = birthDate.replace(/-/g, '').split('').map(Number);
    let sum = digits.reduce((acc, digit) => acc + digit, 0);

    // Function to reduce sum to a single digit, preserving 11 and 22
    const reduce = (num: number): number => {
        if (num <= 9 || num === 11 || num === 22) return num;
        const nextSum = num.toString().split('').map(Number).reduce((acc, digit) => acc + digit, 0);
        return reduce(nextSum);
    };

    return reduce(sum);
};

/**
 * Gets the meaning of a Destiny number.
 */
export const getDestinyMeaning = (num: number): string => {
    const meanings: Record<number, string> = {
        1: "Liderança e Independência",
        2: "Diplomacia e Cooperação",
        3: "Expressão e Criatividade",
        4: "Trabalho e Estabilidade",
        5: "Liberdade e Mudança",
        6: "Responsabilidade e Amor",
        7: "Conhecimento e Introspecção",
        8: "Poder e Realização",
        9: "Humanitarismo e Conclusão",
        11: "Iluminação e Intuição",
        22: "Mestre Construtor e Realização"
    };

    return meanings[num] || "Mistério Cósmico";
};
