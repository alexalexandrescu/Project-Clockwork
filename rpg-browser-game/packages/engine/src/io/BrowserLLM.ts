/**
 * BrowserLLM - WebLLM wrapper for in-browser AI model execution
 *
 * This class provides a singleton interface to WebLLM for running Phi-3 Mini
 * models directly in the browser using WebGPU acceleration.
 */

import * as webllm from '@mlc-ai/web-llm';

/**
 * Progress callback for model loading
 */
export interface LoadProgress {
  progress: number; // 0-1
  text: string;
  timeElapsed: number;
}

/**
 * Streaming chunk callback
 */
export type StreamChunkCallback = (chunk: string, isDone: boolean) => void;

/**
 * BrowserLLM - Singleton WebLLM wrapper
 *
 * @example
 * ```typescript
 * const llm = BrowserLLM.getInstance();
 * await llm.initialize((progress) => {
 *   console.log(`Loading: ${progress.text} (${progress.progress * 100}%)`);
 * });
 *
 * const response = await llm.generate("Describe a mystical forest.");
 * console.log(response);
 * ```
 */
export class BrowserLLM {
  private static instance: BrowserLLM | null = null;
  private engine: webllm.MLCEngineInterface | null = null;
  private modelId = 'Phi-3-mini-4k-instruct-q4f16_1-MLC';
  private loaded = false;
  private loading = false;

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): BrowserLLM {
    if (!BrowserLLM.instance) {
      BrowserLLM.instance = new BrowserLLM();
    }
    return BrowserLLM.instance;
  }

  /**
   * Initialize the model with progress tracking
   *
   * @param onProgress - Optional callback for loading progress
   * @throws Error if WebGPU is not supported or initialization fails
   */
  public async initialize(
    onProgress?: (progress: LoadProgress) => void
  ): Promise<void> {
    if (this.loaded) {
      return; // Already initialized
    }

    if (this.loading) {
      throw new Error('Model is already loading');
    }

    this.loading = true;
    const startTime = Date.now();

    try {
      // Check WebGPU support
      if (!navigator.gpu) {
        throw new Error(
          'WebGPU is not supported in this browser. Please use Chrome 113+ or Edge 113+'
        );
      }

      // Create engine with progress callback
      this.engine = await webllm.CreateMLCEngine(this.modelId, {
        initProgressCallback: (report: webllm.InitProgressReport) => {
          if (onProgress) {
            onProgress({
              progress: report.progress,
              text: report.text,
              timeElapsed: Date.now() - startTime,
            });
          }
        },
      });

      this.loaded = true;
      this.loading = false;

      console.log(`[BrowserLLM] Model ${this.modelId} loaded successfully`);
    } catch (error) {
      this.loading = false;
      this.loaded = false;
      console.error('[BrowserLLM] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Generate a completion for the given prompt
   *
   * @param prompt - The input prompt
   * @param options - Generation options
   * @returns The generated text
   * @throws Error if model is not loaded
   */
  public async generate(
    prompt: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
    }
  ): Promise<string> {
    if (!this.loaded || !this.engine) {
      throw new Error('Model is not loaded. Call initialize() first.');
    }

    try {
      const messages: webllm.ChatCompletionMessageParam[] = [
        { role: 'user', content: prompt },
      ];

      const response = await this.engine.chat.completions.create({
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 512,
        top_p: options?.topP ?? 0.95,
      });

      return response.choices[0]?.message?.content ?? '';
    } catch (error) {
      console.error('[BrowserLLM] Generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate a streaming completion for the given prompt
   *
   * @param prompt - The input prompt
   * @param onChunk - Callback for each chunk of generated text
   * @param options - Generation options
   * @throws Error if model is not loaded
   */
  public async generateStreaming(
    prompt: string,
    onChunk: StreamChunkCallback,
    options?: {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
    }
  ): Promise<void> {
    if (!this.loaded || !this.engine) {
      throw new Error('Model is not loaded. Call initialize() first.');
    }

    try {
      const messages: webllm.ChatCompletionMessageParam[] = [
        { role: 'user', content: prompt },
      ];

      const stream = await this.engine.chat.completions.create({
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 512,
        top_p: options?.topP ?? 0.95,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content ?? '';
        const isDone = chunk.choices[0]?.finish_reason !== null;

        if (content) {
          onChunk(content, false);
        }

        if (isDone) {
          onChunk('', true);
          break;
        }
      }
    } catch (error) {
      console.error('[BrowserLLM] Streaming generation failed:', error);
      throw error;
    }
  }

  /**
   * Check if the model is loaded and ready
   */
  public isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Check if the model is currently loading
   */
  public isLoading(): boolean {
    return this.loading;
  }

  /**
   * Get the current model ID
   */
  public getModelId(): string {
    return this.modelId;
  }

  /**
   * Unload the model and free resources
   */
  public async unload(): Promise<void> {
    if (this.engine) {
      // WebLLM doesn't have explicit unload, but we can reset the engine
      this.engine = null;
      this.loaded = false;
      this.loading = false;
      console.log('[BrowserLLM] Model unloaded');
    }
  }

  /**
   * Reset the singleton instance (primarily for testing)
   */
  public static resetInstance(): void {
    if (BrowserLLM.instance) {
      BrowserLLM.instance.unload();
      BrowserLLM.instance = null;
    }
  }
}
