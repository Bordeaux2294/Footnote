from django.db import models
from django.contrib.auth.models import User
from pgvector.django import VectorField, HnswIndex


class Paper(models.Model):
    title = models.CharField(max_length=500)
    authors = models.JSONField(default=list)
    year = models.IntegerField(null=True, blank=True)
    citation_count = models.IntegerField(default=0)
    abstract = models.TextField()
    source_url = models.URLField(null=True, blank=True)
    doi = models.CharField(max_length=200, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class PaperChunk(models.Model):
    paper = models.ForeignKey(
        Paper,
        on_delete=models.CASCADE,
        related_name='chunks'
    )
    content = models.TextField()
    chunk_index = models.IntegerField()
    embedding = VectorField(dimensions=384)

    class Meta:
        ordering = ['chunk_index']
        indexes = [
            HnswIndex(
                name='chunk_embedding_index',
                fields=['embedding'],
                m=16,
                ef_construction=64,
                opclasses=['vector_cosine_ops']
            )
        ]

    def __str__(self):
        return f"{self.paper.title} — chunk {self.chunk_index}"


class Session(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    title = models.CharField(max_length=200, blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.username} — {self.started_at}"


class Sentence(models.Model):
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='sentences')
    speaker_id = models.CharField(max_length=100, null=True, blank=True)
    content = models.TextField()
    is_claim = models.BooleanField(default=False)
    order = models.PositiveIntegerField()

    class Meta:
        ordering = ['order']
        unique_together = ['session', 'order']

    def __str__(self):
        return f"Session {self.session.id} — [{self.order}] {self.content[:60]}"


class Claim(models.Model):

    class Verdict(models.TextChoices):
        SUPPORTED = 'supported', 'Supported'
        CONTRADICTED = 'contradicted', 'Contradicted'
        INCONCLUSIVE = 'inconclusive', 'Inconclusive'
        MISLEADING = 'misleading', 'Misleading'
        PENDING = 'pending', 'Pending'

    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='claims')
    sentence = models.OneToOneField(Sentence, on_delete=models.CASCADE, related_name='claim')
    verdict = models.CharField(max_length=20, choices=Verdict.choices, default=Verdict.PENDING)
    confidence_score = models.FloatField(null=True, blank=True)
    summary = models.TextField(blank=True)
    papers = models.ManyToManyField(Paper, through='ClaimSource', blank=True)

    def __str__(self):
        return f"{self.verdict} — {self.sentence.content[:60]}"


class ClaimSource(models.Model):
    claim = models.ForeignKey(Claim, on_delete=models.CASCADE, related_name='sources')
    paper = models.ForeignKey(Paper, on_delete=models.CASCADE)
    similarity_score = models.FloatField()
    excerpt = models.TextField()
    supports = models.BooleanField()

    class Meta:
        ordering = ['-similarity_score']


class SavedPaper(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_papers')
    paper = models.ForeignKey(Paper, on_delete=models.CASCADE, related_name='saved_by')
    saved_from_claim = models.ForeignKey(Claim, on_delete=models.SET_NULL, null=True, blank=True)
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'paper']
