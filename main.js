// Utility functions for encryption/decryption (for demonstration purposes only)
const encryptData = (data) => {
    return btoa(JSON.stringify(data));
};

const decryptData = (encryptedData) => {
    try {
        return JSON.parse(atob(encryptedData));
    } catch (error) {
        console.error('Decryption failed:', error);
        return null;
    }
};

// Password generator function
const generatePassword = (length = 16) => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let password = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }
    return password;
};

// User authentication functions
const registerUser = (email, password) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Check if user already exists
    if (users.some(user => user.email === email)) {
        throw new Error('User already exists');
    }

    users.push({
        email,
        password: encryptData(password),
        id: Date.now().toString()
    });

    localStorage.setItem('users', JSON.stringify(users));
};

const loginUser = (email, password) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email);

    if (!user || decryptData(user.password) !== password) {
        throw new Error('Invalid email or password');
    }

    // Set session
    sessionStorage.setItem('currentUser', user.id);
    return user;
};

const checkAuth = () => {
    const currentUser = sessionStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = 'index.html';
    }
    return currentUser;
};

const logout = () => {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'index.html';
};

// Password management functions
const savePassword = (data) => {
    const userId = checkAuth();
    const passwords = JSON.parse(localStorage.getItem(`passwords_${userId}`) || '[]');
    
    const newPassword = {
        id: data.id || Date.now().toString(),
        ...data,
        password: encryptData(data.password)
    };

    if (data.id) {
        // Update existing password
        const index = passwords.findIndex(p => p.id === data.id);
        if (index !== -1) {
            passwords[index] = newPassword;
        }
    } else {
        // Add new password
        passwords.push(newPassword);
    }

    localStorage.setItem(`passwords_${userId}`, JSON.stringify(passwords));
    return newPassword;
};

const getPasswords = () => {
    const userId = checkAuth();
    return JSON.parse(localStorage.getItem(`passwords_${userId}`) || '[]');
};

const deletePassword = (id) => {
    const userId = checkAuth();
    const passwords = getPasswords();
    const updatedPasswords = passwords.filter(p => p.id !== id);
    localStorage.setItem(`passwords_${userId}`, JSON.stringify(updatedPasswords));
};

// UI Helper functions
const updatePasswordList = (passwords = null) => {
    const passwordList = document.getElementById('passwordList');
    const emptyState = document.getElementById('emptyState');
    
    if (!passwordList) return;

    passwords = passwords || getPasswords();

    if (passwords.length === 0) {
        passwordList.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    passwordList.innerHTML = passwords.map(entry => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <i class="fas fa-globe text-gray-400 mr-2"></i>
                    <div>
                        <div class="text-sm font-medium text-gray-900">${entry.serviceName}</div>
                        ${entry.url ? `<div class="text-sm text-gray-500">${entry.url}</div>` : ''}
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${entry.username}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center space-x-2">
                    <input type="password" 
                           value="${decryptData(entry.password)}" 
                           readonly
                           class="bg-transparent border-none text-sm text-gray-900 focus:outline-none"
                           id="password_${entry.id}">
                    <button onclick="togglePasswordVisibility('${entry.id}')" 
                            class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="copyToClipboard('${entry.id}')" 
                            class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="editPassword('${entry.id}')" 
                        class="text-blue-600 hover:text-blue-900 mr-3">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deletePasswordEntry('${entry.id}')" 
                        class="text-red-600 hover:text-red-900">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
};

// UI Event handlers
const togglePasswordVisibility = (id) => {
    const passwordInput = document.getElementById(`password_${id}`);
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        setTimeout(() => {
            passwordInput.type = 'password';
        }, 3000); // Hide password after 3 seconds
    }
};

const copyToClipboard = async (id) => {
    const passwordInput = document.getElementById(`password_${id}`);
    try {
        await navigator.clipboard.writeText(passwordInput.value);
        // Show a temporary success message
        const button = passwordInput.nextElementSibling.nextElementSibling;
        const originalIcon = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check text-green-500"></i>';
        setTimeout(() => {
            button.innerHTML = originalIcon;
        }, 2000);
    } catch (err) {
        console.error('Failed to copy password:', err);
    }
};

const editPassword = (id) => {
    const passwords = getPasswords();
    const password = passwords.find(p => p.id === id);
    if (!password) return;

    const modal = document.getElementById('passwordModal');
    const form = document.getElementById('passwordForm');
    const title = document.getElementById('modalTitle');

    title.textContent = 'Edit Password';
    form.setAttribute('data-id', id);
    
    document.getElementById('serviceName').value = password.serviceName;
    document.getElementById('username').value = password.username;
    document.getElementById('passwordInput').value = decryptData(password.password);
    document.getElementById('url').value = password.url || '';
    document.getElementById('notes').value = password.notes || '';

    modal.classList.remove('hidden');
};

const deletePasswordEntry = (id) => {
    if (confirm('Are you sure you want to delete this password?')) {
        deletePassword(id);
        updatePasswordList();
    }
};

// Page-specific initialization
const initializePage = () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    switch (currentPage) {
        case 'index.html':
            initializeLoginPage();
            break;
        case 'register.html':
            initializeRegisterPage();
            break;
        case 'dashboard.html':
            initializeDashboardPage();
            break;
    }
};

