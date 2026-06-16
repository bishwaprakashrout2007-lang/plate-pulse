import logging
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from .config import settings
import uuid

logger = logging.getLogger("platepulse.database")
logging.basicConfig(level=logging.INFO)

# Global database clients
client = None
db = None
is_mock = False
mock_storage = {}

class MockCursor:
    def __init__(self, data):
        self.data = data
        
    async def to_list(self, length=None):
        if length is not None:
            return self.data[:length]
        return self.data
        
    def sort(self, key, direction=-1):
        try:
            self.data = sorted(self.data, key=lambda x: x.get(key, ""), reverse=(direction == -1))
        except Exception as e:
            logger.error(f"Error sorting mock cursor: {e}")
        return self

class MockCollection:
    def __init__(self, name):
        self.name = name
        if name not in mock_storage:
            mock_storage[name] = []
            
    async def insert_one(self, document):
        if "_id" not in document:
            document["_id"] = str(uuid.uuid4())
        # Make a copy to avoid mutation reference issues
        doc_copy = dict(document)
        mock_storage[self.name].append(doc_copy)
        class InsertResult:
            inserted_id = doc_copy["_id"]
        return InsertResult()

    async def find_one(self, query):
        for doc in mock_storage[self.name]:
            if self._matches(doc, query):
                return dict(doc)
        return None

    def find(self, query=None):
        query = query or {}
        matches = []
        for doc in mock_storage[self.name]:
            if self._matches(doc, query):
                matches.append(dict(doc))
        return MockCursor(matches)

    async def update_one(self, query, update_query):
        # Find index
        target_idx = -1
        for i, doc in enumerate(mock_storage[self.name]):
            if self._matches(doc, query):
                target_idx = i
                break
                
        if target_idx == -1:
            class UpdateResult:
                matched_count = 0
                modified_count = 0
            return UpdateResult()
            
        doc = mock_storage[self.name][target_idx]
        set_fields = update_query.get("$set", {})
        for k, v in set_fields.items():
            doc[k] = v
            
        class UpdateResult:
            matched_count = 1
            modified_count = 1
        return UpdateResult()

    async def delete_one(self, query):
        for i, doc in enumerate(mock_storage[self.name]):
            if self._matches(doc, query):
                mock_storage[self.name].pop(i)
                class DeleteResult:
                    deleted_count = 1
                return DeleteResult()
        class DeleteResult:
            deleted_count = 0
        return DeleteResult()

    async def count_documents(self, query):
        count = 0
        for doc in mock_storage[self.name]:
            if self._matches(doc, query):
                count += 1
        return count

    def _matches(self, doc, query):
        for q_key, q_val in query.items():
            if isinstance(q_val, dict):
                # Handle operators like $in, $ne
                if "$in" in q_val:
                    if doc.get(q_key) not in q_val["$in"]:
                        return False
                elif "$ne" in q_val:
                    if doc.get(q_key) == q_val["$ne"]:
                        return False
            else:
                if doc.get(q_key) != q_val:
                    return False
        return True

class MockDatabase:
    def __getitem__(self, name):
        return MockCollection(name)

# Initialize database connection
try:
    logger.info(f"Connecting to MongoDB at {settings.MONGO_URI}...")
    client = AsyncIOMotorClient(settings.MONGO_URI, serverSelectionTimeoutMS=1500)
    db = client[settings.DB_NAME]
    
    # We will verify connection asynchronously using a helper method or let endpoints handle it.
    # To run a simple ping check:
    # Note: loop is checked during import, we verify connection inside main.py on startup.
except Exception as e:
    logger.warning(f"Could not connect to MongoDB: {e}. Initializing in-memory mock database.")
    db = MockDatabase()
    is_mock = True

def get_db():
    global db
    return db

async def verify_db_connection():
    global db, is_mock, client
    if is_mock:
        return False
    try:
        # Run a quick ping command
        await client.admin.command('ping')
        logger.info("MongoDB connection verified successfully.")
        return True
    except Exception as e:
        logger.warning(f"MongoDB ping failed: {e}. Switching to in-memory mock database.")
        db = MockDatabase()
        is_mock = True
        return False
