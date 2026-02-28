import uuid
from datetime import datetime
from threading import Lock

_applications = []
_lock = Lock()


def add_application(data):
    print("Incoming data:", data)
    print("Current applications:", _applications)
    required_fields = ['company', 'role', 'status']

    for field in required_fields:
        if field not in data:
            raise ValueError(f"Missing required field: {field}")

    application = {
        'id': str(uuid.uuid4()),
        'company': data['company'],
        'role': data['role'],
        'status': data['status'],
        'notes': data.get('notes', ''),
        'created_at': datetime.utcnow().isoformat()
    }

    with _lock:
        _applications.append(application)

    return get_all_applications()


def delete_application(app_id):
    with _lock:
        _applications[:] = [a for a in _applications if a['id'] != app_id]

    return get_all_applications()


def get_all_applications():
    with _lock:
        return list(_applications)