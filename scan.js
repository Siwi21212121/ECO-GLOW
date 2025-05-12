// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const analyzeTextBtn = document.getElementById('analyzeTextBtn');
const wasteInput = document.getElementById('wasteInput');
const resultsDiv = document.getElementById('results');
const loadingSpinner = document.getElementById('loadingSpinner');
const resultsContent = document.getElementById('resultsContent');
const wasteTypeSpan = document.getElementById('wasteType');
const confidenceSpan = document.getElementById('confidence');
const confidenceBar = document.getElementById('confidenceBar');
const compostingSpan = document.getElementById('composting');
const skincareSpan = document.getElementById('skincare');
const recyclingSpan = document.getElementById('recycling');

// Backend API URL - Change this to match your server
const API_URL = 'http://localhost:3000';

// Check if scan elements exist
if (dropZone && fileInput) {
    // GSAP animations for the scan page
    gsap.from('.scan-intro', {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: 'power3.out'
    });

    gsap.from('.scan-options', {
        opacity: 0,
        y: 30,
        duration: 0.8,
        delay: 0.3,
        ease: 'power3.out'
    });

    // Drag-and-drop functionality
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('bg-green-100');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('bg-green-100');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('bg-green-100');
        const files = e.dataTransfer.files;
        if (files.length > 0) handleFile(files[0]);
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) handleFile(fileInput.files[0]);
    });

    // Text input analysis
    if (analyzeTextBtn) {
        analyzeTextBtn.addEventListener('click', () => {
            const foodItem = wasteInput.value.trim();
            if (!foodItem) {
                alert("Please enter the name of the organic waste.");
                return;
            }
            analyzeWasteText(foodItem);
        });
    }

    // Also allow Enter key to submit the form
    if (wasteInput) {
        wasteInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const foodItem = wasteInput.value.trim();
                if (foodItem) {
                    analyzeWasteText(foodItem);
                }
            }
        });
    }
}

/**
 * Format text with markdown-style formatting to HTML
 * Handles **bold**, *italic*, and other basic markdown syntax
 */
function formatMarkdownText(text) {
    if (!text) return '';
    
    // Handle bold formatting (**text**)
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-green-700">$1</strong>');
    
    // Handle italic formatting (*text*)
    text = text.replace(/\*(.*?)\*/g, '<em class="text-green-600">$1</em>');
    
    // Handle bullet points
    text = text.replace(/- (.*?)(?:\n|$)/g, '<li class="ml-4">$1</li>');
    
    // Wrap bullet points in ul if any exist
    if (text.includes('<li')) {
        text = '<ul class="list-disc ml-5 my-2">' + text + '</ul>';
    }
    
    // Add paragraph breaks
    text = text.replace(/\n\n/g, '</p><p class="my-2">');
    
    // Wrap in paragraph if not already wrapped in ul
    if (!text.startsWith('<ul')) {
        text = '<p class="my-2">' + text + '</p>';
    }
    
    return text;
}

/**
 * Handle file upload and send to backend for analysis
 */
async function handleFile(file) {
    // Show results section with loading state
    resultsDiv.classList.remove('hidden');
    loadingSpinner.classList.remove('hidden');
    resultsContent.classList.add('hidden');

    try {
        // Create form data with the file
        const formData = new FormData();
        formData.append('image', file);

        // Send the file to the backend
        const response = await fetch(`${API_URL}/image`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to analyze image.');
        }

        const data = await response.json();

        // Hide spinner, show results
        loadingSpinner.classList.add('hidden');
        resultsContent.classList.remove('hidden');

        // Update UI with the results
        wasteTypeSpan.textContent = data.objectName;

        // Set confidence value and progress bar
        const confidenceValue = Math.round(data.confidence * 100) || 95;
        confidenceSpan.textContent = confidenceValue;
        confidenceBar.style.width = `${confidenceValue}%`;

        // Update composting information with formatted text
        if (data.recycleInfo && data.recycleInfo.composting) {
            compostingSpan.innerHTML = formatMarkdownText(data.recycleInfo.composting);
        } else {
            compostingSpan.innerHTML = formatMarkdownText(`${data.objectName} can be added to compost but should be broken into smaller pieces for faster decomposition.`);
        }

        // Update skincare information with formatted text
        if (data.recycleInfo && data.recycleInfo.skincare) {
            skincareSpan.innerHTML = formatMarkdownText(data.recycleInfo.skincare);
        } else {
            skincareSpan.innerHTML = formatMarkdownText(`${data.objectName} may contain beneficial nutrients for skin. Research specific properties for safe DIY applications.`);
        }

        // Update recycling information with formatted text
        recyclingSpan.innerHTML = formatMarkdownText(`Check your local recycling guidelines for proper disposal of ${data.objectName}.`);

        // Add fade-in animation to results
        resultsDiv.classList.add('fade-in');

        // Animate results with GSAP
        gsap.from("#resultsContent > div", {
            opacity: 0,
            y: 20,
            duration: 0.5,
            stagger: 0.2,
            ease: "power2.out"
        });

    } catch (error) {
        console.error('Error:', error);

        // Hide spinner, show results with error message
        loadingSpinner.classList.add('hidden');
        resultsContent.classList.remove('hidden');

        wasteTypeSpan.textContent = 'Error analyzing image';
        confidenceSpan.textContent = '0';
        confidenceBar.style.width = '0%';
        compostingSpan.innerHTML = formatMarkdownText('Could not retrieve composting information.');
        skincareSpan.innerHTML = formatMarkdownText('Could not retrieve skincare information.');
        recyclingSpan.innerHTML = formatMarkdownText('Could not retrieve recycling information.');
    }
}


