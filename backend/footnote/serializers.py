from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Paper, PaperChunk, Session, Sentence, Claim, ClaimSource, SavedPaper


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user


class PaperSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paper
        fields = ['id', 'title', 'authors', 'year', 'citation_count', 'abstract', 'source_url', 'doi']


class ClaimSourceSerializer(serializers.ModelSerializer):
    paper = PaperSerializer(read_only=True)

    class Meta:
        model = ClaimSource
        fields = ['id', 'paper', 'similarity_score', 'excerpt', 'supports']


class ClaimSerializer(serializers.ModelSerializer):
    sources = ClaimSourceSerializer(many=True, read_only=True)
    sentence_content = serializers.CharField(source='sentence.content', read_only=True)
    sentence_order = serializers.IntegerField(source='sentence.order', read_only=True)

    class Meta:
        model = Claim
        fields = ['id', 'sentence_content', 'sentence_order', 'verdict', 'confidence_score', 'summary', 'sources']


class SentenceSerializer(serializers.ModelSerializer):
    claim = ClaimSerializer(read_only=True)

    class Meta:
        model = Sentence
        fields = ['id', 'speaker_id', 'content', 'is_claim', 'order', 'claim']
        read_only_fields = ['order']

    def create(self, validated_data):
        session = validated_data['session']
        last = Sentence.objects.filter(session=session).order_by('order').last()
        validated_data['order'] = (last.order + 1) if last else 0
        return super().create(validated_data)


class SessionSerializer(serializers.ModelSerializer):
    sentences = SentenceSerializer(many=True, read_only=True)

    class Meta:
        model = Session
        fields = ['id', 'title', 'started_at', 'is_active', 'sentences']
        read_only_fields = ['started_at']


class SessionListSerializer(serializers.ModelSerializer):
    claim_count = serializers.SerializerMethodField()

    class Meta:
        model = Session
        fields = ['id', 'title', 'started_at', 'is_active', 'claim_count']

    def get_claim_count(self, obj):
        return obj.claims.count()


class SavedPaperSerializer(serializers.ModelSerializer):
    paper = PaperSerializer(read_only=True)
    paper_id = serializers.PrimaryKeyRelatedField(
        queryset=Paper.objects.all(),
        source='paper',
        write_only=True
    )
    claim_summary = serializers.CharField(source='saved_from_claim.summary', read_only=True)

    class Meta:
        model = SavedPaper
        fields = ['id', 'paper', 'paper_id', 'saved_from_claim', 'claim_summary', 'saved_at']
        read_only_fields = ['saved_at']
