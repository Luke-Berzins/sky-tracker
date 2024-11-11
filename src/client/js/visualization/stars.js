
// src/client/js/visualization/stars.js
export function createStars() {
    const stars = document.querySelector('.stars');
    for (let i = 0; i < 200; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.width = Math.random() * 3 + 'px';
        star.style.height = star.style.width;
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 3 + 's';
        stars.appendChild(star);
    }
}

export function createMeteor() {
    const meteor = document.createElement('div');
    meteor.className = 'meteor';
    meteor.style.top = Math.random() * 50 + '%';
    meteor.style.left = '100%';
    meteor.style.animation = 'meteor 1s linear forwards';
    document.querySelector('.sky-container').appendChild(meteor);
    setTimeout(() => meteor.remove(), 1000);
}
