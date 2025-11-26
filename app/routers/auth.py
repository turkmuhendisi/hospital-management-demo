"""
Authentication routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import TokenResponse, LoginRequest
from ..services.auth_service import AuthService
from ..models import User

router = APIRouter(prefix="/api/auth", tags=["authentication"])


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Login endpoint - returns JWT token
    
    For demo purposes, accepts any username/password and returns a demo token
    In production, this would validate against database
    """
    # For demo: accept demo credentials
    if request.username.startswith("demo"):
        # Create demo token
        token = AuthService.create_demo_user_token(
            user_id="demo-user-001",
            user_name="Demo User",
            role="admin"
        )
        
        return TokenResponse(access_token=token)
    
    # Try to find user in database
    user = db.query(User).filter(User.email == request.username).first()
    
    if not user:
        # For demo: create a token anyway
        token = AuthService.create_demo_user_token(
            user_id="user-001",
            user_name=request.username,
            role="radiologist"
        )
        return TokenResponse(access_token=token)
    
    # In production, verify password here
    # if not AuthService.verify_password(request.password, user.hashed_password):
    #     raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create token
    token = AuthService.create_access_token(
        data={
            "sub": user.id,
            "name": user.name,
            "role": user.role,
        }
    )
    
    return TokenResponse(access_token=token)


@router.post("/demo-token", response_model=TokenResponse)
async def get_demo_token():
    """
    Get a demo token for testing without credentials
    """
    token = AuthService.create_demo_user_token(
        user_id="demo-admin",
        user_name="Demo Admin",
        role="admin"
    )
    
    return TokenResponse(access_token=token)

