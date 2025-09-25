import pytest
import json
from app import create_app

@pytest.fixture
def app():
    app=create_app()
    app.config.update({
        'TESTING':True
    })

    return app

@pytest.fixture
def client(app):
    return app.test_client()

def test_home_route(client):
    res = client.get('/')
    assert res.status_code == 200
    data=json.loads(res.data)
    assert 'message' in data
    # assert 'status' in data