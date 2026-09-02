import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { config } from '../config.js';
import { buildAnalysisPrompt, SKIN_ANALYSIS_SYSTEM } from '../prompts/skin-analysis.js';
import { buildComparisonPrompt, COMPARISON_SYSTEM } from '../prompts/comparison.js';
import type {
  Comparison,
  OnboardingContext,
  Routine,
  SkinAnalysis,
} from '../../../shared/types.js';

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
  photo: Buffer,
  opts: {
    previousBaselineSummary?: string;
    onboarding?: OnboardingContext;
  } = {}
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

  const result = await withTransientRetry(() =>
    model.generateContent([
      { text: buildAnalysisPrompt(opts) },
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: photo.toString('base64'),
        },
      },
    ])
  );

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

  const result = await withTransientRetry(() =>
    model.generateContent([
      {
        text: buildComparisonPrompt({
          baselineAnalysisJson: JSON.stringify(opts.baselineAnalysis),
          currentAnalysisJson: JSON.stringify(opts.currentAnalysis),
          daysBetween: opts.daysBetween,
        }),
      },
    ])
  );

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

async function withTransientRetry<T>(operation: () => Promise<T>): Promise<T> {
  const delaysMs = [750, 1_500];

  for (let attempt = 0; ; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= delaysMs.length || !isTransientGeminiError(error)) throw error;
      await delay(delaysMs[attempt]!);
    }
  }
}

function isTransientGeminiError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const value = error as { status?: number; statusText?: string; message?: string };
  if (value.status === 429 || (value.status != null && value.status >= 500)) return true;

  const message = `${value.statusText ?? ''} ${value.message ?? ''}`.toLowerCase();
  return (
    message.includes('429') ||
    message.includes('503') ||
    message.includes('overloaded') ||
    message.includes('high demand') ||
    message.includes('temporarily unavailable')
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
