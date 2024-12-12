import { API_ENDPOINT } from './constants';

const generateUserId = () => {
    let userId = localStorage.getItem('user_id');
    if (!userId) {
        userId = 'user_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('user_id', userId);
    }
    return userId;
};

export const recordVisit = async () => {
    try {
        const userId = generateUserId();
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            mode: 'cors',
            credentials: 'omit',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Origin': window.location.origin
            },
            body: JSON.stringify({
                user_id: userId
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to record visit: ${response.status} - ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error recording visit:', error);
        // Don't throw the error to prevent app initialization from failing
    }
};
