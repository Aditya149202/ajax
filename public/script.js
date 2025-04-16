document.addEventListener('DOMContentLoaded', function() {
    const registrationForm = document.getElementById('registrationForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const collegeInput = document.getElementById('college');
    const collegeList = document.getElementById('collegeList');
    const usernameMessage = document.getElementById('usernameMessage');
    const passwordMessage = document.getElementById('passwordMessage');
    const successMessage = document.getElementById('successMessage');
    
    // Check username availability
    usernameInput.addEventListener('blur', function() {
        const username = this.value.trim();
        if (username) {
            checkUsername(username);
        } else {
            usernameMessage.textContent = '';
            usernameMessage.className = 'message';
        }
    });
    
    // Password validation
    confirmPasswordInput.addEventListener('input', function() {
        if (passwordInput.value !== this.value) {
            passwordMessage.textContent = 'Passwords do not match';
            passwordMessage.className = 'message error';
        } else {
            passwordMessage.textContent = 'Passwords match';
            passwordMessage.className = 'message success';
        }
    });
    
    // College autocomplete
    collegeInput.addEventListener('input', function() {
        const query = this.value.trim();
        if (query.length > 1) {
            getCollegeSuggestions(query);
        } else {
            collegeList.style.display = 'none';
        }
    });
    
    // Form submission
    registrationForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validate passwords match
        if (passwordInput.value !== confirmPasswordInput.value) {
            passwordMessage.textContent = 'Passwords do not match';
            passwordMessage.className = 'message error';
            return;
        }
        
        // Submit form via AJAX
        registerUser();
    });
    
    function checkUsername(username) {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/check-username', true);
        xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
        
        xhr.onload = function() {
            if (this.status === 200) {
                const response = JSON.parse(this.responseText);
                if (response.available) {
                    usernameMessage.textContent = 'Username is available';
                    usernameMessage.className = 'message success';
                } else {
                    usernameMessage.textContent = 'Username is already taken';
                    usernameMessage.className = 'message error';
                }
            }
        };
        
        xhr.send(JSON.stringify({ username }));
    }
    
    function getCollegeSuggestions(query) {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `/api/colleges?q=${encodeURIComponent(query)}`, true);
        
        xhr.onload = function() {
            if (this.status === 200) {
                const colleges = JSON.parse(this.responseText);
                displayCollegeSuggestions(colleges);
            }
        };
        
        xhr.send();
    }
    
    function displayCollegeSuggestions(colleges) {
        collegeList.innerHTML = '';
        
        if (colleges.length > 0) {
            colleges.forEach(function(college) {
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                div.textContent = college;
                div.addEventListener('click', function() {
                    collegeInput.value = college;
                    collegeList.style.display = 'none';
                });
                collegeList.appendChild(div);
            });
            collegeList.style.display = 'block';
        } else {
            collegeList.style.display = 'none';
        }
    }
    
    function registerUser() {
        const formData = {
            name: document.getElementById('name').value,
            college: collegeInput.value,
            username: usernameInput.value,
            password: passwordInput.value,
            confirmPassword: confirmPasswordInput.value
        };
        
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/register', true);
        xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
        
        xhr.onload = function() {
            if (this.status === 200) {
                try {
                    const response = JSON.parse(this.responseText);
                    if (response.success) {
                        successMessage.textContent = 'Successfully Registered!';
                        successMessage.style.display = 'block';
                        registrationForm.reset();
                        usernameMessage.textContent = '';
                        passwordMessage.textContent = '';
                    } else {
                        alert(response.message || 'Registration failed');
                    }
                } catch (e) {
                    alert('An error occurred. Please try again.');
                }
            }
        };
        
        xhr.send(JSON.stringify(formData));
    }
});