from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

#definesc datele primite si verific camputile obligatorii
#formatul emailului
#lungimea parolei
#daca parolele coincid
class RegisterRequest(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    bank_name: str = Field(min_length=1, max_length=150)
    country: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=8, max_length=72)
    password_confirm: str = Field(min_length=8, max_length=72)

    @model_validator(mode="after")
    def passwords_match(self):
        if self.password != self.password_confirm:
            raise ValueError("Passwords do not match")

        return self


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    first_name: str
    last_name: str
    email: EmailStr
    bank_name: str
    country: str

class UserUpdateRequest(BaseModel):
    first_name: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    last_name: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    bank_name: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
    )

    country: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )