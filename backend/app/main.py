from fastapi import FastAPI
app = FastAPI(title= "SafeFlow AI")

@app.get("/health")
def health_check():
    return {"status": "healthy"}