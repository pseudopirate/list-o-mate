const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { annotateImage, validateResponse, formatResponse } = require('recognizer.js');

const app = express();
const upload = multer();

// Middleware
app.use(cors());
app.use(express.json());

// Process image endpoint
app.post('/process-image', upload.single('image'), function(req, res) {
    const imageBuffer = req.file.buffer;
    
    annotateImage(imageBuffer)
        .then(function(annotationResult) {
            if (!validateResponse(annotationResult.labels)) {
                return res.status(400).json({ 
                    error: 'Invalid image content' 
                });
            }

            return formatResponse(annotationResult.text);
        })
        .then(function(formattedResponse) {
            res.json({ 
                success: true,
                data: formattedResponse 
            });
        })
        .catch(function(error) {
            console.error('Error processing image:', error);
            res.status(500).json({ 
                error: 'Error processing image',
                details: error.message 
            });
        });
});

// Health check endpoint
app.get('/health', function(req, res) {
    res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function() {
    console.log('Server running on port ' + PORT);
}); 