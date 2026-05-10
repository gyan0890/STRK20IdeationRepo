from pydantic import BaseModel

class SubmitRequest(BaseModel):
    name: str
    contact_type: str  # "email" | "telegram" | "wallet"
    contact_value: str

class SubmitResponse(BaseModel):
    submission_id: str
    reference: str
    status: str
