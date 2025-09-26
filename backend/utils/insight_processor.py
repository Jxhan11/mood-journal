"""
Background insight processing for mood entries.
Handles queuing and processing of AI insights for individual entries.
"""

import threading
import time
from flask import current_app
from models.mood_model import MoodEntry
from utils.ai_service import MoodInsightAI, AIServiceError


class InsightProcessor:
    """Handles background processing of AI insights for mood entries."""
    
    def __init__(self, app=None):
        self.ai_service = MoodInsightAI()
        self.processing_thread = None
        self.should_stop = False
        self.app = app
    
    def start_processing(self):
        """Start the background processing thread."""
        if self.processing_thread is None or not self.processing_thread.is_alive():
            self.should_stop = False
            self.processing_thread = threading.Thread(target=self._process_loop, daemon=True)
            self.processing_thread.start()
            if self.app:
                with self.app.app_context():
                    current_app.logger.info("Insight processor started")
            else:
                print("Insight processor started")
    
    def stop_processing(self):
        """Stop the background processing thread."""
        self.should_stop = True
        if self.processing_thread:
            self.processing_thread.join(timeout=5)
            if self.app:
                with self.app.app_context():
                    current_app.logger.info("Insight processor stopped")
            else:
                print("Insight processor stopped")
    
    def _process_loop(self):
        """Main processing loop that runs in background thread."""
        while not self.should_stop:
            if self.app:
                with self.app.app_context():
                    try:
                        # Get entries that need processing
                        unprocessed_entries = MoodEntry.get_unprocessed_entries(limit=5)
                        
                        if not unprocessed_entries:
                            # No entries to process, sleep and check again
                            time.sleep(30)  # Wait 30 seconds before checking again
                            continue
                        
                        # Process each entry
                        for entry in unprocessed_entries:
                            if self.should_stop:
                                break
                            
                            try:
                                self._process_single_entry(entry)
                            except Exception as e:
                                current_app.logger.error(f"Failed to process entry {entry.id}: {e}")
                                entry.mark_ai_processing_failed(str(e))
                        
                        # Short delay between batches
                        time.sleep(10)
                        
                    except Exception as e:
                        current_app.logger.error(f"Error in insight processing loop: {e}")
                        time.sleep(60)  # Wait longer if there's an error
            else:
                print("No app context available, stopping processor")
                break
    
    def _process_single_entry(self, entry):
        """Process a single entry to generate AI insight."""
        current_app.logger.info(f"Processing insight for entry: {entry.id}")
        
        # Check if AI service is available
        if not self.ai_service.is_available():
            raise AIServiceError("AI service not available")
        
        # Generate insight
        insight = self.ai_service.generate_insight(
            mood_emotion=entry.mood.emotion if entry.mood else "neutral",
            mood_emoji=entry.mood.emoji if entry.mood else "😐",
            text_note=entry.text_note
        )
        
        # Save the insight
        entry.mark_ai_processing_complete(insight)
        current_app.logger.info(f"Insight generated for entry: {entry.id}")


# Global processor instance
_processor = None

def get_processor(app=None):
    """Get the global insight processor instance."""
    global _processor
    if _processor is None:
        _processor = InsightProcessor(app)
    return _processor

def start_insight_processor(app=None):
    """Start the background insight processor."""
    processor = get_processor(app)
    processor.start_processing()

def stop_insight_processor():
    """Stop the background insight processor."""
    processor = get_processor()
    processor.stop_processing()

def queue_insight_generation(entry_id):
    """Queue an entry for insight generation (no-op since we use polling)."""
    # For now, we use a polling approach where the processor checks for unprocessed entries
    # In a production environment, you might want to use a proper task queue like Celery
    try:
        current_app.logger.info(f"Entry {entry_id} queued for insight generation")
    except RuntimeError:
        print(f"Entry {entry_id} queued for insight generation")
    
    # Ensure the processor is running
    processor = get_processor()
    if processor.processing_thread is None or not processor.processing_thread.is_alive():
        processor.start_processing()

def process_entry_insight_sync(entry_id, app=None):
    """Process a single entry insight synchronously (for testing/manual processing)."""
    try:
        entry = MoodEntry.objects(id=entry_id).first()
        if not entry:
            raise ValueError(f"Entry not found: {entry_id}")
        
        processor = get_processor(app)
        if app:
            with app.app_context():
                processor._process_single_entry(entry)
        else:
            processor._process_single_entry(entry)
        return True
    except Exception as e:
        try:
            current_app.logger.error(f"Failed to process entry insight: {e}")
        except RuntimeError:
            print(f"Failed to process entry insight: {e}")
        return False
