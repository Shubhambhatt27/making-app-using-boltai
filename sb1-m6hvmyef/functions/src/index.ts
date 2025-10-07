import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

admin.initializeApp();

const db = admin.firestore();
const storage = admin.storage();

const GEMINI_API_KEY = functions.config().gemini?.apikey || process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

interface AnalysisResult {
  score: number;
  explanation: string;
  pros: string[];
  cons: string[];
}

export const onImageUpload = functions.storage.object().onFinalize(async (object) => {
  const filePath = object.name;

  if (!filePath || !filePath.startsWith('scan_images/')) {
    console.log('Not a scan image, skipping...');
    return null;
  }

  const pathParts = filePath.split('/');
  if (pathParts.length < 3) {
    console.error('Invalid file path structure');
    return null;
  }

  const userId = pathParts[1];
  const fileName = pathParts[2];
  const scanId = fileName.split('_')[0];

  console.log(`Processing scan for user: ${userId}, scanId: ${scanId}`);

  try {
    const imageUrl = `https://storage.googleapis.com/${object.bucket}/${filePath}`;

    const scanRef = db.collection('scans').doc(scanId);
    await scanRef.set({
      scanId,
      ownerId: userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'processing',
      imageUrl,
      extractedIngredients: [],
      errorMessage: null,
      analysisResult: null
    });

    console.log('Scan document created, extracting ingredients...');

    const bucket = storage.bucket(object.bucket);
    const file = bucket.file(filePath);
    const [fileBuffer] = await file.download();

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const imagePart = {
      inlineData: {
        data: fileBuffer.toString('base64'),
        mimeType: object.contentType || 'image/jpeg'
      }
    };

    const extractionPrompt = 'Extract all text from this image of a food ingredient list. Return a clean, comma-separated list of the ingredients. Ignore any non-ingredient text. Only return the ingredient names, nothing else.';

    const extractionResult = await model.generateContent([extractionPrompt, imagePart]);
    const extractedText = extractionResult.response.text();

    const ingredients = extractedText
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);

    console.log('Ingredients extracted:', ingredients);

    await scanRef.update({
      status: 'analyzing',
      extractedIngredients: ingredients
    });

    console.log('Analyzing health impact...');

    const analysisResult = await analyzeIngredientsLogic(ingredients);

    await scanRef.update({
      status: 'complete',
      analysisResult
    });

    console.log('Scan processing complete!');

    return { success: true, scanId };

  } catch (error: any) {
    console.error('Error processing scan:', error);

    const scanRef = db.collection('scans').doc(scanId);
    await scanRef.update({
      status: 'error',
      errorMessage: error.message || 'An error occurred during analysis'
    });

    return { success: false, error: error.message };
  }
});

export const analyzeIngredients = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to analyze ingredients'
    );
  }

  const { ingredients } = data;

  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Ingredients array is required and must not be empty'
    );
  }

  try {
    const result = await analyzeIngredientsLogic(ingredients);
    return result;
  } catch (error: any) {
    console.error('Error in analyzeIngredients:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to analyze ingredients',
      error.message
    );
  }
});

async function analyzeIngredientsLogic(ingredients: string[]): Promise<AnalysisResult> {
  const ingredientsList = ingredients.join(', ');

  const analysisPrompt = `You are a helpful nutrition assistant. Based on the following ingredients: ${ingredientsList}.

Provide a health score from 1 to 10 (where 10 is the healthiest). Explain the score in a simple paragraph. List the top 3 pros and cons.

Respond ONLY with a valid JSON object with the keys: 'score' (number), 'explanation' (string), 'pros' (array of strings), 'cons' (array of strings).

Example format:
{
  "score": 7,
  "explanation": "Your explanation here",
  "pros": ["Pro 1", "Pro 2", "Pro 3"],
  "cons": ["Con 1", "Con 2", "Con 3"]
}`;

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  const result = await model.generateContent(analysisPrompt);
  const analysisText = result.response.text();

  const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Invalid response format from AI');
  }

  const analysis: AnalysisResult = JSON.parse(jsonMatch[0]);

  if (typeof analysis.score !== 'number' ||
      typeof analysis.explanation !== 'string' ||
      !Array.isArray(analysis.pros) ||
      !Array.isArray(analysis.cons)) {
    throw new Error('Invalid analysis result structure');
  }

  return analysis;
}

export const retryScan = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const { scanId } = data;

  if (!scanId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Scan ID is required'
    );
  }

  try {
    const scanRef = db.collection('scans').doc(scanId);
    const scanDoc = await scanRef.get();

    if (!scanDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Scan not found'
      );
    }

    const scanData = scanDoc.data();

    if (scanData?.ownerId !== context.auth.uid) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'You do not have permission to retry this scan'
      );
    }

    if (scanData?.status !== 'error') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Only failed scans can be retried'
      );
    }

    const ingredients = scanData.extractedIngredients || [];

    if (ingredients.length === 0) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'No ingredients found to analyze'
      );
    }

    await scanRef.update({
      status: 'analyzing',
      errorMessage: null
    });

    const analysisResult = await analyzeIngredientsLogic(ingredients);

    await scanRef.update({
      status: 'complete',
      analysisResult
    });

    return { success: true, analysisResult };

  } catch (error: any) {
    console.error('Error retrying scan:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      'internal',
      'Failed to retry scan',
      error.message
    );
  }
});
