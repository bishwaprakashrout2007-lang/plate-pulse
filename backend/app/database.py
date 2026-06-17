import logging
import asyncio
import uuid
from datetime import datetime
from .config import settings

logger = logging.getLogger("platepulse.database")
logging.basicConfig(level=logging.INFO)

# Global database client/reference
db = None
is_mock = False
mock_storage = {}

# Try importing firebase-admin
try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    firebase_installed = True
except ImportError:
    firebase_installed = False
    logger.warning("firebase-admin package is not installed.")

class FirestoreCursor:
    def __init__(self, collection, query):
        self.collection = collection
        self.query = query
        self._sort_key = None
        self._sort_direction = -1
        
    def sort(self, key, direction=-1):
        self._sort_key = key
        self._sort_direction = direction
        return self
        
    async def to_list(self, length=None):
        docs = await self.collection._get_all_docs()
        matched = [doc for doc in docs if self.collection._matches(doc, self.query)]
        if self._sort_key:
            try:
                # Custom sort that tolerates missing keys or type mismatches
                matched = sorted(
                    matched,
                    key=lambda x: x.get(self._sort_key, ""),
                    reverse=(self._sort_direction == -1)
                )
            except Exception as e:
                logger.error(f"Error sorting: {e}")
        if length is not None:
            return matched[:length]
        return matched

class FirestoreCollection:
    def __init__(self, name):
        self.name = name

    def _matches(self, doc, query):
        for q_key, q_val in query.items():
            if isinstance(q_val, dict):
                # Handle operators like $in, $ne, $gte, $lt, $regex
                if "$in" in q_val:
                    if doc.get(q_key) not in q_val["$in"]:
                        return False
                elif "$ne" in q_val:
                    if doc.get(q_key) == q_val["$ne"]:
                        return False
                elif "$gte" in q_val:
                    val = doc.get(q_key)
                    q_v = q_val["$gte"]
                    if val is None:
                        return False
                    if isinstance(val, str) and isinstance(q_v, datetime):
                        try:
                            val = datetime.fromisoformat(val.replace("Z", "+00:00"))
                        except:
                            pass
                    if isinstance(val, str) and not isinstance(q_v, str):
                        q_v = str(q_v)
                    if not (val >= q_v):
                        return False
                elif "$lt" in q_val:
                    val = doc.get(q_key)
                    q_v = q_val["$lt"]
                    if val is None:
                        return False
                    if isinstance(val, str) and isinstance(q_v, datetime):
                        try:
                            val = datetime.fromisoformat(val.replace("Z", "+00:00"))
                        except:
                            pass
                    if isinstance(val, str) and not isinstance(q_v, str):
                        q_v = str(q_v)
                    if not (val < q_v):
                        return False
                elif "$regex" in q_val:
                    import re
                    val = doc.get(q_key, "")
                    pattern = q_val["$regex"]
                    options = q_val.get("$options", "")
                    flags = 0
                    if "i" in options:
                        flags |= re.IGNORECASE
                    if not re.search(pattern, str(val), flags):
                        return False
            else:
                if doc.get(q_key) != q_val:
                    return False
        return True

    def _clean_doc(self, doc):
        if not doc:
            return doc
        cleaned = {}
        for k, v in doc.items():
            # Firestore Timestamp objects have a 'to_datetime' helper
            if v.__class__.__name__ == 'Timestamp' or hasattr(v, 'to_datetime'):
                cleaned[k] = v.to_datetime().replace(tzinfo=None) # Keep naive datetime
            elif isinstance(v, dict):
                cleaned[k] = self._clean_doc(v)
            elif isinstance(v, list):
                cleaned[k] = [self._clean_doc(item) if isinstance(item, dict) else item for item in v]
            else:
                cleaned[k] = v
        return cleaned

    async def _get_all_docs(self):
        global is_mock
        if is_mock or firestore_db is None:
            # Return Mock storage
            if self.name not in mock_storage:
                mock_storage[self.name] = []
            return [dict(doc) for doc in mock_storage[self.name]]

        col_ref = firestore_db.collection(self.name)
        docs_stream = await asyncio.to_thread(col_ref.stream)
        results = []
        for doc in docs_stream:
            d = doc.to_dict()
            d["_id"] = doc.id
            results.append(self._clean_doc(d))
        return results

    async def insert_one(self, document):
        global is_mock
        doc_copy = dict(document)
        doc_id = doc_copy.get("_id") or str(uuid.uuid4())
        doc_copy["_id"] = doc_id
        
        if is_mock or firestore_db is None:
            if self.name not in mock_storage:
                mock_storage[self.name] = []
            mock_storage[self.name].append(doc_copy)
        else:
            doc_ref = firestore_db.collection(self.name).document(doc_id)
            await asyncio.to_thread(doc_ref.set, doc_copy)
            
        class InsertResult:
            inserted_id = doc_id
        return InsertResult()

    async def find_one(self, query):
        global is_mock
        # Direct lookup optimization
        if len(query) == 1 and "_id" in query and isinstance(query["_id"], str):
            doc_id = query["_id"]
            if not is_mock and firestore_db is not None:
                doc_ref = firestore_db.collection(self.name).document(doc_id)
                doc = await asyncio.to_thread(doc_ref.get)
                if doc.exists:
                    d = doc.to_dict()
                    d["_id"] = doc.id
                    return self._clean_doc(d)
                return None
            else:
                # Mock storage
                if self.name not in mock_storage:
                    mock_storage[self.name] = []
                for doc in mock_storage[self.name]:
                    if doc.get("_id") == doc_id:
                        return dict(doc)
                return None
                
        # Stream & match
        docs = await self._get_all_docs()
        for doc in docs:
            if self._matches(doc, query):
                return doc
        return None

    def find(self, query=None):
        query = query or {}
        return FirestoreCursor(self, query)

    async def update_one(self, query, update_query):
        global is_mock
        doc = await self.find_one(query)
        if not doc:
            class UpdateResult:
                matched_count = 0
                modified_count = 0
            return UpdateResult()
            
        doc_id = doc["_id"]
        set_fields = update_query.get("$set", {})
        
        if is_mock or firestore_db is None:
            if self.name in mock_storage:
                for idx, item in enumerate(mock_storage[self.name]):
                    if item.get("_id") == doc_id:
                        for k, v in set_fields.items():
                            mock_storage[self.name][idx][k] = v
                        break
        else:
            doc_ref = firestore_db.collection(self.name).document(doc_id)
            await asyncio.to_thread(doc_ref.update, set_fields)
            
        class UpdateResult:
            matched_count = 1
            modified_count = 1
        return UpdateResult()

    async def delete_one(self, query):
        global is_mock
        doc = await self.find_one(query)
        if not doc:
            class DeleteResult:
                deleted_count = 0
            return DeleteResult()
            
        doc_id = doc["_id"]
        if is_mock or firestore_db is None:
            if self.name in mock_storage:
                for idx, item in enumerate(mock_storage[self.name]):
                    if item.get("_id") == doc_id:
                        mock_storage[self.name].pop(idx)
                        break
        else:
            doc_ref = firestore_db.collection(self.name).document(doc_id)
            await asyncio.to_thread(doc_ref.delete)
            
        class DeleteResult:
            deleted_count = 1
        return DeleteResult()

    async def count_documents(self, query):
        docs = await self._get_all_docs()
        matched = [doc for doc in docs if self._matches(doc, query)]
        return len(matched)

