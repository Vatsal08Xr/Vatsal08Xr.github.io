// JavaScript to handle loading screen and interactions
document.addEventListener('DOMContentLoaded', function() {
    // Hide loading screen after page loads
    setTimeout(function() {
        document.getElementById('loadingScreen').classList.add('hidden');
    }, 1500);
    
    // Button click handlers
    document.getElementById('singleSongBtn').addEventListener('click', function() {
        showNotification('Single song conversion feature coming soon!', 'info');
    });
    
    document.getElementById('playlistBtn').addEventListener('click', function() {
        showNotification('Playlist conversion feature coming soon!', 'info');
    });
    
    // Notify button handler
    document.getElementById('notifyBtn').addEventListener('click', function() {
        const email = document.getElementById('emailInput').value;
        if (validateEmail(email)) {
            showNotification('Thanks! We\'ll notify you when playlist conversion is available.', 'success');
            document.getElementById('emailInput').value = '';
        } else {
            showNotification('Please enter a valid email address.', 'error');
        }
    });
    
    // Email validation function
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    // Show notification function
    function showNotification(message, type) {
        // Remove existing notification if any
        const existingNotification = document.querySelector('.notification-toast');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification-toast notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add styles for notification
        const notificationStyles = `
            <style>
                .notification-toast {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: rgba(30, 30, 30, 0.9);
                    color: white;
                    padding: 15px 20px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 15px;
                    max-width: 400px;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                    z-index: 1000;
                    animation: slideInRight 0.3s ease;
                    border-left: 4px solid #1DB954;
                    backdrop-filter: blur(10px);
                }
                
                .notification-error {
                    border-left-color: #FF0000;
                }
                
                .notification-info {
                    border-left-color: #4A4AFF;
                }
                
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .notification-close {
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    font-size: 1rem;
                    opacity: 0.7;
                    transition: opacity 0.3s;
                }
                
                .notification-close:hover {
                    opacity: 1;
                }
                
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            </style>
        `;
        
        // Add styles if not already added
        if (!document.querySelector('#notification-styles')) {
            const styleElement = document.createElement('style');
            styleElement.id = 'notification-styles';
            styleElement.textContent = notificationStyles;
            document.head.appendChild(styleElement);
        }
        
        // Add notification to page
        document.body.appendChild(notification);
        
        // Add close button functionality
        notification.querySelector('.notification-close').addEventListener('click', function() {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 5000);
    }
    
    // Add animation to elements when they come into view
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);
    
    // Observe all sections for animation
    document.querySelectorAll('section').forEach(section => {
        observer.observe(section);
    });
});
