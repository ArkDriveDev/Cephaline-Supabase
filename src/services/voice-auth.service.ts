type SpeechRecognition = any;
type SpeechRecognitionEvent = any;
type SpeechRecognitionErrorEvent = any;

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

class VoiceAuthService {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private onResult: ((text: string) => void) | null = null;
  private onError: ((error: string) => void) | null = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('Speech Recognition API not available');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript.toUpperCase().trim(); // Convert to uppercase
      this.onResult?.(transcript);
      this.stop();
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      this.onError?.(event.error);
      this.stop();
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };
  }

  public isBrowserSupported(): boolean {
    return !!window.SpeechRecognition || !!window.webkitSpeechRecognition;
  }

  public startListening(
    onResult: (text: string) => void,
    onError?: (error: string) => void
  ) {
    if (!this.isBrowserSupported()) {
      onError?.('Browser not supported');
      return;
    }

    if (this.isListening) return;

    this.onResult = onResult;
    this.onError = onError || null;
    this.isListening = true;

    try {
      this.recognition?.start();
    } catch (error) {
      this.onError?.(error instanceof Error ? error.message : 'Failed to start listening');
      this.stop();
    }
  }

  public stop() {
    if (!this.isListening) return;

    try {
      this.recognition?.stop();
    } catch (error) {
      console.error('Error stopping recognition:', error);
    }

    this.isListening = false;
    this.onResult = null;
    this.onError = null;
  }
}

export const voiceAuthService = new VoiceAuthService();