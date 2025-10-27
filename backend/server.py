from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
import base64


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()


# Utility Functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        # Fetch user from database
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# Models
class UserBase(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    full_name: str
    email: EmailStr
    phone_number: str
    role: str  # "intern", "employee", "hr"
    gender: Optional[str] = None
    date_of_birth: str
    address: str
    preferred_language: str = "English"
    profile_picture: Optional[str] = None  # Base64 encoded
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class InternCreate(BaseModel):
    # Common fields
    full_name: str
    email: EmailStr
    phone_number: str
    password: str
    gender: Optional[str] = None
    date_of_birth: str
    address: str
    preferred_language: str = "English"
    
    # Intern-specific fields
    educational_institution: str
    current_year_semester: str
    major_field_of_study: str
    internship_start_date: str
    internship_end_date: str
    mentor_assigned: Optional[str] = None
    area_of_interest: str

class EmployeeCreate(BaseModel):
    # Common fields
    full_name: str
    email: EmailStr
    phone_number: str
    password: str
    gender: Optional[str] = None
    date_of_birth: str
    address: str
    preferred_language: str = "English"
    
    # Employee-specific fields
    employee_id: Optional[str] = None
    department: str
    designation: str
    joining_date: str
    reporting_manager: Optional[str] = None
    skills_expertise: str
    bank_account_details: Optional[str] = None

class HRCreate(BaseModel):
    # Common fields
    full_name: str
    email: EmailStr
    phone_number: str
    password: str
    gender: Optional[str] = None
    date_of_birth: str
    address: str
    preferred_language: str = "English"
    
    # HR-specific fields
    hr_access_level: str
    departments_overseen: str
    work_experience: str
    certifications: Optional[str] = None
    office_location: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    token: str
    user: dict

class DashboardStats(BaseModel):
    total_users: int
    total_interns: int
    total_employees: int
    recent_activity: List[dict]


# Routes
@api_router.get("/")
async def root():
    return {"message": "HR Management System API"}

# Authentication Routes
@api_router.post("/auth/signup/intern")
async def signup_intern(intern: InternCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": intern.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_data = intern.model_dump()
    user_data['role'] = 'intern'
    user_data['id'] = str(uuid.uuid4())
    user_data['password'] = hash_password(user_data['password'])
    user_data['created_at'] = datetime.now(timezone.utc).isoformat()
    user_data['profile_picture'] = None
    user_data['resume'] = None
    
    result = await db.users.insert_one(user_data)
    
    # Fetch the user without MongoDB's _id
    created_user = await db.users.find_one({"id": user_data['id']}, {"_id": 0})
    
    # Create token
    token = create_access_token({"sub": created_user['id'], "role": "intern"})
    
    created_user.pop('password')
    return {"token": token, "user": created_user}

@api_router.post("/auth/signup/employee")
async def signup_employee(employee: EmployeeCreate):
    existing_user = await db.users.find_one({"email": employee.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_data = employee.model_dump()
    user_data['role'] = 'employee'
    user_data['id'] = str(uuid.uuid4())
    user_data['password'] = hash_password(user_data['password'])
    user_data['created_at'] = datetime.now(timezone.utc).isoformat()
    user_data['profile_picture'] = None
    user_data['resume'] = None
    
    # Auto-generate employee ID if not provided
    if not user_data.get('employee_id'):
        count = await db.users.count_documents({"role": "employee"})
        user_data['employee_id'] = f"EMP{str(count + 1).zfill(4)}"
    
    await db.users.insert_one(user_data)
    
    # Fetch the user without MongoDB's _id
    created_user = await db.users.find_one({"id": user_data['id']}, {"_id": 0})
    
    token = create_access_token({"sub": created_user['id'], "role": "employee"})
    
    created_user.pop('password')
    return {"token": token, "user": created_user}

@api_router.post("/auth/signup/hr")
async def signup_hr(hr: HRCreate):
    existing_user = await db.users.find_one({"email": hr.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_data = hr.model_dump()
    user_data['role'] = 'hr'
    user_data['id'] = str(uuid.uuid4())
    user_data['password'] = hash_password(user_data['password'])
    user_data['created_at'] = datetime.now(timezone.utc).isoformat()
    user_data['profile_picture'] = None
    
    await db.users.insert_one(user_data)
    
    token = create_access_token({"sub": user_data['id'], "role": "hr"})
    
    user_data.pop('password')
    return {"token": token, "user": user_data}

@api_router.post("/auth/login")
async def login(login_req: LoginRequest):
    user = await db.users.find_one({"email": login_req.email}, {"_id": 0})
    if not user or not verify_password(login_req.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token({"sub": user['id'], "role": user['role']})
    
    user.pop('password')
    return {"token": token, "user": user}

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

# File Upload Routes
@api_router.post("/upload/profile-picture")
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    # Validate file type
    if file.content_type not in ["image/jpeg", "image/jpg", "image/png"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPG, JPEG, PNG allowed")
    
    # Read and encode file
    contents = await file.read()
    encoded = base64.b64encode(contents).decode('utf-8')
    file_data = f"data:{file.content_type};base64,{encoded}"
    
    # Update user profile
    await db.users.update_one(
        {"id": current_user['id']},
        {"$set": {"profile_picture": file_data}}
    )
    
    return {"message": "Profile picture uploaded successfully", "file_data": file_data}

@api_router.post("/upload/resume")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    # Validate file type
    allowed_types = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF, DOC, DOCX allowed")
    
    # Read and encode file
    contents = await file.read()
    encoded = base64.b64encode(contents).decode('utf-8')
    file_data = {
        "filename": file.filename,
        "content_type": file.content_type,
        "data": encoded
    }
    
    # Update user profile
    await db.users.update_one(
        {"id": current_user['id']},
        {"$set": {"resume": file_data}}
    )
    
    return {"message": "Resume uploaded successfully"}

# Dashboard Routes
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    role = current_user['role']
    
    if role == 'hr':
        # HR can see all stats
        total_interns = await db.users.count_documents({"role": "intern"})
        total_employees = await db.users.count_documents({"role": "employee"})
        total_users = total_interns + total_employees
        
        # Get recent users
        recent_users = await db.users.find(
            {},
            {"_id": 0, "password": 0}
        ).sort("created_at", -1).limit(5).to_list(5)
        
        return {
            "total_users": total_users,
            "total_interns": total_interns,
            "total_employees": total_employees,
            "recent_activity": recent_users
        }
    
    elif role == 'employee':
        # Employee can see interns under them
        interns_under_me = await db.users.count_documents({
            "role": "intern",
            "mentor_assigned": current_user['id']
        })
        
        interns_list = await db.users.find(
            {"role": "intern", "mentor_assigned": current_user['id']},
            {"_id": 0, "password": 0}
        ).to_list(100)
        
        return {
            "total_interns_under_me": interns_under_me,
            "interns": interns_list,
            "my_profile": current_user
        }
    
    else:  # intern
        return {
            "my_profile": current_user,
            "internship_progress": 65  # Mock data
        }

@api_router.get("/users")
async def get_users(current_user: dict = Depends(get_current_user)):
    role = current_user['role']
    
    if role == 'hr':
        # HR can see all users
        users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
        return users
    
    elif role == 'employee':
        # Employee can see interns under them
        interns = await db.users.find(
            {"role": "intern", "mentor_assigned": current_user['id']},
            {"_id": 0, "password": 0}
        ).to_list(100)
        return interns
    
    else:
        # Interns can only see themselves
        return [current_user]

@api_router.get("/users/{user_id}")
async def get_user_by_id(user_id: str, current_user: dict = Depends(get_current_user)):
    # Check permissions
    role = current_user['role']
    target_user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Access control
    if role == 'hr':
        return target_user
    elif role == 'employee' and target_user['role'] == 'intern':
        if target_user.get('mentor_assigned') == current_user['id']:
            return target_user
        raise HTTPException(status_code=403, detail="Access denied")
    elif role == 'intern' and user_id == current_user['id']:
        return target_user
    else:
        raise HTTPException(status_code=403, detail="Access denied")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()