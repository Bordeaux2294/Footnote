# consumers.py
from channels.generic.websocket import AsyncWebsocketConsumer
import json

class TranscribeConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        # called when browser opens the WebSocket connection
        # this is where you accept the connection and set up state
        self.session_id = self.scope['url_route']['kwargs']['session_id']
        self.group_name = f"session_{self.session_id}"

        # join a channel group so Celery can send messages to this connection
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # called when browser closes the connection
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    async def receive(self, bytes_data=None, text_data=None):
        # called when browser sends data TO the server
        # this is where audio chunks from the microphone arrive
        if bytes_data:
            # forward audio to Speechmatics
            pass

    # this method is called by Celery to push updates TO the browser
    async def send_update(self, event):
        await self.send(text_data=json.dumps(event['data']))
