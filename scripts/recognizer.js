// const vision = require('@google-cloud/vision');
// const OpenAI = require('openai')
// const fs = require('fs/promises');
// // Creates a client
// const visionClient = new vision.ImageAnnotatorClient({
//     keyFilename: './junc2024.json'
// });

// const openaiClient = new OpenAI();

export async function anotateImage(buffer) {
    const [result] = await visionClient.annotateImage({
        image: { content: buffer.toString('base64') },
        features: [
            { type: 'TEXT_DETECTION' },
            { type: 'LABEL_DETECTION' },
        ]
    });

    return {
        text: result.fullTextAnnotation.text,
        labels: result.labelAnnotations.map(label => label.description.toLowerCase()),
    }
}

export function validateResponse(labels) {
    const l = new Set(labels);

    return l.has('label')
        || l.has('material property')
        || l.has('material property')
        || l.has('signage')
        || l.has('nameplate');
}

export async function formatResponse(text) {
    const messages = [
        {
            role: 'system',
            content: 'Format provided equipment labels text in yaml. Don\'t wrap in in markdown',
            type: 'text'
        },
        { role: 'system', content: text, type: 'text' },
    ];

    const completion = await openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages,
    });

    return completion.choices.pop().message.content;
}


(async function() {
    const r = await describeEquipment();
    console.log(r)
})()