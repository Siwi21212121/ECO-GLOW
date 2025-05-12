const firebaseConfig = {
    apiKey: "AIzaSyCdHG9stEGsuR_jh5pzCGxt_vNEZyvRbUo",
    authDomain: "timepass-a7f88.firebaseapp.com",
    projectId: "timepass-a7f88",
    storageBucket: "timepass-a7f88.firebasestorage.app",
    messagingSenderId: "129854315522",
    appId: "1:129854315522:web:c9de1b24221d728d7a1b1b",
    measurementId: "G-D9LRGTSCDS"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// DOM Elements
const mobileMenuButton = document.getElementById('mobile-menu-button');
const mobileMenu = document.getElementById('mobile-menu');

// Mobile menu toggle
if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });
}

// Leaf animation
function createLeaf() {
    const leaf = document.createElement("div");
    leaf.classList.add("leaf");
    leaf.style.left = Math.random() * 100 + "vw";
    leaf.style.animationDuration = Math.random() * 5 + 5 + "s";
    document.body.appendChild(leaf);
    setTimeout(() => { leaf.remove(); }, 10000);
}

// Create leaves at intervals
setInterval(createLeaf, 2000);

// GSAP Animations (if on homepage)
if (document.querySelector('.hero-title')) {
    // Initialize GSAP ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // Hero section animations
    gsap.from('.hero-title', {
        opacity: 0,
        y: 50,
        duration: 1,
        ease: 'power3.out'
    });

    gsap.from('.hero-subtitle', {
        opacity: 0,
        y: 30,
        duration: 1,
        delay: 0.3,
        ease: 'power3.out'
    });

    gsap.from('.btn-primary, .btn-secondary', {
        opacity: 0,
        y: 20,
        duration: 0.8,
        delay: 0.6,
        stagger: 0.2,
        ease: 'power3.out'
    });

    gsap.from('.hero-image', {
        opacity: 0,
        x: 100,
        duration: 1,
        delay: 0.3,
        ease: 'power3.out'
    });

    // Section animations with ScrollTrigger
    gsap.utils.toArray('.section-intro').forEach(section => {
        gsap.from(section, {
            scrollTrigger: {
                trigger: section,
                start: 'top 80%',
                toggleActions: 'play none none none'
            },
            opacity: 0,
            y: 50,
            duration: 1,
            ease: 'power3.out'
        });
    });

    gsap.utils.toArray('.feature-card').forEach((card, i) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            opacity: 0,
            y: 50,
            duration: 0.6,
            delay: i * 0.1,
            ease: 'power3.out'
        });
    });

    // Timeline animations
    gsap.utils.toArray('.timeline-item').forEach((item, i) => {
        gsap.from(item, {
            scrollTrigger: {
                trigger: item,
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            opacity: 0,
            x: -50,
            duration: 0.6,
            delay: i * 0.2,
            ease: 'power3.out'
        });
    });
}

// Authentication state observer
firebase.auth().onAuthStateChanged((user) => {
    // Get all login buttons in the navbar (desktop and mobile)
    const loginButtons = document.querySelectorAll('a[href="login.html"]');
    
    if (user) {
        // User is signed in
        console.log('User is signed in:', user.displayName);
        
        // Replace login buttons with user info and logout
        loginButtons.forEach(button => {
            const parentElement = button.parentElement;
            
            // Create user dropdown container
            const userContainer = document.createElement('div');
            userContainer.className = button.className.includes('rounded-full') 
                ? 'relative group bg-white text-green-700 px-4 py-2 rounded-full hover:bg-green-100 transition-all cursor-pointer flex items-center'
                : 'relative group cursor-pointer';
            
            // Create user display
            const userDisplay = document.createElement('div');
            userDisplay.className = 'flex items-center';
            userDisplay.innerHTML = `
                <i class="fas fa-user-circle mr-2"></i>
                <span>${user.displayName || user.email.split('@')[0]}</span>
                <i class="fas fa-chevron-down ml-2 text-sm"></i>
            `;
            
            // Create dropdown
            const dropdown = document.createElement('div');
            dropdown.className = 'absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 hidden group-hover:block';
            dropdown.innerHTML = `
                <a href="#" id="logout-btn" class="block px-4 py-2 text-gray-700 hover:bg-green-100">
                    <i class="fas fa-sign-out-alt mr-2"></i> Logout
                </a>
            `;
            
            // Add to DOM
            userContainer.appendChild(userDisplay);
            userContainer.appendChild(dropdown);
            parentElement.replaceChild(userContainer, button);
            
            // Add event listener to logout button
            const logoutBtn = dropdown.querySelector('#logout-btn');
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                firebase.auth().signOut().then(() => {
                    console.log('User signed out');
                    window.location.reload();
                }).catch((error) => {
                    console.error('Sign out error:', error);
                });
            });
        });
        
    } else {
        // User is signed out or no user
        console.log('No user is signed in');
        
        // Ensure login buttons are visible and correct
        loginButtons.forEach(button => {
            if (button.style.display === 'none') {
                button.style.display = '';
            }
        });
    }
});

// Contact form submission
const contactSubmit = document.getElementById('contactSubmit');
if (contactSubmit) {
    contactSubmit.addEventListener('click', (e) => {
        e.preventDefault();

        const name = document.getElementById('contactName').value.trim();
        const email = document.getElementById('contactEmail').value.trim();
        const message = document.getElementById('contactMessage').value.trim();
        const formResult = document.getElementById('formResult');

        if (!name || !email || !message) {
            formResult.textContent = 'Please fill out all fields.';
            formResult.className = 'mt-4 text-center text-red-500 fade-in';
            return;
        }

        // Here you would normally send the data to a server
        // For now, we'll just simulate a successful submission
        formResult.textContent = 'Thank you for your message! We will get back to you soon.';
        formResult.className = 'mt-4 text-center text-green-600 fade-in';

        // Clear the form
        document.getElementById('contactName').value = '';
        document.getElementById('contactEmail').value = '';
        document.getElementById('contactMessage').value = '';
    });
}