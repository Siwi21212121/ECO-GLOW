const express = require('express');
const multer = require("multer");
const Groq = require("groq-sdk");
const cors = require("cors");
const { ImageAnnotatorClient } = require("@google-cloud/vision");
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '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' });

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Initialize Google Vision client with proper auth
let visionClient;
try {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    visionClient = new ImageAnnotatorClient();
    console.log("Vision client initialized with environment variable credentials");
  } else {
    visionClient = new ImageAnnotatorClient({
      keyFilename: './final.json'
    });
    console.log("Vision client initialized with local credentials file");
  }
} catch (error) {
  console.error("Failed to initialize Vision client:", error.message);
}

const port = process.env.PORT || 3000;

async function getPeelUses(foodItem) {
  try {
    console.log(`Getting information for: ${foodItem}`);
    
    // Create a comprehensive prompt for composting information
    const compostingPrompt = `
I need detailed, scientifically accurate information about composting ${foodItem} peels or parts.

Please provide:
1. What specific nutrients ${foodItem} peels add to compost (e.g., nitrogen, potassium, etc.)
2. How quickly they break down compared to other food waste
3. Any special preparation needed (should they be chopped, dried, etc.)
4. Any potential issues with composting this item (acidity concerns, attraction to pests, etc.)
5. Tips for best practices when adding to home composting systems

Format the response as practical, actionable advice for home composters.
`;

    // Create a comprehensive prompt for skincare information
    const skincarePrompt = `
I need detailed, scientifically-backed information about using ${foodItem} peels or parts in natural skincare.

Please provide:
1. The key beneficial compounds or nutrients in ${foodItem} peels for skin health
2. Step-by-step instructions for 1-2 specific DIY skincare applications (masks, scrubs, etc.)
3. What skin types or conditions would benefit most (dry, oily, acne-prone, aging, etc.)
4. Any precautions or warnings about skin sensitivity or allergies
5. How often these treatments should be used for best results

Format the response as practical advice that prioritizes safety and effectiveness.
`;

    // Query for composting tips using improved prompt
    const compostingResponse = await groq.chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [{ role: 'user', content: compostingPrompt }],
      max_tokens: 250,
      temperature: 0.7
    });
    const compostingTip = compostingResponse.choices[0].message.content.trim();
    
    // Query for skincare tips using improved prompt
    const skincareResponse = await groq.chat.completions.create({
      model: 'llama3-8b-8192', 
      messages: [{ role: 'user', content: skincarePrompt }],
      max_tokens: 300,
      temperature: 0.7
    });
    const skincareTip = skincareResponse.choices[0].message.content.trim();
    
    return { 
      compostingTip, 
      skincareTip 
    };
  } catch (error) {
    console.error("Error fetching information from Groq:", error);
    // Return basic fallback text
    return {
      compostingTip: `${foodItem} can likely be composted. Break into smaller pieces for faster decomposition.`,
      skincareTip: `${foodItem} may contain beneficial nutrients for skin. Research specific properties for safe DIY applications.`
    };
  }
}

// API endpoint to scan food item and return peel uses
app.post('/scan', async (req, res) => {
  const { foodItem } = req.body;
  
  if (!foodItem || typeof foodItem !== 'string') {
    return res.status(400).json({ error: 'Please provide a valid food item name.' });
  }
  
  try {
    const { compostingTip, skincareTip } = await getPeelUses(foodItem);
    res.json({
      foodItem,
      composting: compostingTip,
      skincare: skincareTip
    });
  } catch (error) {
    console.error("Error in /scan endpoint:", error);
    res.status(500).json({
      error: "Failed to process your request",
      message: error.message
    });
  }
});

app.post("/image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    // Check if Vision client is properly initialized
    if (!visionClient) {
      return res.status(500).json({ 
        error: "Image processing service unavailable",
        message: "Vision API client could not be initialized" 
      });
    }
    
    const image = req.file.buffer;
    
    // Use the Google Vision API to detect objects from the image
    const [result] = await visionClient.objectLocalization({
      image: { content: image },
    });
    
    // Extract the object with the highest score
    let objectName = "unknown object";
    let score = 0;
    if (result && result.localizedObjectAnnotations && result.localizedObjectAnnotations.length > 0) {
      // Sort by score and get the object with highest confidence
      const sortedObjects = result.localizedObjectAnnotations.sort((a, b) => b.score - a.score);
      objectName = sortedObjects[0].name;
      score = sortedObjects[0].score;
      console.log("Detected Object:", objectName, "with confidence:", score);
    } 
    // Get recycling and skincare information for the detected object
    const { compostingTip, skincareTip } = await getPeelUses(objectName);
    
    // Return object name and information
    res.json({ 
      objectName, 
      confidence: score,
      recycleInfo: {
        composting: compostingTip,
        skincare: skincareTip
      }
    });
  } catch (error) {
    console.error("Error in /image endpoint:", error.message, error.stack);
    res.status(500).json({
      error: "Failed to process image",
      message: error.message
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});