// Login page initialization
const initializeLoginPage = () => {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('errorMessage');

        try {
            loginUser(email, password);
            window.location.href = 'dashboard.html';
        } catch (error) {
            errorMessage.textContent = error.message;
            errorMessage.classList.remove('hidden');
        }
    });
};

// Register page initialization
const initializeRegisterPage = () => {
    const registerForm = document.getElementById('registerForm');
    if (!registerForm) return;

    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const errorMessage = document.getElementById('errorMessage');

        if (password !== confirmPassword) {
            errorMessage.textContent = 'Passwords do not match';
            errorMessage.classList.remove('hidden');
            return;
        }

        try {
            registerUser(email, password);
            window.location.href = 'index.html';
        } catch (error) {
            errorMessage.textContent = error.message;
            errorMessage.classList.remove('hidden');
        }
    });
};

// Dashboard page initialization
const initializeDashboardPage = () => {
    checkAuth();

    const searchInput = document.getElementById('searchInput');
    const modal = document.getElementById('passwordModal');
    const passwordForm = document.getElementById('passwordForm');
    const addNewBtn = document.getElementById('addNewBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const generatePasswordBtn = document.getElementById('generatePasswordBtn');
    const togglePasswordBtn = document.getElementById('togglePasswordBtn');

    // Initialize password list
    updatePasswordList();

    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const passwords = getPasswords();
            const filteredPasswords = passwords.filter(p => 
                p.serviceName.toLowerCase().includes(searchTerm) ||
                p.username.toLowerCase().includes(searchTerm) ||
                (p.url && p.url.toLowerCase().includes(searchTerm))
            );
            updatePasswordList(filteredPasswords);
        });
    }

    // Modal controls
    if (addNewBtn) {
        addNewBtn.addEventListener('click', () => {
            passwordForm.reset();
            passwordForm.removeAttribute('data-id');
            document.getElementById('modalTitle').textContent = 'Add New Password';
            modal.classList.remove('hidden');
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
    }

    // Password form submission
    if (passwordForm) {
        passwordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = {
                serviceName: document.getElementById('serviceName').value,
                username: document.getElementById('username').value,
                password: document.getElementById('passwordInput').value,
                url: document.getElementById('url').value,
                notes: document.getElementById('notes').value
            };

            const id = passwordForm.getAttribute('data-id');
            if (id) {
                formData.id = id;
            }

            savePassword(formData);
            modal.classList.add('hidden');
            updatePasswordList();
        });
    }

    // Password generation
    if (generatePasswordBtn) {
        generatePasswordBtn.addEventListener('click', () => {
            const passwordInput = document.getElementById('passwordInput');
            passwordInput.value = generatePassword();
            passwordInput.type = 'text';
            setTimeout(() => {
                passwordInput.type = 'password';
            }, 3000);
        });
    }

    // Toggle password visibility in form
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', () => {
            const passwordInput = document.getElementById('passwordInput');
            const icon = togglePasswordBtn.querySelector('i');
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    }

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
};

// Initialize the current page
document.addEventListener('DOMContentLoaded', initializePage);
