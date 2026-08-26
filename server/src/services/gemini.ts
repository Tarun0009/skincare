import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { config } from '../config.js';
import { buildAnalysisPrompt, SKIN_ANALYSIS_SYSTEM } from '../prompts/skin-analysis.js';
import { buildComparisonPrompt, COMPARISON_SYSTEM } from '../prompts/comparison.js';
import { photoAsInlineData } from '../storage/photos.js';
import type { Routine, SkinAnalysis, Comparison } from '../../../shared/types.js';

const client = new GoogleGenerativeAI(config.gemini.apiKey);

const ANALYSIS_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    analysis: {
      type: SchemaType.OBJECT,
      properties: {
        skinType: { type: SchemaType.STRING },
        overallScore: { type: SchemaType.INTEGER },
        conditions: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              type: { type: SchemaType.STRING },
              severity: { type: SchemaType.INTEGER },
              confidence: { type: SchemaType.NUMBER },
              locations: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
              },
              notes: { type: SchemaType.STRING },
            },
            required: ['type', 'severity', 'confidence', 'locations', 'notes'],
          },
        },
        summary: { type: SchemaType.STRING },
        disclaimer: { type: SchemaType.STRING },
      },
      required: ['skinType', 'overallScore', 'conditions', 'summary', 'disclaimer'],
    },
    routine: {
      type: SchemaType.OBJECT,
      properties: {
        am: { type: SchemaType.ARRAY, items: routineStepSchema() },
        pm: { type: SchemaType.ARRAY, items: routineStepSchema() },
        warnings: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
      },
      required: ['am', 'pm', 'warnings'],
    },
  },
  required: ['analysis', 'routine'],
};

function routineStepSchema() {
  return {
    type: SchemaType.OBJECT,
    properties: {
      order: { type: SchemaType.INTEGER },
      timeOfDay: { type: SchemaType.STRING },
      category: { type: SchemaType.STRING },
      productName: { type: SchemaType.STRING },
      ingredientsToLookFor: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING },
      },
      reason: { type: SchemaType.STRING },
    },
    required: [
      'order',
      'timeOfDay',
      'category',
      'productName',
      'ingredientsToLookFor',
      'reason',
    ],
  };
}

const COMPARISON_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    improvementScore: { type: SchemaType.INTEGER },
    perConditionDelta: { type: SchemaType.OBJECT, properties: {} },
    narrative: { type: SchemaType.STRING },
  },
  required: ['improvementScore', 'perConditionDelta', 'narrative'],
};

export interface AnalyzeResult {
  analysis: SkinAnalysis;
  routine: Routine;
}

export async function analyzeSelfie(
  photoRelativePath: string,
  opts: { previousBaselineSummary?: string } = {}
): Promise<AnalyzeResult> {
  const model = client.getGenerativeModel({
    model: config.gemini.model,
    systemInstruction: SKIN_ANALYSIS_SYSTEM,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: ANALYSIS_SCHEMA as never,
      temperature: 0.4,
    },
  });

  const image = await photoAsInlineData(photoRelativePath);

  const result = await model.generateContent([
    { text: buildAnalysisPrompt(opts) },
    { inlineData: image },
  ]);

  const raw = result.response.text();
  return JSON.parse(raw) as AnalyzeResult;
}

export async function compareScans(opts: {
  baselineAnalysis: SkinAnalysis;
  currentAnalysis: SkinAnalysis;
  baselineScanId: string;
  currentScanId: string;
  daysBetween: number;
}): Promise<Comparison> {
  const model = client.getGenerativeModel({
    model: config.gemini.model,
    systemInstruction: COMPARISON_SYSTEM,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: COMPARISON_SCHEMA as never,
      temperature: 0.2,
    },
  });

  const result = await model.generateContent([
    {
      text: buildComparisonPrompt({
        baselineAnalysisJson: JSON.stringify(opts.baselineAnalysis),
        currentAnalysisJson: JSON.stringify(opts.currentAnalysis),
        daysBetween: opts.daysBetween,
      }),
    },
  ]);

  const parsed = JSON.parse(result.response.text()) as {
    improvementScore: number;
    perConditionDelta: Comparison['perConditionDelta'];
    narrative: string;
  };

  return {
    baselineScanId: opts.baselineScanId,
    currentScanId: opts.currentScanId,
    improvementScore: parsed.improvementScore,
    perConditionDelta: parsed.perConditionDelta,
    narrative: parsed.narrative,
  };
}