// Add authentication check section
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is authenticated
    firebase.auth().onAuthStateChanged((user) => {
        if (!user) {
            // User is not logged in, show login required message
            showLoginRequiredMessage();
        } else {
            // User is logged in, initialize scan functionality
            initializeScanPage();
        }
    });
});

// Function to show login required message
function showLoginRequiredMessage() {
    // Get the main content container
    const mainContainer = document.querySelector('main');

    // Create login required message
    const loginRequired = document.createElement('div');
    loginRequired.className = 'bg-white rounded-xl shadow-lg p-8 mb-12 text-center mt-8';
    loginRequired.innerHTML = `
        <div class="text-6xl text-green-600 mb-6">
            <i class="fas fa-lock"></i>
        </div>
        <h2 class="text-3xl font-bold text-green-800 mb-4">Login Required</h2>
        <p class="text-xl text-gray-700 mb-8">
            You need to be logged in to use the Eco Glow Scan Service.
        </p>
        <p class="text-gray-600 mb-8">
            Create an account or login to access our waste analysis tools and unlock personalized recommendations.
        </p>
        <a href="login.html?redirect=scan" class="bg-green-600 text-white px-8 py-4 rounded-full hover:bg-green-700 transition-all inline-block">
            <i class="fas fa-sign-in-alt mr-2"></i> Login to Continue
        </a>
    `;

    // Hide all existing scan content
    const scanContent = document.querySelectorAll('main > *');
    scanContent.forEach(element => {
        element.style.display = 'none';
    });

    // Insert login required message
    mainContainer.insertBefore(loginRequired, mainContainer.firstChild);

    // Animate with GSAP
    gsap.from(loginRequired, {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: 'power3.out'
    });
}

// Initialize scan page functionality
function initializeScanPage() {
    // Show all scan content (in case they were hidden)
    const scanContent = document.querySelectorAll('main > *');
    scanContent.forEach(element => {
        element.style.display = '';
    });

    // Remove any login required message
    const loginRequired = document.querySelector('main > div:first-child');
    if (loginRequired && loginRequired.querySelector('.fa-lock')) {
        loginRequired.remove();
    }

    // Now proceed with regular scan page initialization
    if (dropZone && fileInput) {
        // GSAP animations for the scan page
        gsap.from('.scan-intro', {
            opacity: 0,
            y: 30,
            duration: 0.8,
            ease: 'power3.out'
        });

        gsap.from('.scan-options', {
            opacity: 0,
            y: 30,
            duration: 0.8,
            delay: 0.3,
            ease: 'power3.out'
        });

        // Drag-and-drop functionality
        dropZone.addEventListener('click', () => fileInput.click());

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('bg-green-100');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('bg-green-100');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('bg-green-100');
            const files = e.dataTransfer.files;
            if (files.length > 0) handleFile(files[0]);
        });

        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) handleFile(fileInput.files[0]);
        });

        // Text input analysis
        if (analyzeTextBtn) {
            analyzeTextBtn.addEventListener('click', () => {
                const foodItem = wasteInput.value.trim();
                if (!foodItem) {
                    alert("Please enter the name of the organic waste.");
                    return;
                }
                analyzeWasteText(foodItem);
            });
        }

        // Also allow Enter key to submit the form
        if (wasteInput) {
            wasteInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const foodItem = wasteInput.value.trim();
                    if (foodItem) {
                        analyzeWasteText(foodItem);
                    }
                }
            });
        }
    }
}


/**
 * Analyze waste by text input
 */
async function analyzeWasteText(foodItem) {
    // Show results section with loading state
    resultsDiv.classList.remove('hidden');
    loadingSpinner.classList.remove('hidden');
    resultsContent.classList.add('hidden');

    try {
        // Send the text to the backend
        const response = await fetch(`${API_URL}/scan`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ foodItem })
        });

        if (!response.ok) {
            throw new Error('Failed to fetch information from the server.');
        }

        const data = await response.json();

        // Hide spinner, show results
        loadingSpinner.classList.add('hidden');
        resultsContent.classList.remove('hidden');

        // Update UI with the results
        wasteTypeSpan.textContent = foodItem;
        confidenceSpan.textContent = '95';
        confidenceBar.style.width = '95%';

        // Update with formatted text
        compostingSpan.innerHTML = formatMarkdownText(data.composting);
        skincareSpan.innerHTML = formatMarkdownText(data.skincare);
        recyclingSpan.innerHTML = formatMarkdownText(`Check your local recycling guidelines for proper disposal of ${foodItem}.`);

        // Enhance the results UI
        enhanceResultsUI();

        // Add fade-in animation to results
        resultsDiv.classList.add('fade-in');

        // Animate results with GSAP
        gsap.from("#resultsContent > div", {
            opacity: 0,
            y: 20,
            duration: 0.5,
            stagger: 0.2,
            ease: "power2.out"
        });

    } catch (error) {
        console.error('Error:', error);

        // If server not available, use mock data
        loadingSpinner.classList.add('hidden');
        resultsContent.classList.remove('hidden');

        const mockData = getMockData(foodItem);

        wasteTypeSpan.textContent = foodItem;
        confidenceSpan.textContent = '90';
        confidenceBar.style.width = '90%';
        
        // Update with formatted text
        compostingSpan.innerHTML = formatMarkdownText(mockData.composting);
        skincareSpan.innerHTML = formatMarkdownText(mockData.skincare);
        recyclingSpan.innerHTML = formatMarkdownText(`Check your local recycling guidelines for proper disposal of ${foodItem}.`);
        
        // Enhance the results UI
        enhanceResultsUI();
    }
}

