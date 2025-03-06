// direct-clouds.js - Emergency cloud injection
document.addEventListener('DOMContentLoaded', () => {
    console.log('Directly adding clouds to fix visibility issues...');
    
    // Create clouds that are guaranteed to be visible
    setTimeout(() => {
        // Create container for floating clouds
        const cloudContainer = document.createElement('div');
        cloudContainer.id = 'direct-clouds';
        cloudContainer.style.position = 'fixed';
        cloudContainer.style.top = '0';
        cloudContainer.style.left = '0';
        cloudContainer.style.width = '100%';
        cloudContainer.style.height = '100%';
        cloudContainer.style.zIndex = '1000';
        cloudContainer.style.pointerEvents = 'none';
        
        // Create two rows of clouds
        const topClouds = document.createElement('div');
        topClouds.style.position = 'absolute';
        topClouds.style.top = '20%';
        topClouds.style.width = '100%';
        topClouds.style.textAlign = 'center';
        topClouds.style.fontSize = '48px';
        topClouds.textContent = '';
        topClouds.style.animation = 'moveCloudsRight 60s linear infinite';
        
        const bottomClouds = document.createElement('div');
        bottomClouds.style.position = 'absolute';
        bottomClouds.style.top = '40%';
        bottomClouds.style.width = '100%';
        bottomClouds.style.textAlign = 'center';
        bottomClouds.style.fontSize = '36px';
        bottomClouds.textContent = '';
        bottomClouds.style.animation = 'moveCloudsLeft 50s linear infinite';
        
        // Add animation style
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            @keyframes moveCloudsRight {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
            @keyframes moveCloudsLeft {
                0% { transform: translateX(100%); }
                100% { transform: translateX(-100%); }
            }
        `;
        document.head.appendChild(styleElement);
        
        // Add clouds to container
        cloudContainer.appendChild(topClouds);
        cloudContainer.appendChild(bottomClouds);
        
        // Add container to body
        document.body.appendChild(cloudContainer);
        
        // Add debug info
        const debugInfo = document.createElement('div');
        debugInfo.style.position = 'fixed';
        debugInfo.style.bottom = '10px';
        debugInfo.style.right = '10px';
        debugInfo.style.background = 'rgba(0,0,0,0.7)';
        debugInfo.style.color = 'white';
        debugInfo.style.padding = '10px';
        debugInfo.style.zIndex = '2000';
        debugInfo.style.fontSize = '12px';
        debugInfo.innerHTML = 'CLOUDS ACTIVE<br>Direct injection mode';
        document.body.appendChild(debugInfo);
        
        console.log('Direct clouds added successfully!');
    }, 1000);
});