from django.contrib import admin
from .models import Paper, PaperChunk, Session, Sentence, Claim, ClaimSource, SavedPaper


@admin.register(Paper)
class PaperAdmin(admin.ModelAdmin):
    list_display = ['title', 'year', 'citation_count', 'created_at']
    search_fields = ['title', 'authors', 'doi']
    list_filter = ['year']
    ordering = ['-created_at']


@admin.register(PaperChunk)
class PaperChunkAdmin(admin.ModelAdmin):
    list_display = ['paper', 'chunk_index']
    search_fields = ['paper__title', 'content']
    ordering = ['paper', 'chunk_index']


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ['user', 'title', 'started_at', 'is_active']
    search_fields = ['user__username', 'title']
    list_filter = ['is_active']
    ordering = ['-started_at']


@admin.register(Sentence)
class SentenceAdmin(admin.ModelAdmin):
    list_display = ['session', 'order', 'is_claim', 'speaker_id', 'content_preview']
    search_fields = ['session__id', 'content']
    list_filter = ['is_claim']
    ordering = ['session', 'order']

    def content_preview(self, obj):
        return obj.content[:60]
    content_preview.short_description = 'Content'


@admin.register(Claim)
class ClaimAdmin(admin.ModelAdmin):
    list_display = ['session', 'verdict', 'confidence_score', 'sentence_preview']
    search_fields = ['sentence__content', 'summary']
    list_filter = ['verdict']
    ordering = ['-id']

    def sentence_preview(self, obj):
        return obj.sentence.content[:60]
    sentence_preview.short_description = 'Sentence'


@admin.register(ClaimSource)
class ClaimSourceAdmin(admin.ModelAdmin):
    list_display = ['claim', 'paper', 'similarity_score', 'supports']
    search_fields = ['paper__title', 'excerpt']
    list_filter = ['supports']
    ordering = ['-similarity_score']


@admin.register(SavedPaper)
class SavedPaperAdmin(admin.ModelAdmin):
    list_display = ['user', 'paper', 'saved_at']
    search_fields = ['user__username', 'paper__title']
    ordering = ['-saved_at']