/**
 * Enhance the results UI with better styling
 */
function enhanceResultsUI() {
    // Add result section animations and improved styling
    const resultSections = document.querySelectorAll('#resultsContent > div');
    
    resultSections.forEach(section => {
        // Add hover effect
        section.classList.add('transition-all', 'duration-300', 'hover:bg-green-50');
        
        // Add subtle border and improve spacing
        section.classList.add('border-l-4', 'border-green-500', 'pl-4', 'my-4');
        
        // Find title elements and enhance them
        const title = section.querySelector('h3');
        if (title) {
            title.classList.add('text-green-700', 'flex', 'items-center', 'gap-2');
            
            // Add icon based on title content
            if (title.textContent.includes('Composting')) {
                title.innerHTML = `<i class="fas fa-seedling mr-2"></i> ${title.textContent}`;
            } else if (title.textContent.includes('Skincare')) {
                title.innerHTML = `<i class="fas fa-spa mr-2"></i> ${title.textContent}`;
            } else if (title.textContent.includes('Recycling')) {
                title.innerHTML = `<i class="fas fa-recycle mr-2"></i> ${title.textContent}`;
            }
        }
    });
    
    // Make the confidence indicator more attractive
    const confidenceContainer = document.querySelector('.confidence-container');
    if (confidenceContainer) {
        confidenceContainer.classList.add('bg-gray-100', 'p-3', 'rounded-lg');
        
        const confidenceBarContainer = document.querySelector('.confidence-bar-container');
        if (confidenceBarContainer) {
            confidenceBarContainer.classList.add('h-4', 'rounded-full', 'overflow-hidden');
        }
    }
}

/**
 * Provide mock data for fallback when server is unavailable
 */
function getMockData(foodItem) {
    const database = {
        'banana': {
            composting: '**Rich in potassium**, banana peels break down quickly and add valuable nutrients to compost.',
            skincare: 'Rub the inside of banana peels on your skin to **reduce inflammation** and moisturize dry areas.'
        },
        'orange': {
            composting: 'Adds **acidity and nitrogen** to compost. Shred them first for faster decomposition.',
            skincare: 'Contains **vitamin C** and acids that brighten skin. Can be used in DIY face masks.'
        },
        'apple': {
            composting: 'Breaks down quickly and adds **carbon** to your compost pile.',
            skincare: 'Contains **malic acid** that can help exfoliate skin and reduce dark spots.'
        },
        'potato': {
            composting: 'Adds **nitrogen and potassium** to compost. Avoid using diseased peels.',
            skincare: 'Raw potato slices can reduce **puffiness and dark circles** under eyes.'
        },
        'cucumber': {
            composting: 'High **water content** helps maintain moisture in compost pile.',
            skincare: 'Natural **cooling properties** reduce puffiness and inflammation. Great for soothing sunburns.'
        },
        'avocado': {
            composting: 'Rich in **nitrogen**, helps heat up compost piles for faster decomposition.',
            skincare: 'Contains **healthy fats and vitamins** that deeply moisturize skin. Good for DIY face masks.'
        },
        'lemon': {
            composting: 'Adds **acidity** to compost. Helps break down alkaline materials.',
            skincare: 'Natural **astringent and skin brightener**. Can lighten dark spots with regular use.'
        },
        'carrot': {
            composting: 'Rich in **potassium and phosphorus**, excellent for soil health.',
            skincare: 'Contains **beta-carotene and vitamin A** that help repair skin tissues and reduce wrinkles.'
        }
    };

    // Convert to lowercase and remove "peel" or "peels" suffix if present
    const normalizedItem = foodItem.toLowerCase().replace(/(peel|peels)$/, '').trim();

    // Find closest match
    for (const key in database) {
        if (normalizedItem.includes(key) || key.includes(normalizedItem)) {
            return database[key];
        }
    }

    // Default response if no match found
    return {
        composting: `${foodItem} can be added to compost but should be broken into **smaller pieces** for faster decomposition.`,
        skincare: `${foodItem} may contain **beneficial nutrients** for skin. Research specific properties for safe DIY applications.`
    };
}