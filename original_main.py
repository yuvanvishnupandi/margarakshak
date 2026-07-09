from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from models import EvidencePayload, AgentState
from agents import build_graph, GraphState
from langchain_core.messages import HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Marga Rakshak AI Service", version="1.0")

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to actual frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the LangGraph orchestration
orchestrator_graph = build_graph()
llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash")

@app.post("/api/ai/process-evidence")
async def process_evidence(payload: EvidencePayload):
    """
    Triggers the LangGraph multi-agent orchestration for Features 1, 2, and 3.
    """
    initial_state: GraphState = {
        "agent_state": AgentState(payload=payload)
    }
    
    try:
        final_state = orchestrator_graph.invoke(initial_state)
        agent_res = final_state["agent_state"]
        
        return {
            "status": "success",
            "is_fraud": agent_res.is_fraud,
            "fraud_reason": agent_res.fraud_reason,
            "vision_validation": agent_res.vision_validation.model_dump() if agent_res.vision_validation else None,
            "challan": agent_res.final_challan.model_dump() if agent_res.final_challan else None,
            "jurisdiction_id": agent_res.jurisdiction_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ChatRequest(BaseModel):
    message: str
    mode: str  # 'citizen' or 'officer'
    current_path: str
    user_id: Optional[str] = None
    context_data: Optional[Dict[str, Any]] = None

@app.post("/api/ai/chat")
async def chat_with_marga_mitra(req: ChatRequest):
    """
    Feature 4 & 5: Conversational RAG and Floating Assistant
    """
    # Feature 4 Routing Logic
    system_prompt = "You are Marga-Mitra, the helpful AI assistant for Marga Rakshak."
    
    if req.mode == "citizen":
        if "pay" in req.current_path.lower():
            system_prompt += " The user is on the Pay Challan page. Assist them with payment queries. Mention their pending fines if context is provided."
        elif "upload" in req.current_path.lower():
            system_prompt += " The user is uploading evidence. Warn them: 'Ensure your location services are on and only one license plate is in the frame, or the AI will reject it.'"
        
        # Feature 5: Dispute Resolution Interview
        if "dispute" in req.current_path.lower():
            system_prompt += " The user is disputing a ticket. Interview them to find out why. Once they provide a reason, simulate cross-examining the evidence and drafting a legal summary brief."
            
    elif req.mode == "officer":
        system_prompt += " The user is a Traffic Officer. If they ask about disputes or data, simulate querying the TiDB database and summarizing."
        
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": req.message}
    ]
    
    try:
        response = llm.invoke([HumanMessage(content=system_prompt + "\nUser says: " + req.message)])
        return {"response": response.content}
    except Exception as e:
        # Fallback if Gemini fails or API key is missing
        return {"response": f"[Marga-Mitra AI Engine Offline]: {str(e)}"}

@app.get("/api/ai/heatmap")
async def get_predictive_heatmap():
    """
    Feature 6: Predictive Analytics Hotspot Heatmap
    In a real app, this runs XGBoost on historical TiDB data.
    """
    # Mocking predictive geo-coordinates for Bangalore
    mock_hotspots = [
        {"lat": 12.9716, "lng": 77.5946, "probability": 0.85, "predicted_violation": "No Helmet"},
        {"lat": 12.9352, "lng": 77.6245, "probability": 0.92, "predicted_violation": "Red Light"},
        {"lat": 12.9915, "lng": 77.5926, "probability": 0.76, "predicted_violation": "Wrong Way"}
    ]
    return {"hotspots": mock_hotspots}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
