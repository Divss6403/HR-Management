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
    
    # Fetch the user without MongoDB's _id
    created_user = await db.users.find_one({"id": user_data['id']}, {"_id": 0})
    
    token = create_access_token({"sub": created_user['id'], "role": "hr"})
    
    created_user.pop('password')
    return {"token": token, "user": created_user}

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


# ==================== ONBOARDING MODULE ====================

class OnboardingStatus(BaseModel):
    user_id: str
    application_status: str = "Under Review"  # Under Review, Selected, Rejected
    offer_letter: Optional[str] = None
    onboarding_checklist: List[dict] = []
    documents_submitted: List[dict] = []
    background_verification: str = "Pending"  # Pending, In Progress, Completed, Failed
    welcome_message: str = ""
    hr_contact: str = ""

@api_router.post("/onboarding/create")
async def create_onboarding(user_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'hr':
        raise HTTPException(status_code=403, detail="Only HR can create onboarding records")
    
    onboarding = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "application_status": "Under Review",
        "offer_letter": None,
        "onboarding_checklist": [
            {"item": "Submit ID Proof", "completed": False},
            {"item": "Submit Resume", "completed": False},
            {"item": "Submit College ID", "completed": False},
            {"item": "Complete Background Verification", "completed": False},
            {"item": "Sign Agreement", "completed": False}
        ],
        "documents_submitted": [],
        "background_verification": "Pending",
        "welcome_message": "Welcome to our company! We're excited to have you join our team.",
        "hr_contact": "hr@company.com",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.onboarding.insert_one(onboarding)
    
    # Return without MongoDB _id
    onboarding.pop('_id', None)
    return {"message": "Onboarding record created", "data": onboarding}

@api_router.get("/onboarding/{user_id}")
async def get_onboarding(user_id: str, current_user: dict = Depends(get_current_user)):
    # Check permissions
    if current_user['role'] not in ['hr'] and current_user['id'] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    onboarding = await db.onboarding.find_one({"user_id": user_id}, {"_id": 0})
    if not onboarding:
        return {"message": "No onboarding record found", "data": None}
    return onboarding

@api_router.put("/onboarding/update/{user_id}")
async def update_onboarding(user_id: str, updates: dict, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'hr':
        raise HTTPException(status_code=403, detail="Only HR can update onboarding")
    
    await db.onboarding.update_one(
        {"user_id": user_id},
        {"$set": updates}
    )
    return {"message": "Onboarding updated successfully"}


# ==================== PAYROLL MODULE ====================

class PayrollCreate(BaseModel):
    user_id: str
    salary_type: str  # Monthly, One-time
    amount: float
    payment_schedule: str  # Monthly, Bi-weekly, etc.
    bank_account: str

@api_router.post("/payroll/create")
async def create_payroll(payroll: PayrollCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'hr':
        raise HTTPException(status_code=403, detail="Only HR can create payroll records")
    
    payroll_data = {
        "id": str(uuid.uuid4()),
        "user_id": payroll.user_id,
        "salary_type": payroll.salary_type,
        "amount": payroll.amount,
        "payment_schedule": payroll.payment_schedule,
        "bank_account": payroll.bank_account,
        "payment_history": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.payroll.insert_one(payroll_data)
    payroll_data.pop('_id', None)
    return {"message": "Payroll record created", "data": payroll_data}

@api_router.get("/payroll/{user_id}")
async def get_payroll(user_id: str, current_user: dict = Depends(get_current_user)):
    # Check permissions
    if current_user['role'] not in ['hr'] and current_user['id'] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    payroll = await db.payroll.find_one({"user_id": user_id}, {"_id": 0})
    if not payroll:
        return {"message": "No payroll record found", "data": None}
    return payroll

@api_router.post("/payroll/add-payment/{user_id}")
async def add_payment(user_id: str, payment: dict, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'hr':
        raise HTTPException(status_code=403, detail="Only HR can add payments")
    
    payment_record = {
        "id": str(uuid.uuid4()),
        "amount": payment.get("amount"),
        "payment_date": payment.get("payment_date"),
        "status": payment.get("status", "Paid"),
        "slip_url": payment.get("slip_url", ""),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.payroll.update_one(
        {"user_id": user_id},
        {"$push": {"payment_history": payment_record}}
    )
    return {"message": "Payment added successfully"}


# ==================== PERFORMANCE MODULE ====================

class PerformanceGoal(BaseModel):
    user_id: str
    title: str
    description: str
    target_date: str
    assigned_by: str

@api_router.post("/performance/goal/create")
async def create_goal(goal: PerformanceGoal, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['hr', 'employee']:
        raise HTTPException(status_code=403, detail="Only HR or Employees can set goals")
    
    goal_data = {
        "id": str(uuid.uuid4()),
        "user_id": goal.user_id,
        "title": goal.title,
        "description": goal.description,
        "target_date": goal.target_date,
        "assigned_by": current_user['id'],
        "status": "In Progress",
        "completed_date": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.goals.insert_one(goal_data)
    return {"message": "Goal created successfully", "data": goal_data}

@api_router.get("/performance/goals/{user_id}")
async def get_goals(user_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['hr', 'employee'] and current_user['id'] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    goals = await db.goals.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    return goals

class Task(BaseModel):
    user_id: str
    title: str
    description: str
    due_date: str
    priority: str  # High, Medium, Low

@api_router.post("/performance/task/create")
async def create_task(task: Task, current_user: dict = Depends(get_current_user)):
    task_data = {
        "id": str(uuid.uuid4()),
        "user_id": task.user_id,
        "title": task.title,
        "description": task.description,
        "due_date": task.due_date,
        "priority": task.priority,
        "status": "Pending",
        "assigned_by": current_user['id'],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.tasks.insert_one(task_data)
    return {"message": "Task created successfully", "data": task_data}

@api_router.get("/performance/tasks/{user_id}")
async def get_tasks(user_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['hr', 'employee'] and current_user['id'] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    tasks = await db.tasks.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    return tasks

@api_router.put("/performance/task/update/{task_id}")
async def update_task(task_id: str, updates: dict, current_user: dict = Depends(get_current_user)):
    await db.tasks.update_one(
        {"id": task_id},
        {"$set": updates}
    )
    return {"message": "Task updated successfully"}

class Feedback(BaseModel):
    user_id: str
    feedback_type: str  # Self-Review, Mentor-Review
    content: str
    rating: Optional[int] = None

@api_router.post("/performance/feedback/create")
async def create_feedback(feedback: Feedback, current_user: dict = Depends(get_current_user)):
    feedback_data = {
        "id": str(uuid.uuid4()),
        "user_id": feedback.user_id,
        "feedback_type": feedback.feedback_type,
        "content": feedback.content,
        "rating": feedback.rating,
        "given_by": current_user['id'],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.feedback.insert_one(feedback_data)
    return {"message": "Feedback submitted successfully", "data": feedback_data}

@api_router.get("/performance/feedback/{user_id}")
async def get_feedback(user_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['hr', 'employee'] and current_user['id'] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    feedbacks = await db.feedback.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    return feedbacks


# ==================== ATTENDANCE MODULE ====================

@api_router.post("/attendance/checkin")
async def check_in(current_user: dict = Depends(get_current_user)):
    today = datetime.now(timezone.utc).date().isoformat()
    
    # Check if already checked in today
    existing = await db.attendance.find_one({
        "user_id": current_user['id'],
        "date": today
    })
    
    if existing and existing.get('check_in'):
        raise HTTPException(status_code=400, detail="Already checked in today")
    
    attendance = {
        "id": str(uuid.uuid4()),
        "user_id": current_user['id'],
        "date": today,
        "check_in": datetime.now(timezone.utc).isoformat(),
        "check_out": None,
        "status": "Present",
        "hours_worked": 0
    }
    
    await db.attendance.insert_one(attendance)
    return {"message": "Checked in successfully", "time": attendance['check_in']}

@api_router.post("/attendance/checkout")
async def check_out(current_user: dict = Depends(get_current_user)):
    today = datetime.now(timezone.utc).date().isoformat()
    
    attendance = await db.attendance.find_one({
        "user_id": current_user['id'],
        "date": today
    })
    
    if not attendance:
        raise HTTPException(status_code=400, detail="No check-in found for today")
    
    if attendance.get('check_out'):
        raise HTTPException(status_code=400, detail="Already checked out today")
    
    check_out_time = datetime.now(timezone.utc)
    check_in_time = datetime.fromisoformat(attendance['check_in'])
    hours_worked = (check_out_time - check_in_time).total_seconds() / 3600
    
    await db.attendance.update_one(
        {"id": attendance['id']},
        {"$set": {
            "check_out": check_out_time.isoformat(),
            "hours_worked": round(hours_worked, 2)
        }}
    )
    
    return {"message": "Checked out successfully", "hours_worked": round(hours_worked, 2)}

@api_router.get("/attendance/overview/{user_id}")
async def get_attendance_overview(user_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['hr', 'employee'] and current_user['id'] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get all attendance records for the user
    records = await db.attendance.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    
    # Calculate stats
    total_days = len(records)
    present_days = len([r for r in records if r.get('status') == 'Present'])
    total_hours = sum(r.get('hours_worked', 0) for r in records)
    
    # Get leaves
    leaves = await db.leaves.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    leave_taken = len([l for l in leaves if l.get('status') == 'Approved'])
    
    return {
        "total_days": total_days,
        "present_days": present_days,
        "leave_taken": leave_taken,
        "total_hours": round(total_hours, 2),
        "attendance_records": records[-30:],  # Last 30 records
        "attendance_percentage": round((present_days / max(total_days, 1)) * 100, 2)
    }

class LeaveRequest(BaseModel):
    start_date: str
    end_date: str
    reason: str
    leave_type: str  # Sick, Casual, Vacation

@api_router.post("/attendance/leave/apply")
async def apply_leave(leave: LeaveRequest, current_user: dict = Depends(get_current_user)):
    leave_data = {
        "id": str(uuid.uuid4()),
        "user_id": current_user['id'],
        "start_date": leave.start_date,
        "end_date": leave.end_date,
        "reason": leave.reason,
        "leave_type": leave.leave_type,
        "status": "Pending",  # Pending, Approved, Rejected
        "applied_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.leaves.insert_one(leave_data)
    return {"message": "Leave application submitted successfully", "data": leave_data}

@api_router.get("/attendance/leaves/{user_id}")
async def get_leaves(user_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['hr', 'employee'] and current_user['id'] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    leaves = await db.leaves.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    return leaves

@api_router.put("/attendance/leave/approve/{leave_id}")
async def approve_leave(leave_id: str, status: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['hr', 'employee']:
        raise HTTPException(status_code=403, detail="Only HR or Managers can approve leaves")
    
    await db.leaves.update_one(
        {"id": leave_id},
        {"$set": {"status": status, "approved_by": current_user['id']}}
    )
    return {"message": f"Leave {status.lower()} successfully"}

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