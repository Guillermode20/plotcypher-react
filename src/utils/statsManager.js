const STATS_KEY = 'plotcypher_stats';

const defaultStats = {
    categories: {
        game: { completed: 0, attempts: 0, totalAttempts: 0 },
        movie: { completed: 0, attempts: 0, totalAttempts: 0 },
        tv: { completed: 0, attempts: 0, totalAttempts: 0 }
    },
    lastUpdated: null
};

export const getStats = () => {
    const stats = localStorage.getItem(STATS_KEY);
    return stats ? JSON.parse(stats) : defaultStats;
};

export const updateStats = (category, isWin, attempts) => {
    const stats = getStats();
    const categoryStats = stats.categories[category];

    categoryStats.attempts++;
    if (isWin) {
        categoryStats.completed++;
        categoryStats.totalAttempts += attempts;
    }

    stats.lastUpdated = new Date().toISOString();
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
};

export const calculateStats = () => {
    const stats = getStats();
    const calculated = {};

    Object.entries(stats.categories).forEach(([category, data]) => {
        calculated[category] = {
            gamesPlayed: data.attempts,
            gamesCompleted: data.completed,
            successRate: data.attempts ? ((data.completed / data.attempts) * 100).toFixed(1) : 0,
            averageAttempts: data.completed ? (data.totalAttempts / data.completed).toFixed(1) : 0
        };
    });

    return calculated;
};

export const resetStats = () => {
    localStorage.setItem(STATS_KEY, JSON.stringify(defaultStats));
};