import openai
from flask import current_app
from datetime import datetime
import json

class AIServiceError(Exception):
    pass

class MoodInsightAI:

    def __init__(self):
        self.client = None
        api_key = current_app.config['OPENAI_API_KEY']
        if api_key:
            self.client = openai.OpenAI(api_key=api_key)

        else:
            current_app.logger.warning("open api key is not set")

    
    def is_available(self):
        return self.client is not None

    def generate_insight(self, mood_emotion, mood_emoji=None, text_note=None, audio_transcript=None, user_context=None):
        if not self.is_available():
            raise AIServiceError("OpenAI client is not available")

        try:
            prompt = self.build_prompt(mood_emotion, mood_emoji, text_note, audio_transcript, user_context)
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": self._get_system_prompt()},
                    {
                        'role' : 'user',
                        'content' : prompt
                    }
                    ],
                max_tokens=200,
                temperature=0.7,
            )

            insight = response.choices[0].message.content.strip()
            current_app.logger.info(f"AI insight generated successfully, length: {len(insight)} chars")
            return insight
        except openai.RateLimitError as e:
            error_msg = f"Rate limit exceeded. Please try again later. {e}"
            current_app.logger.warning(f"OpenAI rate limit: {e}")
            raise AIServiceError(error_msg)
        except Exception as e:
            raise AIServiceError(f"Error generating insight: {e}")

    def _get_system_prompt(self):
       return """You are a compassionate AI assistant specializing in emotional well-being and mental health support. Your role is to provide gentle, supportive insights about mood patterns and emotional experiences.

Guidelines:
- Keep responses to 2-3 sentences maximum
- Focus on actionable, positive guidance
- Be empathetic and non-judgmental
- Avoid giving medical advice
- Highlight patterns and suggest healthy coping strategies
- Use warm, encouraging language
- If mood is low, offer gentle support and suggestions
- If mood is high, celebrate while encouraging balance

Remember: You're providing supportive insights, not therapy or medical advice.""" 

    def _build_insight_prompt(self, mood_emotion, mood_emoji=None, text_note=None, audio_transcript=None, user_context=None):
        mood_descriptions = {
            "happy": "Feeling joyful and positive",
            "sad": "Experiencing sadness or melancholy", 
            "neutral": "Feeling balanced and calm",
            "angry": "Experiencing frustration or anger",
            "anxious": "Feeling worried or anxious"
        }

        mood_description = mood_descriptions.get(mood_emotion, "Unknown emotion")
        
        # Build the prompt
        prompt_parts = [
            "Please provide a supportive insight based on this mood entry:",
            f"Emotion: {mood_emotion.title()} {mood_emoji or ''} ({mood_description})"
        ]
        
        # Add text reflection if provided
        if text_note and text_note.strip():
            prompt_parts.extend([
                f"Reflection: {text_note.strip()}"
            ])
        
        # Add audio transcript if provided
        if audio_transcript and audio_transcript.strip():
            prompt_parts.extend([
                f"Voice Note: {audio_transcript.strip()}"
            ])
        
        # Add user context if provided (for future personalization)
        if user_context:
            prompt_parts.extend([
                f"Context: {user_context}"
            ])

        # If no content provided, note it
        if not text_note and not audio_transcript:
            prompt_parts.append("Note: No additional reflection provided, only emotion selected.")
        
        prompt_parts.append("\nProvide a brief, encouraging insight (2-3 sentences max):")
        
        return "\n".join(prompt_parts)
    
    def build_prompt(self, mood_emotion, mood_emoji=None, text_note=None, audio_transcript=None, user_context=None):
        """Main method that delegates to _build_insight_prompt for backwards compatibility"""
        return self._build_insight_prompt(mood_emotion, mood_emoji, text_note, audio_transcript, user_context)

    def generate_weekly_summary(self, entries):
        
        if not self.is_available():
            raise AIServiceError('AI service not configured')
        
        if not entries:
            return "No mood entries this week to analyze."

        try:
            # Prepare data for weekly analysis
            mood_data = []
            for entry in entries:
                entry_data = {
                    'date': entry.entry_date.strftime('%A, %B %d'),
                    'mood': f"{entry.mood.emotion} {entry.mood.emoji}" if entry.mood else "neutral 😐",
                    'note': entry.text_note[:100] if entry.text_note else None  # Truncate for API limits
                }
                mood_data.append(entry_data)
            
            # Build weekly prompt
            prompt = self._build_weekly_prompt(mood_data)
            
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an AI assistant that analyzes weekly mood patterns and provides supportive summaries. Focus on trends, patterns, and gentle encouragement."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=300,
                temperature=0.7
            )
            summary = response.choices[0].message.content.strip()
            current_app.logger.info(f"Weekly summary generated, length: {len(summary)} chars")
            
            return summary
            
        except Exception as e:
            current_app.logger.error(f"Weekly summary error: {e}")
            raise AIServiceError("Failed to generate weekly summary")


    def _build_weekly_prompt(self, mood_data):
        """Build prompt for weekly mood summary"""
        
        prompt_parts = [
            "Analyze this week's mood entries and provide a supportive weekly summary:",
            ""
        ]
        
        for entry in mood_data:
            line = f"• {entry['date']}: Mood {entry['mood']}/5"
            if entry['note']:
                line += f" - {entry['note']}"
            prompt_parts.append(line)
        
        prompt_parts.extend([
            "",
            "Please provide:",
            "1. Overall mood trend for the week",
            "2. Any patterns you notice", 
            "3. Encouraging insights or gentle suggestions",
            "",
            "Keep response to 3-4 sentences maximum."
        ])
        
        return "\n".join(prompt_parts)

    def test_connection(self):
        """Test OpenAI API connection"""
        if not self.is_available():
            return False, "API key not configured"
        
        try:
            # Make a simple test request
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "user", "content": "Say 'Hello' if you can hear me."}
                ],
                max_tokens=10
            )
            
            return True, "Connection successful"
            
        except Exception as e:
            return False, f"Connection failed: {str(e)}"