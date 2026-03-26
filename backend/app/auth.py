from passlib.context import CryptContext
from datetime import datetime,timedelta,timezone
from jose import jwt
from app.config import ACCESS_TOKEN_EXPIRE_MINUTES,ALGORITHM,SECRET_KEY
from fastapi import Depends,HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session,select
from app.database import get_session
from app.models import User


pwd_context=CryptContext(schemes=["bcrypt"],deprecated="auto")

def verify_password(plain_password,hashed_password):
    return pwd_context.verify(plain_password,hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_and_update(plain_password, hashed_password):
    return pwd_context.verify_and_update(plain_password, hashed_password)

def create_access_token(data:dict):
    to_encode=data.copy()
    expire=datetime.now(timezone.utc)+timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp":expire})

    encoded_jwt=jwt.encode(to_encode,SECRET_KEY,algorithm=ALGORITHM)
    return encoded_jwt

oauth2_scheme=OAuth2PasswordBearer(tokenUrl="/api/login")

'''
This function validates a JWT token by decoding it, extracting the user ID, and fetching the corresponding user from the database. If the token is invalid or the user doesn’t exist, it raises an authentication error, otherwise it returns the authenticated user for use in protected routes.
'''
#security guard that stops people from making predictions if they aren't logged in.
def get_current_user(token:str = Depends(oauth2_scheme),session:Session=Depends(get_session)):
    try:
        payload=jwt.decode(token,SECRET_KEY,algorithms=[ALGORITHM])
        user_id_str=payload.get("sub")
        if user_id_str is None:
            raise HTTPException(status_code=401,detail="Invalid Token")
        user=session.exec(select(User).where(User.id == int(user_id_str))).first()
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
            
        return user
    except jwt.JWTError:
        raise HTTPException(status_code=401,detail="Could not validate credentials")
