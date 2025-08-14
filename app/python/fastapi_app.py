import csv
import json
from fastapi import FastAPI, UploadFile, File

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "CostScope backend"}

@app.post("/parse/csv")
async def parse_csv(file: UploadFile = File(...)):
    contents = await file.read()
    decoded_content = contents.decode('utf-8').splitlines()
    reader = csv.DictReader(decoded_content)
    return list(reader)

@app.post("/parse/json")
async def parse_json(file: UploadFile = File(...)):
    contents = await file.read()
    return json.loads(contents)
