const express = require('express');
const multer = require('multer');
const cors = require('cors');
const recognizer = require('./recognizer.js');

const annotateImage = recognizer.annotateImage;
const validateResponse = recognizer.validateResponse;
const formatResponse = recognizer.formatResponse;

const app = express();
const upload = multer();

// Middleware
app.use(cors());
app.use(express.json());

// Process image endpoint
app.post('/process-image', upload.single('image'), function(req, res) {
    // Check for file first
    if (!req.file) {
        return res.status(400).json({
            error: 'No image file received'
        });
    }

    console.log('Received file:', req.file.originalname, 'Size:', req.file.size);
    
    var imageBuffer = req.file.buffer;
    
    annotateImage(imageBuffer)
        .then(function(annotationResult) {
            // Don't send response here, just return the result
            if (!validateResponse(annotationResult.labels)) {
                throw new Error('Invalid image content');
            }
            return formatResponse(annotationResult.text);
        })
        .then(function(formattedResponse) {
            // Send final response here
            res.json({ 
                success: true,
                data: formattedResponse 
            });
        })
        .catch(function(error) {
            console.error('Error processing image:', error);
            // Make sure we haven't already sent a response
            if (!res.headersSent) {
                res.status(500).json({ 
                    error: 'Error processing image',
                    details: error.message 
                });
            }
        });
});

// Health check endpoint
app.get('/health', function(req, res) {
    res.json({ status: 'ok' });
});

var PORT = process.env.PORT || 3000;
app.listen(PORT, function() {
    console.log('Server running on port ' + PORT);
}); 