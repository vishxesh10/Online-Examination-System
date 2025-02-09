document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const button = e.target.querySelector('button');
            button.setAttribute('data-original-text', button.innerHTML);
            setLoading(button, true);
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('userDB.json');
                const data = await response.json();
                
                const user = data.users.find(u => u.username === username && u.password === password);

                if (user) {
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    if (user.role === 'admin') {
                        window.location.href = 'admin-dashboard.html';
                    } else {
                        window.location.href = 'questionWindow.html';
                    }
                } else {
                    showError('Invalid credentials');
                }
            } catch (error) {
                console.error('Error:', error);
                showError('Something went wrong. Please try again.');
            } finally {
                setLoading(button, false);
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('newUsername').value;
            const password = document.getElementById('newPassword').value;
            const role = document.getElementById('role').value;

            // In a real application, you would make an API call to add the user
            showSuccess('Account created successfully! Please login.');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        });
    }
});

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    const form = document.querySelector('form');
    form.insertBefore(errorDiv, form.firstChild);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    const form = document.querySelector('form');
    form.insertBefore(successDiv, form.firstChild);
}

// Add loading state to buttons
function setLoading(button, isLoading) {
    if (isLoading) {
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        button.disabled = true;
    } else {
        button.innerHTML = button.getAttribute('data-original-text');
        button.disabled = false;
    }
}

function checkSession() {
    const lastActivity = localStorage.getItem('lastActivity');
    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    
    if (lastActivity && Date.now() - parseInt(lastActivity) > SESSION_TIMEOUT) {
        localStorage.clear();
        window.location.href = 'login.html?timeout=true';
    }
    
    localStorage.setItem('lastActivity', Date.now());
}

// Add to each protected page
document.addEventListener('DOMContentLoaded', checkSession);
document.addEventListener('click', checkSession);
