# Project Setup Guide

This guide walks you through the steps required to set up and run the project locally.

## Prerequisites

* Node.js and npm installed
* VS Code or Sublime Text
* Live Server extension (optional but recommended for HTML preview)

## Steps to Run the Project

1. **Fork the repository**
   Click the "Fork" button on the GitHub repository to create your own copy.

2. **Clone the repository**
   Use the following command to clone it to your local machine:

   ```bash
   git clone https://github.com/your-username/ecoglow.git
   ```

3. **Install dependencies**
   Navigate into the project directory and install the required packages:

   ```bash
   cd ecoglow
   npm install
   ```

4. **Create a `.env` file** in the root directory with the following content:

   ```
   GROQ_API_KEY=your-secret-key
   GOOGLE_APPLICATION_CREDENTIALS=./final.json
   PORT=3000
   ```

   * Get your GROQ API key from: [https://console.groq.com/keys](https://console.groq.com/keys)
   * Create a new key and paste it as the value of `GROQ_API_KEY`.

5. **Start the backend server**

   ```bash
   node server.js
   ```

6. **Render the HTML frontend**
   Use the Live Server extension in VS Code (or another method) to open the HTML file in your browser.

## Notes

* Make sure `final.json` (your Google service account credentials) is present in the root directory.
* The server runs on port `3000` by default. You can change this in the `.env` file if needed.

---
