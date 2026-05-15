import deepgram
import os
from dotenv import load_dotenv

load_dotenv()

def list_members(obj, name, depth=0):
    if depth > 2:
        return
    print(f"{'  ' * depth}{name}")
    for member in dir(obj):
        if not member.startswith('_'):
            try:
                sub_obj = getattr(obj, member)
                if hasattr(sub_obj, '__module__') and sub_obj.__module__.startswith('deepgram'):
                    list_members(sub_obj, member, depth + 1)
                else:
                    print(f"{'  ' * (depth + 1)}{member} (type: {type(sub_obj)})")
            except:
                pass

print("Members of deepgram package:")
for member in dir(deepgram):
    if not member.startswith('_'):
        print(f"- {member}")

try:
    from deepgram import DeepgramClient
    client = DeepgramClient(os.getenv("DEEPGRAM_API_KEY"))
    print("\nClient listen structure:")
    print(f"listen: {dir(client.listen)}")
    if hasattr(client.listen, 'v1'):
        print(f"listen.v1: {dir(client.listen.v1)}")
    if hasattr(client.listen, 'rest'):
        print(f"listen.rest: {dir(client.listen.rest)}")
except Exception as e:
    print(f"Error: {e}")
