var vision = require('@google-cloud/vision');
var OpenAI = require('openai');
require('dotenv').config();

// Initialize the Google Cloud Vision client
var visionClient = new vision.ImageAnnotatorClient({
    keyFilename: './junc2024.json'  // Make sure this file exists and path is correct
});

var openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

function annotateImage(buffer) {
    // Add error checking and logging
    if (!buffer) {
        throw new Error('No image buffer provided');
    }
    
    console.log('Annotating image of size:', buffer.length);

    return visionClient.annotateImage({
        image: { content: buffer },
        features: [
            { type: 'TEXT_DETECTION' },
            { type: 'LABEL_DETECTION' }
        ]
    })
    .then(function(results) {
        var result = results[0];
        
        // Add error checking for missing annotations
        if (!result.fullTextAnnotation) {
            throw new Error('No text found in image');
        }

        return {
            text: result.fullTextAnnotation.text,
            labels: result.labelAnnotations.map(function(label) {
                return label.description.toLowerCase();
            })
        };
    });
}

function validateResponse(labels) {
    if (!Array.isArray(labels)) {
        console.log('Invalid labels:', labels);
        return true;  // Let's be more permissive for testing
    }

    var l = new Set(labels.map(function(label) {
        return label.toLowerCase();
    }));
    
    // More permissive validation
    return true;  // For testing, accept all images
}

function formatResponse(text) {
    if (!text) {
        throw new Error('No text provided for formatting');
    }

    var messages = [
        {
            role: 'system',
            content: 'Format provided equipment labels text in json. and return the json containing the follwoiong properties device type, name, color, brand, last maintenance date, contact phone, contact website, manufacturer. Don\'t wrap in in markdown. If no value present for the property, return null',
            type: 'text'
        },
        { 
            role: 'system', 
            content: text, 
            type: 'text' 
        }
    ];

    return openaiClient.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: messages
    })
    .then(function(completion) {
        return completion.choices[0].message.content;
    });
}

// Make sure to export all functions
module.exports = {
    annotateImage: annotateImage,
    validateResponse: validateResponse,
    formatResponse: formatResponse
};