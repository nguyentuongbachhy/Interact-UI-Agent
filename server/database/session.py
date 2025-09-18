from .base import SessionLocal

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    from .base import Base, engine
    # Import all models to ensure relationships are resolved
    import models  # This imports all models
    Base.metadata.create_all(bind=engine)