class FirestoreDb:
    def __getattr__(self, name):
        return FirestoreCollection(name)
        
    def __getitem__(self, name):
        return FirestoreCollection(name)

# Initialize db instance
firestore_db = None
db = FirestoreDb()

def init_firebase():
    global firestore_db, is_mock
    if not firebase_installed:
        logger.warning("Firebase Admin is not installed. Using in-memory mock database.")
        is_mock = True
        return False
        
    if firebase_admin._apps:
        try:
            firestore_db = firestore.client()
            logger.info("Firebase Firestore client initialized successfully from existing app.")
            return True
        except Exception as e:
            logger.error(f"Error getting Firestore client: {e}")

    try:
        cred = None
        # Option 1: Direct JSON credentials string
        if settings.FIREBASE_CREDENTIALS_JSON:
            import json
            cred_dict = json.loads(settings.FIREBASE_CREDENTIALS_JSON)
            cred = credentials.Certificate(cred_dict)
            logger.info("Initializing Firebase with credentials JSON from env.")
        # Option 2: Path to JSON file
        elif settings.FIREBASE_SERVICE_ACCOUNT_JSON:
            cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_JSON)
            logger.info(f"Initializing Firebase with service account file: {settings.FIREBASE_SERVICE_ACCOUNT_JSON}")
        else:
            logger.info("No explicit Firebase credentials found. Attempting Application Default Credentials or Project ID...")
            
        if cred:
            firebase_admin.initialize_app(cred)
        else:
            # Fallback initializing with projectId
            firebase_admin.initialize_app(options={'projectId': 'plate-pulse-69281'})
            
        firestore_db = firestore.client()
        logger.info("Firebase Firestore client initialized successfully.")
        return True
    except Exception as e:
        logger.warning(f"Failed to initialize Firebase Admin: {e}. Falling back to in-memory mock database.")
        is_mock = True
        return False

def get_db():
    global db
    return db

async def verify_db_connection():
    global is_mock
    if is_mock:
        return False
    try:
        if firestore_db is None:
            init_firebase()
            
        if firestore_db is not None:
            # Try a quick call to check connection
            await asyncio.to_thread(lambda: list(firestore_db.collections()))
            logger.info("Firebase Firestore connection verified successfully.")
            return True
        else:
            raise Exception("Firestore client is None")
    except Exception as e:
        logger.warning(f"Firebase Firestore connection failed: {e}. Switching to in-memory mock database.")
        is_mock = True
        return False
