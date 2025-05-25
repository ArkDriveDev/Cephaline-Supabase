export class VoiceAuthService {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private onResultCallback: ((password: string) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;

  constructor() {
    this.initializeRecognition();
  }

  private initializeRecognition() {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      throw new Error('Speech recognition not supported in this browser');
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event) => {
      const result = event.results[0][0];
      this.onResultCallback?.(result.transcript.trim());
      this.stop();
    };

    this.recognition.onerror = (event) => {
      const errorEvent = event as SpeechRecognitionErrorEvent;
      this.onErrorCallback?.(errorEvent.error);
      this.stop();
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };
  }

  startListening(
    onResult: (password: string) => void,
    onError?: (error: string) => void
  ) {
    if (this.isListening) return;

    this.onResultCallback = onResult;
    this.onErrorCallback = onError || null;
    this.isListening = true;
    
    try {
      this.recognition?.start();
    } catch (error) {
      this.onErrorCallback?.(error instanceof Error ? error.message : String(error));
      this.stop();
    }
  }

  stop() {
    if (!this.isListening) return;
    
    try {
      this.recognition?.stop();
    } catch (error) {
      console.error('Error stopping recognition:', error);
    }
    
    this.isListening = false;
  }

  async verifyVoicePassword(userId: string, spokenPassword: string): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/verify-voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          spokenPassword
        }),
      });

      if (!response.ok) throw new Error('Verification failed');

      const data = await response.json();
      return data.verified;
    } catch (error) {
      console.error('Verification error:', error);
      return false;
    }
  }
}

// Singleton instance
export const voiceAuthService = new VoiceAuthService();